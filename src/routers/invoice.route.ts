// File: src/routers/invoice.route.ts
import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import {
  createInvoiceValidator,
  updateInvoiceStatusValidator,
  validateIdParam,
} from "../middleware/validators/invoice.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class InvoiceRouter {
  public router: Router;
  private controller: typeof InvoiceController;

  constructor() {
    this.router = Router();
    this.controller = InvoiceController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan authMiddleware ke SEMUA rute di bawah ini
    this.router.use(authMiddleware);

    // ... (Route POST /, GET /, GET /:id) ...

    // Endpoint khusus untuk update status
    this.router.patch(
      "/:id/status",
      validateIdParam,
      updateInvoiceStatusValidator,
      this.controller.updateStatus.bind(this.controller)
    );

    // --- TAMBAHKAN RUTE BARU DI SINI ---
    // Endpoint untuk mengirim email
    this.router.post(
      "/:id/send",
      validateIdParam,
      this.controller.sendEmail.bind(this.controller)
    );
    // --- AKHIR RUTE BARU ---

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new InvoiceRouter().router;