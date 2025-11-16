import { Router } from "express";
import CategoryController from "../controllers/category.controller";
import {
  createCategoryValidator,
  updateCategoryValidator,
  validateIdParam,
  getCategoriesValidator, // <-- 1. IMPORT VALIDATOR BARU
} from "../middleware/validators/category.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class CategoryRouter {
  public router: Router;
  private controller: typeof CategoryController;

  constructor() {
    this.router = Router();
    this.controller = CategoryController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware);

    this.router.post(
      "/",
      createCategoryValidator,
      this.controller.create.bind(this.controller)
    );

    // 2. TERAPKAN VALIDATOR BARU
    this.router.get(
      "/",
      getCategoriesValidator,
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
      updateCategoryValidator,
      this.controller.update.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new CategoryRouter().router;