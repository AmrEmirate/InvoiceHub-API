import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import {
  createInvoiceValidator,
  updateInvoiceStatusValidator,
  validateIdParam,
  getInvoicesValidator,
} from "../middleware/validators/invoice.validator";
import { authMiddleware } from "../middleware/auth.middleware"; // Impor instance middleware

class InvoiceRouter {
  public router: Router;
  private controller: typeof InvoiceController;

  constructor() {
    this.router = Router();
    this.controller = InvoiceController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan middleware autentikasi ke SEMUA rute invoice
    this.router.use(authMiddleware);

    // --- Rute Statistik (BARU) ---
    // GET /api/v1/invoices/stats
    this.router.get(
      "/stats",
      this.controller.getDashboardStats.bind(this.controller)
    );

    // GET /api/v1/invoices/stats/chart
    this.router.get(
      "/stats/chart",
      this.controller.getChartStats.bind(this.controller)
    );

    // --- Rute CRUD Invoice ---
    // POST /api/v1/invoices
    this.router.post(
      "/",
      createInvoiceValidator,
      this.controller.create.bind(this.controller)
    );

    // GET /api/v1/invoices
    this.router.get(
      "/",
      getInvoicesValidator,
      this.controller.getAll.bind(this.controller)
    );

    // GET /api/v1/invoices/:id
    this.router.get(
      "/:id",
      validateIdParam,
      this.controller.getOne.bind(this.controller)
    );

    // PATCH /api/v1/invoices/:id/status
    this.router.patch(
      "/:id/status",
      validateIdParam,
      updateInvoiceStatusValidator,
      this.controller.updateStatus.bind(this.controller)
    );
    
    // POST /api/v1/invoices/:id/send
    this.router.post(
      "/:id/send",
      validateIdParam,
      this.controller.sendEmail.bind(this.controller)
    );

    // DELETE /api/v1/invoices/:id
    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new InvoiceRouter().router;