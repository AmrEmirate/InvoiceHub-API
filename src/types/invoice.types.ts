
import { InvoiceStatus } from "../generated/prisma";

export type TInvoiceItemInput = {
  description: string;
  quantity: number;
  price: number | string;
  productId?: string;
};

export type TCreateInvoiceInput = {
  clientId: string;
  invoiceNumber?: string;
  status: InvoiceStatus;
  dueDate: string | Date;
  notes?: string;
  currency?: string;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  items: TInvoiceItemInput[];
};

export type TUpdateInvoiceInput = {
  status?: InvoiceStatus;
  notes?: string;
  dueDate?: string | Date;
};