// File: src/types/product.types.ts
import { Decimal } from "@prisma/client/runtime/library";

// Data yang dibutuhkan untuk membuat produk baru
export type TCreateProductInput = {
  name: string;
  description?: string;
  price: Decimal | number; // Terima number, konversi ke Decimal
  sku: string;
  categoryId: string;
  userId: string;
};

// Data yang bisa di-update
export type TUpdateProductInput = Partial<
  Omit<TCreateProductInput, "userId" | "sku"> // SKU mungkin tidak boleh diubah, atau butuh validasi unik
>;