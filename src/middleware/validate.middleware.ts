import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import AppError from "../utils/AppError";

/**
 * Request validation schema structure
 */
interface RequestSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware factory for validating requests with Zod schemas
 *
 * @param schema - Object containing optional body, query, and params schemas
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/users', validate({ body: createUserSchema }), controller.create);
 * ```
 */
export const validate = (schema: RequestSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate body if schema provided
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query if schema provided
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        // Merge parsed values back into query (preserving Express types)
        Object.assign(req.query, parsedQuery);
      }

      // Validate params if schema provided
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        // Merge parsed values back into params (preserving Express types)
        Object.assign(req.params, parsedParams);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

        return next(new AppError(400, "Validation failed", formattedErrors));
      }
      next(error);
    }
  };
};

/**
 * Helper to create a validation middleware from a single body schema
 *
 * @param schema - Zod schema for request body
 * @returns Express middleware function
 */
export const validateBody = (schema: ZodSchema) => validate({ body: schema });

/**
 * Helper to create a validation middleware from a single query schema
 *
 * @param schema - Zod schema for query parameters
 * @returns Express middleware function
 */
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });

/**
 * Helper to create a validation middleware from a single params schema
 *
 * @param schema - Zod schema for route parameters
 * @returns Express middleware function
 */
export const validateParams = (schema: ZodSchema) =>
  validate({ params: schema });
