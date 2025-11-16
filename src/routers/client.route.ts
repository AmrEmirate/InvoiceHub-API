import { Router } from "express";
import ClientController from "../controllers/client.controller";
import {
  createClientValidator,
  updateClientValidator,
  validateIdParam,
  getClientsValidator, // <-- 1. IMPORT VALIDATOR BARU
} from "../middleware/validators/client.validator";
import { authMiddleware } from "../middleware/auth.middleware"; // Middleware utama kita!

class ClientRouter {
  public router: Router;
  private controller: typeof ClientController;

  constructor() {
    this.router = Router();
    this.controller = ClientController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Terapkan authMiddleware ke SEMUA rute di bawah ini
    this.router.use(authMiddleware);

    // POST /api/clients
    this.router.post(
      "/",
      createClientValidator,
      this.controller.create.bind(this.controller)
    );

    // GET /api/clients
    this.router.get(
      "/",
      getClientsValidator, // <-- 2. TERAPKAN VALIDATOR DI SINI
      this.controller.getAll.bind(this.controller)
    );

    // GET /api/clients/:id
    this.router.get(
      "/:id",
      validateIdParam,
      this.controller.getOne.bind(this.controller)
    );

    // PUT /api/clients/:id
    this.router.put(
      "/:id",
      validateIdParam,
      updateClientValidator,
      this.controller.update.bind(this.controller)
    );

    // DELETE /api/clients/:id
    this.router.delete(
      "/:id",
      validateIdParam,
      this.controller.delete.bind(this.controller)
    );
  }
}

export default new ClientRouter().router;