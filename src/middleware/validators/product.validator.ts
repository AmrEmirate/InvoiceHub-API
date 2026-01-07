import { z } from "zod";
import {
  validate,
  validateParams,
  validateQuery,
} from "../validate.middleware";

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
 * Pagination query with category filter schema
 */
export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  categoryId: z.string().uuid("Invalid Category ID format").optional(),
});

/**
 * Create product request body schema
 */
export const createProductBodySchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  categoryId: z.string().uuid("Invalid category ID format"),
  description: z.string().optional(),
});

/**
 * Update product request body schema
 */
export const updateProductBodySchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  price: z.coerce.number().min(0, "Price must be a positive number").optional(),
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  description: z.string().optional(),
});

// =============================================================================
// VALIDATION MIDDLEWARES
// =============================================================================

export const validateIdParam = validateParams(uuidParamSchema);
export const getProductsValidator = validateQuery(getProductsQuerySchema);
export const createProductValidator = validate({
  body: createProductBodySchema,
});
export const updateProductValidator = validate({
  body: updateProductBodySchema,
});
