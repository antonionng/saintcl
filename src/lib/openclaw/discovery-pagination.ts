export type DiscoveryCatalogPage<T> = {
  entries: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type SearchableCatalogEntry = {
  id: string;
  label: string;
  description?: string | null;
};

export function paginateDiscoveryCatalog<T extends SearchableCatalogEntry>(
  entries: T[],
  options: {
    search?: string;
    page?: number;
    pageSize?: number;
  } = {},
): DiscoveryCatalogPage<T> {
  const search = options.search?.trim().toLowerCase() ?? "";
  const page = Number.isFinite(options.page) ? Math.max(1, options.page ?? 1) : 1;
  const pageSize = Number.isFinite(options.pageSize)
    ? Math.min(50, Math.max(1, options.pageSize ?? 12))
    : 12;

  const filtered = search
    ? entries.filter((entry) => {
        return (
          entry.label.toLowerCase().includes(search) ||
          entry.id.toLowerCase().includes(search) ||
          (entry.description ?? "").toLowerCase().includes(search)
        );
      })
    : entries;

  const start = (page - 1) * pageSize;

  return {
    entries: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
    hasMore: start + pageSize < filtered.length,
  };
}
