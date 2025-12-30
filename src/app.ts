import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import logger from "./utils/logger";
import AppError from "./utils/AppError";
import mainRouter from "./routers";
import passport from "passport";
import "./config/passport";

const PORT: string = process.env.PORT as string;

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configure();
    this.route();
    this.errorHandler();
  }

  private configure(): void {
    this.app.set("trust proxy", 1);
    this.app.use(helmet());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100, 
      standardHeaders: true, 
      legacyHeaders: false, 
      message:
        "Too many requests from this IP, please try again after 15 minutes",
    });
    this.app.use(limiter);

    this.app.use(
      cors({
        origin: process.env.FE_URL,
        credentials: true,
      })
    );

    this.app.use(express.json());
    this.app.use(passport.initialize());
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private route(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).send("<h1>Classbase API</h1>");
    });

    this.app.use("/api", mainRouter);
  }

  private errorHandler(): void {
    this.app.use(
      (error: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(
          `${req.method} ${req.path}: ${error.message} ${JSON.stringify(error)}`
        );

        if (error instanceof AppError) {
          return res.status(error.code).json({
            message: error.message,
            details: error.details,
          });
        }

        res.status(500).json({
          message: "Internal Server Error",
          details: error.message,
        });
      }
    );
  }

  public start(): void {
    this.app.listen(PORT, () => {
      logger.info(`API Running: http://localhost:${PORT}`);
    });
  }
}

export default App;