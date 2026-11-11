/** Navigation is shared by server and client components — keep it dependency-free. */
export const NAV_LINKS = [
  { href: "/blog", label: "Writing" },
  { href: "/projects", label: "Projects" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
] as const;
