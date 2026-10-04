import { IsIn, IsOptional } from 'class-validator';
import { DEFAULT_SORT_ORDER } from '@/common/constants/pagination.constant';
import type { SortOrder } from '@/common/types/pagination.types';
import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Base pagination + sorting query DTO.
 *
 * Subclasses must declare `sort_by` with an `@IsIn([...])` list of the
 * columns they allow, so unknown or internal columns are rejected with a 400.
 *
 * @example
 * export class ListVehiclesQueryDto extends SortQueryDto {
 *   @IsOptional()
 *   @IsIn(['created_at', 'name'])
 *   sort_by?: 'created_at' | 'name';
 * }
 */
export abstract class SortQueryDto extends PaginationQueryDto {
  abstract sort_by?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: SortOrder = DEFAULT_SORT_ORDER;
}
