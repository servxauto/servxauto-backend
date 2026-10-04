export type SortOrder = 'ASC' | 'DESC';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SortQuery {
  sort_by?: string;
  sort_order?: SortOrder;
}

export type PaginatedResult<T, U = undefined> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  next: number | null;
  prev: number | null;
  meta?: U;
};
