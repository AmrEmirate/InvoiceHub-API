// File: src/types/invoice.types.ts
import { InvoiceStatus } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// Tipe data untuk satu item di dalam invoice
export type TInvoiceItemInput = {
  productId?: string; // ID produk (opsional, bisa jadi item kustom)
  description: string; // Deskripsi (bisa dari produk atau kustom)
  quantity: number;
  price: number | Decimal; // Harga per unit
};

// Data yang dibutuhkan untuk MEMBUAT invoice baru
export type TCreateInvoiceInput = {
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus; // DRAFT, SENT, PENDING, PAID, OVERDUE
  dueDate: string | Date; // Terima string, konversi ke Date
  notes?: string;
  currency?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  
  // Array dari item-item
  items: TInvoiceItemInput[];
};

// Data untuk UPDATE invoice
// (Sengaja dibuat terpisah, mungkin kita hanya boleh update status atau notes)
export type TUpdateInvoiceInput = {
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string | Date;
  // Mengupdate item biasanya lebih kompleks, jadi kita fokus pada status dulu
};