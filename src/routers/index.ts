// File: src/routers/index.ts
import { Router } from "express";
import AuthRouter from "./auth.route";
import ClientRouter from "./client.route"; // Kita tambahkan ini di langkah Client

const mainRouter = Router();

mainRouter.use("/auth", AuthRouter);
mainRouter.use("/clients", ClientRouter); // Daftarkan rute client

export default mainRouter;