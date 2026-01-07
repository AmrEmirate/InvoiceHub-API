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
 * Create client request body schema
 */
export const createClientBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentPreferences: z.string().optional(),
});

/**
 * Update client request body schema
 */
export const updateClientBodySchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Must be a valid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentPreferences: z.string().optional(),
});

// =============================================================================
// VALIDATION MIDDLEWARES
// =============================================================================

export const validateIdParam = validateParams(uuidParamSchema);
export const getClientsValidator = validateQuery(paginationQuerySchema);
export const createClientValidator = validate({ body: createClientBodySchema });
export const updateClientValidator = validate({ body: updateClientBodySchema });
