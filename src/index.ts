// File: src/routes/index.ts
import { Router } from "express";
import AuthRouter from "./routers/auth.route";

const mainRouter = Router();

mainRouter.use("/auth", AuthRouter);
// mainRouter.use("/clients", ClientRouter); // Nanti
// mainRouter.use("/products", ProductRouter); // Nanti

export default mainRouter;