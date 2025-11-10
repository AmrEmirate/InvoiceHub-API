// File: src/routers/index.ts (DIPERBARUI)
import { Router } from "express";
import AuthRouter from "./auth.route";
import ClientRouter from "./client.route";
import CategoryRouter from "./category.route"; // <-- 1. IMPORT BARU

const mainRouter = Router();

mainRouter.use("/auth", AuthRouter);
mainRouter.use("/clients", ClientRouter);
mainRouter.use("/categories", CategoryRouter); // <-- 2. DAFTARKAN RUTE BARU

export default mainRouter;