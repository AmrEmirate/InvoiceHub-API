import { Router } from "express";
import InvoiceController from "../controllers/invoice.controller";
import {
  createInvoiceValidatorV2 as createInvoiceValidator,
  updateInvoiceStatusValidator,
  validateIdParam,
  getInvoicesValidator,
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
    this.router.use(authMiddleware);

    this.router.get(
      "/stats",
      this.controller.getDashboardStats.bind(this.controller)
    );

    this.router.get(
      "/stats/chart",
      this.controller.getChartStats.bind(this.controller)
    );

    this.router.post(
      "/",
      createInvoiceValidator,
      this.controller.create.bind(this.controller)
    );

    this.router.get(
      "/",
      getInvoicesValidator,
      this.controller.getAll.bind(this.controller)
    );

    this.router.get(
      "/:id",
      validateIdParam,
      this.controller.getOne.bind(this.controller)
    );

    this.router.patch(
      "/:id/status",
      validateIdParam,
      updateInvoiceStatusValidator,
      this.controller.updateStatus.bind(this.controller)
    );
    
    this.router.post(
      "/:id/send",
      validateIdParam,
      this.controller.sendEmail.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new InvoiceRouter().router;