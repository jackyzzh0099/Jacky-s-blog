import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { slugify } from "./utils";

export const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

const EXT_BY_MIME: Record<AllowedMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export function getMaxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 8);
  return (Number.isFinite(mb) && mb > 0 ? mb : 8) * 1024 * 1024;
}

export function getStorageRoot(): string {
  const configured = process.env.STORAGE_DIR ?? "./storage/uploads";
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function publicUrlForKey(key: string): string {
  const base = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${key}` : `/api/media/${key}`;
}

/* ── Content sniffing ──────────────────────────────────────────────────────── */

function sniffMime(buffer: Buffer): AllowedMime | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  const head6 = buffer.subarray(0, 6).toString("ascii");
  if (head6 === "GIF87a" || head6 === "GIF89a") return "image/gif";

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  const head = buffer.subarray(0, 512).toString("utf8").trimStart();
  if (/^<\?xml[\s\S]*?<svg[\s>]/i.test(head) || /^<svg[\s>]/i.test(head)) {
    return "image/svg+xml";
  }

  return null;
}

/* ── Image dimensions ──────────────────────────────────────────────────────── */

function pngSize(b: Buffer) {
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function gifSize(b: Buffer) {
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function webpSize(b: Buffer): { width: number; height: number } | null {
  const chunk = b.subarray(12, 16).toString("ascii");
  if (chunk === "VP8 ") {
    return {
      width: b.readUInt16LE(26) & 0x3fff,
      height: b.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8X") {
    return {
      width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
      height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
    };
  }
  return null;
}

function jpegSize(b: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < b.length - 9) {
    if (b[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = b[offset + 1];
    const length = b.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        height: b.readUInt16BE(offset + 5),
        width: b.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function imageSize(
  buffer: Buffer,
  mime: AllowedMime,
): { width: number | null; height: number | null } {
  try {
    if (mime === "image/png") return pngSize(buffer);
    if (mime === "image/gif") return gifSize(buffer);
    if (mime === "image/webp") return webpSize(buffer) ?? { width: null, height: null };
    if (mime === "image/jpeg") return jpegSize(buffer) ?? { width: null, height: null };

    const svg = buffer.toString("utf8", 0, 2048);
    const viewBox = /viewBox=["']([\d.\-\s]+)["']/i.exec(svg);
    if (viewBox) {
      const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) return { width: parts[2], height: parts[3] };
    }
    const width = /<svg[^>]*\swidth=["']([\d.]+)/i.exec(svg);
    const height = /<svg[^>]*\sheight=["']([\d.]+)/i.exec(svg);
    return {
      width: width ? Number(width[1]) : null,
      height: height ? Number(height[1]) : null,
    };
  } catch {
    return { width: null, height: null };
  }
}

/* ── SVG sanitisation ──────────────────────────────────────────────────────── *
 * SVG is the only format here that can carry executable content. We strip the
 * dangerous surface, then refuse anything that still looks active. Files are
 * additionally served with a locked-down CSP (see /api/media).
 * ─────────────────────────────────────────────────────────────────────────── */

export function sanitizeSvg(source: string): string {
  let svg = source;

  // Remove doctypes/entities that can be used for XXE or entity expansion.
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  svg = svg.replace(/<!ENTITY[\s\S]*?>/gi, "");

  // Remove active containers wholesale.
  svg = svg.replace(
    /<(script|foreignObject|iframe|embed|object|audio|video|handler)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  svg = svg.replace(/<(script|iframe|embed|object|handler)\b[^>]*\/?>/gi, "");

  // Strip event handlers and script-bearing attribute values.
  svg = svg.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  svg = svg.replace(
    /\s(?:xlink:)?href\s*=\s*("|')\s*(?:javascript|data:text\/html|vbscript):[^"']*\1/gi,
    "",
  );
  svg = svg.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, (match) =>
    /expression|javascript:|behaviou?r\s*:/i.test(match) ? "" : match,
  );

  if (/<script|javascript:|data:text\/html|<!entity/i.test(svg)) {
    throw new Error("SVG contains active content and was rejected.");
  }

  return svg.trim();
}

/* ── Upload pipeline ───────────────────────────────────────────────────────── */

export interface StoredFile {
  key: string;
  filename: string;
  url: string;
  mime: AllowedMime;
  size: number;
  width: number | null;
  height: number | null;
  originalName: string;
}

const MAX_ORIGINAL_NAME = 160;

export function safeOriginalName(name: string): string {
  return (
    path
      .basename(name)
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, MAX_ORIGINAL_NAME) || "upload"
  );
}

export async function saveUpload(file: File): Promise<StoredFile> {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.byteLength === 0) throw new Error("The file is empty.");
  if (bytes.byteLength > getMaxUploadBytes()) {
    throw new Error(
      `File exceeds the ${Math.round(getMaxUploadBytes() / 1024 / 1024)} MB limit.`,
    );
  }

  const sniffed = sniffMime(bytes);
  if (!sniffed) {
    throw new Error("Unsupported file type. Use PNG, JPEG, WEBP, GIF or SVG.");
  }

  const declared = (file.type || "").toLowerCase();
  const declaredNormalised = declared === "image/jpg" ? "image/jpeg" : declared;
  if (declaredNormalised && declaredNormalised !== sniffed) {
    throw new Error("File content does not match its declared type.");
  }

  const originalName = safeOriginalName(file.name || `upload.${EXT_BY_MIME[sniffed]}`);
  const base = slugify(originalName.replace(/\.[^.]+$/, "")) || "image";
  const stamp = new Date();
  const folder = `${stamp.getUTCFullYear()}/${String(stamp.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${base.slice(0, 48)}-${crypto.randomBytes(4).toString("hex")}.${EXT_BY_MIME[sniffed]}`;
  const key = `${folder}/${filename}`;

  const payload =
    sniffed === "image/svg+xml"
      ? Buffer.from(sanitizeSvg(bytes.toString("utf8")), "utf8")
      : bytes;

  const absolute = path.join(getStorageRoot(), key);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, payload, { mode: 0o640 });

  const size = imageSize(payload, sniffed);

  return {
    key,
    filename,
    url: publicUrlForKey(key),
    mime: sniffed,
    size: payload.byteLength,
    width: size.width,
    height: size.height,
    originalName,
  };
}

export async function removeUpload(key: string): Promise<void> {
  const root = path.resolve(getStorageRoot());
  const absolute = path.resolve(path.join(root, key));
  if (!absolute.startsWith(root + path.sep)) {
    throw new Error("Refusing to delete outside the storage root.");
  }
  await fs.rm(absolute, { force: true });
}

export async function readUpload(key: string): Promise<Buffer | null> {
  const root = path.resolve(getStorageRoot());
  const absolute = path.resolve(path.join(root, key));
  if (!absolute.startsWith(root + path.sep)) return null;
  try {
    return await fs.readFile(absolute);
  } catch {
    return null;
  }
}
