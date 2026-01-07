import dotenv from "dotenv";
dotenv.config();
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import logger from "./utils/logger";
import AppError from "./utils/AppError";
import { getErrorMessage, HttpStatusCode } from "./types/error.types";
import mainRouter from "./routers";
import passport from "passport";
import swaggerSpec from "./config/swagger";
import { generalLimiter } from "./middleware/rate-limit.middleware";
import { FILE_UPLOAD_CONSTANTS } from "./config/constants";
import "./config/passport";

const PORT: string = process.env.PORT as string;

/**
 * Express Application class
 * Handles all middleware configuration, routing, and error handling
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configure();
    this.route();
    this.errorHandler();
  }

  /**
   * Configure middleware
   */
  private configure(): void {
    // Trust proxy for rate limiting behind reverse proxy
    this.app.set("trust proxy", 1);

    // Enable gzip compression for responses
    this.app.use(compression());

    // Security headers
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false, // Required for Swagger UI
      })
    );

    // General rate limiting (uses centralized config)
    this.app.use(generalLimiter);

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.FE_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Body parsing (uses centralized constants)
    this.app.use(express.json({ limit: FILE_UPLOAD_CONSTANTS.MAX_BODY_SIZE }));
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: FILE_UPLOAD_CONSTANTS.MAX_BODY_SIZE,
      })
    );

    // Cookie parser for HttpOnly JWT cookies
    this.app.use(cookieParser());

    // Passport authentication
    this.app.use(passport.initialize());

    // Request logging with request ID
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      res.setHeader("X-Request-ID", requestId);
      logger.info(`[${requestId}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configure routes
   */
  private route(): void {
    // Root endpoint
    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).json({
        name: "InvoiceHub API",
        version: "1.0.0",
        documentation: "/api-docs",
        health: "/api/health",
      });
    });

    // Swagger documentation (disable in production if needed)
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "InvoiceHub API Documentation",
      })
    );

    // API routes
    this.app.use("/api", mainRouter);

    // 404 handler for unmatched routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        message: `Route ${req.method} ${req.path} not found`,
        code: "ROUTE_NOT_FOUND",
      });
    });
  }

  /**
   * Global error handler
   */
  private errorHandler(): void {
    this.app.use(
      (error: unknown, req: Request, res: Response, _next: NextFunction) => {
        const requestId = res.getHeader("X-Request-ID") || "unknown";

        // Log error with context
        logger.error(
          `[${requestId}] ${req.method} ${req.path}: ${getErrorMessage(error)}`
        );

        // Handle AppError (operational errors)
        if (error instanceof AppError) {
          return res.status(error.code).json(error.toJSON());
        }

        // Handle unknown errors (don't expose details in production)
        const statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
        const response: Record<string, unknown> = {
          message: "Internal Server Error",
          code: "INTERNAL_ERROR",
        };

        // Include error details only in development
        if (process.env.NODE_ENV !== "production") {
          response.details = getErrorMessage(error);
          if (error instanceof Error && error.stack) {
            response.stack = error.stack;
          }
        }

        res.status(statusCode).json(response);
      }
    );
  }

  /**
   * Start the server
   */
  public start(): void {
    this.app.listen(PORT, () => {
      logger.info(`🚀 InvoiceHub-API Running: http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`❤️ Health: http://localhost:${PORT}/api/health`);
    });
  }
}

export default App;
