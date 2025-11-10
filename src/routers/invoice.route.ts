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

    this.router.post(
      "/",
      createInvoiceValidator,
      this.controller.create.bind(this.controller)
    );

    this.router.get(
      "/",
      this.controller.getAll.bind(this.controller)
    );

    this.router.get(
      "/:id",
      validateIdParam,
      this.controller.getOne.bind(this.controller)
    );

    // Endpoint khusus untuk update status (lebih baik daripada PUT)
    this.router.patch(
      "/:id/status",
      validateIdParam,
      updateInvoiceStatusValidator,
      this.controller.updateStatus.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new InvoiceRouter().router;