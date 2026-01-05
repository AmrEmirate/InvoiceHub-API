import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import logger from "../utils/logger";

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      status: "connected" | "disconnected";
      latency?: number;
    };
    memory: {
      heapUsed: string;
      heapTotal: string;
      rss: string;
      external: string;
    };
  };
}

class HealthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @route GET /health
     * @desc Health check endpoint for monitoring
     * @access Public
     */
    this.router.get("/", async (req: Request, res: Response) => {
      const startTime = Date.now();
      let dbStatus: "connected" | "disconnected" = "disconnected";
      let dbLatency: number | undefined;

      // Check database connection
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - dbStart;
        dbStatus = "connected";
      } catch (error) {
        logger.error("Health check: Database connection failed");
        dbStatus = "disconnected";
      }

      // Memory usage
      const memoryUsage = process.memoryUsage();
      const formatBytes = (bytes: number): string => {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      };

      const healthResponse: HealthCheckResponse = {
        status: dbStatus === "connected" ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
        checks: {
          database: {
            status: dbStatus,
            latency: dbLatency,
          },
          memory: {
            heapUsed: formatBytes(memoryUsage.heapUsed),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            rss: formatBytes(memoryUsage.rss),
            external: formatBytes(memoryUsage.external),
          },
        },
      };

      const statusCode = healthResponse.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(healthResponse);
    });

    /**
     * @route GET /health/live
     * @desc Liveness probe for Kubernetes
     * @access Public
     */
    this.router.get("/live", (req: Request, res: Response) => {
      res.status(200).json({ status: "alive" });
    });

    /**
     * @route GET /health/ready
     * @desc Readiness probe for Kubernetes
     * @access Public
     */
    this.router.get("/ready", async (req: Request, res: Response) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: "ready" });
      } catch (error) {
        res
          .status(503)
          .json({ status: "not ready", reason: "database unavailable" });
      }
    });
  }
}

export default new HealthRouter().router;
