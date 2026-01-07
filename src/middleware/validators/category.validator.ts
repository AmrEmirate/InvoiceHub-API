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
 * Pagination query schema
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
});

/**
 * Create category request body schema
 */
export const createCategoryBodySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

/**
 * Update category request body schema
 */
export const updateCategoryBodySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
});

// =============================================================================
// VALIDATION MIDDLEWARES
// =============================================================================

export const validateIdParam = validateParams(uuidParamSchema);
export const getCategoriesValidator = validateQuery(paginationQuerySchema);
export const createCategoryValidator = validate({
  body: createCategoryBodySchema,
});
export const updateCategoryValidator = validate({
  body: updateCategoryBodySchema,
});
