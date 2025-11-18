import { Router } from "express";
import ClientController from "../controllers/client.controller";
import {
  createClientValidator,
  updateClientValidator,
  validateIdParam,
  getClientsValidator,
} from "../middleware/validators/client.validator";
import { authMiddleware } from "../middleware/auth.middleware";

class ClientRouter {
  public router: Router;
  private controller: typeof ClientController;

  constructor() {
    this.router = Router();
    this.controller = ClientController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.use(authMiddleware);

    this.router.post(
      "/",
      createClientValidator,
      this.controller.create.bind(this.controller)
    );

    this.router.get(
      "/",
        getClientsValidator,
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
      updateClientValidator,
      this.controller.update.bind(this.controller)
    );

    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new ClientRouter().router;