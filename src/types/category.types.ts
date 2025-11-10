// File: src/types/category.types.ts

// Data yang dibutuhkan untuk membuat kategori baru
export type TCreateCategoryInput = {
  name: string;
  userId: string; // ID dari user yang memiliki kategori ini
};

// Data yang bisa di-update
export type TUpdateCategoryInput = Partial<Omit<TCreateCategoryInput, "userId">>;