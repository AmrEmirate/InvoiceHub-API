import { Decimal } from "@prisma/client/runtime/library";

export type TCreateProductInput = {
  name: string;
  description?: string;
  price: Decimal | number;
  sku: string;
  categoryId: string;
  userId: string;
};

export type TUpdateProductInput = Partial<
  Omit<TCreateProductInput, "userId" | "sku">
>;