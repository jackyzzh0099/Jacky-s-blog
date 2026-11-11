import Link from "next/link";

import type { CategoryWithCount } from "@/lib/db/types";

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/blog?category=${category.slug}`}
          className="group relative flex min-h-[148px] flex-col justify-between border-t border-line/[0.09] pb-6 pt-4"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-px w-0 bg-accent transition-all duration-500 ease-precise group-hover:w-full"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.12em] text-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-faint transition-colors group-hover:text-accent">
              {String(category.postCount).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-6">
            <h3 className="text-[15.5px] font-medium tracking-tight text-fg transition-colors duration-300 group-hover:text-accent">
              {category.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.6] text-muted">
              {category.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
