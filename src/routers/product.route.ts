// File: src/routers/product.route.ts
import { Router } from "express";
import ProductController from "../controllers/product.controller";
import {
  createProductValidator,
  updateProductValidator,
  validateIdParam,
} from "../middleware/validators/product.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class ProductRouter {
  public router: Router;
  private controller: typeof ProductController;

  constructor() {
    this.router = Router();
    this.controller = ProductController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan authMiddleware ke SEMUA rute di bawah ini
    this.router.use(authMiddleware);

    this.router.post(
      "/",
      createProductValidator,
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

    this.router.put(
      "/:id",
      validateIdParam,
      updateProductValidator,
      this.controller.update.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new ProductRouter().router;