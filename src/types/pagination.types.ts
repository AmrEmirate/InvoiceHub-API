export interface PaginatedResponse<T> {
  data: T[]; // Data untuk halaman saat ini
  meta: {
    total: number; // Total semua data
    page: number; // Halaman saat ini
    limit: number; // Item per halaman
    totalPages: number; // Total halaman
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}