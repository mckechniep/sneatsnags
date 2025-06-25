import { PaginationQuery, PaginationResult } from "../types/api";

export const getPaginationParams = (query: PaginationQuery) => {
  const page = Math.max(1, parseInt(query.page || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20")));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
