import { InvoiceStatus } from "../generated/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export type TInvoiceItemInput = {
  productId?: string;
  description: string;
  quantity: number;
  price: number | Decimal;
};

export type TCreateInvoiceInput = {
  clientId: string;
  invoiceNumber: string;
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