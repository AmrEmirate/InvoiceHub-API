import { z } from "zod";
import {
  validate,
  validateParams,
  validateQuery,
} from "../validate.middleware";
import { InvoiceStatus } from "@prisma/client";

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * UUID parameter schema
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

/**
 * Invoice status enum values
 */
const invoiceStatusValues = Object.values(InvoiceStatus) as [
  string,
  ...string[]
];

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Item quantity must be a positive integer"),
  price: z.coerce.number().min(0, "Item price must be a positive number"),
  productId: z.string().uuid("Invalid product ID format").optional().nullable(),
});

/**
 * Create invoice request body schema
 */
export const createInvoiceBodySchema = z.object({
  clientId: z.string().uuid("Invalid client ID format"),
  invoiceNumber: z.string().optional(),
  dueDate: z.coerce.date(),
  status: z.enum(invoiceStatusValues).optional(),
  notes: z.string().optional(),
  currency: z.string().default("IDR"),
  isRecurring: z.boolean().default(false),
  recurrenceInterval: z.string().optional(),
  autoSendEmail: z.boolean().default(false),
  paymentTermDays: z.number().int().optional(),
  recurrenceDay: z.number().int().min(1).max(31).optional(),
  items: z
    .array(invoiceItemSchema)
    .min(1, "Invoice must have at least one item"),
});

/**
 * Update invoice status request body schema
 */
export const updateInvoiceStatusBodySchema = z.object({
  status: z.enum(invoiceStatusValues, {
    message: "Invalid status",
  }),
});

/**
 * Get invoices query schema
 */
export const getInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  status: z.enum(invoiceStatusValues).optional(),
  clientId: z.string().uuid("Invalid Client ID format").optional(),
  search: z.string().optional(),
});

// =============================================================================
// VALIDATION MIDDLEWARES
// =============================================================================

export const validateIdParam = validateParams(uuidParamSchema);
export const getInvoicesValidator = validateQuery(getInvoicesQuerySchema);
export const createInvoiceValidatorV2 = validate({
  body: createInvoiceBodySchema,
});
export const updateInvoiceStatusValidator = validate({
  body: updateInvoiceStatusBodySchema,
});
