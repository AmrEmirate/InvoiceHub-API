// File: src/app.ts (Diperbarui)
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import logger from "./utils/logger"; // <-- IMPORT LOGGER // <-- IMPORT ROUTER UTAMA
import AppError from "./utils/AppError"; // <-- IMPORT AppError
import mainRouter from ".";

const PORT: string = process.env.PORT || "8181";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configure();
    this.route();
    this.errorHandler(); // Pastikan error handler dipanggil setelah route
  }

  private configure(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private route(): void {
    this.app.get("/", (req: Request, res: Response) => {
      res.status(200).send("<h1>Classbase API</h1>");
    });

    // DAFTARKAN SEMUA API ROUTES DI BAWAH /api
    this.app.use("/api", mainRouter); // <-- GUNAKAN ROUTER UTAMA
  }

  private errorHandler(): void {
    this.app.use(
      (error: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(
          `${req.method} ${req.path}: ${error.message} ${JSON.stringify(error)}`
        );
        
        // Cek jika error adalah AppError kustom kita
        if (error instanceof AppError) {
          return res.status(error.code).json({
            message: error.message,
            details: error.details,
          });
        }

        // Error bawaan server
        res.status(500).json({
          message: "Internal Server Error",
          details: error.message,
        });
      }
    );
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`API Running: http://localhost:${PORT}`);
    });
  }
}

export default App;