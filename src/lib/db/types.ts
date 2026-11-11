export type PostStatus = "draft" | "published";
export type ProjectStatus = "active" | "beta" | "wip" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: string;
  sortOrder: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface CategoryWithCount extends Category {
  postCount: number;
}

export interface TagWithCount extends Tag {
  postCount: number;
}

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  cover: string | null;
  category_id: string | null;
  status: PostStatus;
  featured: number;
  reading_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post extends Omit<PostRow, "featured"> {
  featured: boolean;
  category: Category | null;
  tags: Tag[];
}

export interface PostSummary
  extends Omit<Post, "content" | "category_id"> {}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover: string | null;
  repo_url: string | null;
  demo_url: string | null;
  stack: string;
  status: string;
  year: string;
  featured: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Project extends Omit<ProjectRow, "stack" | "featured"> {
  stack: string[];
  featured: boolean;
}

export interface MediaItem {
  id: string;
  storage_key: string;
  original_name: string;
  filename: string;
  url: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  folder: string;
  created_at: string;
}

export interface PostQuery {
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  q?: string;
  featuredOnly?: boolean;
  status?: PostStatus | "all";
  sort?: "newest" | "updated";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ActivityEntry {
  id: string;
  kind: "post" | "project";
  title: string;
  href: string;
  status: string;
  date: string;
  meta: string;
}

export interface SiteStats {
  posts: number;
  drafts: number;
  projects: number;
  categories: number;
  tags: number;
  lastUpdated: string | null;
}

export interface SearchHit {
  id: string;
  type: "post" | "project";
  title: string;
  excerpt: string;
  href: string;
  category?: string;
  tags?: string[];
  date: string;
  score: number;
}
