import { ApiPaginatedResponse, PaginationMeta } from '../interfaces/api-response.interface';

export function toPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): ApiPaginatedResponse<T> {
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
  return { statusCode: 200, data, meta };
}
