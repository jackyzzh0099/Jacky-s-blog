import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Instrument } from "./instrument";
import { Reveal } from "@/components/site/reveal";
import { Eyebrow } from "@/components/site/section-heading";
import { formatDateUpper } from "@/lib/utils";

export function Hero({
  articles,
  projects,
  fields,
  lastUpdated,
  topics,
}: {
  articles: number;
  projects: number;
  fields: number;
  lastUpdated: string | null;
  topics: string[];
}) {
  const stats = [
    { label: "Articles", value: String(articles).padStart(2, "0") },
    { label: "Projects", value: String(projects).padStart(2, "0") },
    { label: "Fields", value: String(fields).padStart(2, "0") },
    {
      label: "Last update",
      value: lastUpdated ? formatDateUpper(lastUpdated) : "—",
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] grid-backdrop opacity-80"
        aria-hidden="true"
      />
      <div className="noise" aria-hidden="true" />

      <div className="container-page relative">
        <div className="grid items-center gap-14 pb-16 pt-14 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-10 lg:pb-24">
          <div>
            <Reveal>
              <Eyebrow>Personal technical archive — est. 2026</Eyebrow>
            </Reveal>

            <h1 className="mt-7 text-[clamp(2.55rem,6.4vw,4.35rem)] font-semibold leading-[0.97] tracking-[-0.045em] text-fg">
              <Reveal as="span" className="block" delay={60}>
                Exploring the
              </Reveal>
              <Reveal as="span" className="block" delay={120}>
                <span className="relative inline-block">
                  foundations
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-accent/70"
                  />
                </span>{" "}
                of
              </Reveal>
              <Reveal as="span" className="block text-muted" delay={180}>
                technology.
              </Reveal>
            </h1>

            <Reveal delay={240}>
              <p className="mt-7 max-w-[46ch] text-[14.5px] leading-[1.75] text-muted">
                I&apos;m Jacky — a systems engineer writing about the layers
                underneath the abstractions: operating systems, distributed
                systems, security, embedded hardware, and the occasional detour
                into film photography. Everything here is written to be re-read.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="btn btn-primary group">
                  Explore the archive
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                    strokeWidth={1.9}
                  />
                </Link>
                <Link href="/projects" className="btn btn-ghost group">
                  View projects
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px"
                    strokeWidth={1.9}
                  />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={360}>
              <dl className="mt-12 grid grid-cols-2 gap-y-6 border-t border-line/[0.09] pt-6 sm:grid-cols-4 sm:gap-0">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={
                      index > 0
                        ? "sm:border-l sm:border-line/[0.08] sm:pl-5"
                        : "sm:pr-5"
                    }
                  >
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                      {stat.label}
                    </dt>
                    <dd className="mt-1.5 text-[17px] font-medium tabular tracking-tight text-fg">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={200} className="hidden lg:block">
            <Instrument
              articleCount={articles}
              projectCount={projects}
              lastUpdated={
                lastUpdated ? formatDateUpper(lastUpdated) : "2026"
              }
            />
          </Reveal>
        </div>
      </div>

      <div className="relative overflow-hidden border-y border-line/[0.07] py-3">
        <div className="flex w-max animate-marquee gap-7 pr-7 will-change-transform">
          {[...topics, ...topics].map((topic, index) => (
            <span
              key={`${topic}-${index}`}
              className="flex items-center gap-7 font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
            >
              {topic}
              <span className="text-accent/60" aria-hidden="true">
                /
              </span>
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent" />
      </div>
    </section>
  );
}
