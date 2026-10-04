import {
  EntityMetadata,
  FindManyOptions,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_ORDER,
  MAX_PAGE_SIZE,
} from '@/common/constants/pagination.constant';
import {
  PaginatedResult,
  PaginationQuery,
  SortQuery,
} from '@/common/types/pagination.types';
import { InvalidRequestException } from '@/core/exceptions/app-http.exception';

export type PaginateOptions = PaginationQuery & SortQuery;

type RepositoryPaginateOptions<T> = Omit<FindManyOptions<T>, 'skip' | 'take'> &
  PaginateOptions;

/**
 * Paginates a TypeORM repository query.
 *
 * Sorting: `sort_by` / `sort_order` (from the request) take precedence over
 * the caller's `order`; the primary key is always appended as a tiebreaker
 * so rows never repeat or go missing between pages.
 *
 * @example
 * return paginate(this.vehicleRepo, { ...query, where: { owner_id } });
 */
export async function paginate<T extends ObjectLiteral, U = undefined>(
  repo: Repository<T>,
  options: RepositoryPaginateOptions<T>,
  meta?: U,
): Promise<PaginatedResult<T, U>> {
  const { page, limit, sort_by, sort_order, order, ...findOptions } = options;
  const { skip, take, currentPage } = normalizePagination({ page, limit });
  const direction = sort_order ?? DEFAULT_SORT_ORDER;

  const orderEntries: [string, unknown][] = sort_by
    ? [[resolveSortColumn(repo.metadata, sort_by), direction]]
    : Object.entries(order ?? {});

  for (const column of primaryColumns(repo.metadata)) {
    if (!orderEntries.some(([key]) => key === column)) {
      orderEntries.push([column, direction]);
    }
  }

  const [items, total] = await repo.findAndCount({
    ...findOptions,
    order: Object.fromEntries(orderEntries) as FindOptionsOrder<T>,
    skip,
    take,
  });

  return buildResult(items, total, currentPage, take, meta);
}

/**
 * Paginates a TypeORM query builder, for queries the repository API can't
 * express (joins with filters, search across relations, computed conditions).
 * The given query builder is cloned, never mutated.
 *
 * @example
 * const qb = this.vehicleRepo
 *   .createQueryBuilder('vehicle')
 *   .leftJoinAndSelect('vehicle.owner', 'owner')
 *   .where('owner.name ILIKE :q', { q: `%${search}%` });
 * return paginateQuery(qb, query);
 */
export async function paginateQuery<T extends ObjectLiteral, U = undefined>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginateOptions,
  meta?: U,
): Promise<PaginatedResult<T, U>> {
  const { skip, take, currentPage } = normalizePagination(options);
  const direction = options.sort_order ?? DEFAULT_SORT_ORDER;

  const qb = queryBuilder.clone();
  const alias = qb.alias;
  const metadata = qb.expressionMap.mainAlias?.metadata;

  if (!metadata) {
    throw new Error('paginateQuery requires a query builder with an entity');
  }

  if (options.sort_by) {
    const column = resolveSortColumn(metadata, options.sort_by);
    qb.orderBy(`${alias}.${column}`, direction);
  }

  for (const column of primaryColumns(metadata)) {
    const key = `${alias}.${column}`;
    if (!(key in qb.expressionMap.orderBys)) {
      qb.addOrderBy(key, direction);
    }
  }

  const [items, total] = await qb.skip(skip).take(take).getManyAndCount();

  return buildResult(items, total, currentPage, take, meta);
}

/**
 * Clamps page/limit to sane integers and converts them to skip/take.
 */
function normalizePagination({ page, limit }: PaginationQuery) {
  const currentPage = Math.max(1, Math.floor(Number(page)) || DEFAULT_PAGE);
  const take = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(Number(limit)) || DEFAULT_PAGE_SIZE),
  );

  return { currentPage, take, skip: (currentPage - 1) * take };
}

/**
 * Ensures `sort_by` is a real column of the entity. DTOs validate this with
 * `@IsIn`, but this guards direct calls and keeps bad input a 400, not a 500.
 */
function resolveSortColumn(metadata: EntityMetadata, sortBy: string): string {
  const column = metadata.findColumnWithPropertyPath(sortBy);

  if (!column) {
    throw new InvalidRequestException(`Cannot sort by "${sortBy}"`);
  }

  return column.propertyPath;
}

function primaryColumns(metadata: EntityMetadata): string[] {
  return metadata.primaryColumns.map((column) => column.propertyPath);
}

function buildResult<T, U>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  meta?: U,
): PaginatedResult<T, U> {
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    limit,
    total_pages: totalPages,
    next: page < totalPages ? page + 1 : null,
    // past the last page, point back to the last real page
    prev: page > 1 && totalPages > 0 ? Math.min(page - 1, totalPages) : null,
    meta,
  };
}
