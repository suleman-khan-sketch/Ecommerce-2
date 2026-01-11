import { Database } from "@/types/supabase";
import { Pagination } from "@/types/pagination";

type PublicSchema = Database["public"];
type PublicTables = PublicSchema["Tables"];

interface RangeableQuery<T> {
  range(from: number, to: number): PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>;
}

type Props<TableData> = {
  page: number;
  limit: number;
  name: keyof PublicTables;
  query: RangeableQuery<TableData>;
};

type Response<TableData> = {
  data: TableData[];
  pagination: Pagination;
};

export async function queryPaginatedTable<TableData>({
  page,
  limit,
  name,
  query,
}: Props<TableData>): Promise<Response<TableData>> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error(`Error fetching ${name}:`, error.message);
    throw new Error(`Error fetching from table '${name}': ${error.message}`);
  }

  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const prevPage = currentPage > 1 ? currentPage - 1 : null;

  return {
    data: data ?? [],
    pagination: {
      limit,
      current: currentPage,
      items: totalItems,
      pages: totalPages,
      next: nextPage,
      prev: prevPage,
    },
  };
}
