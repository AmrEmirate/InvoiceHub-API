import { Router } from "express";
import AuthRouter from "./auth.route";
import ClientRouter from "./client.route";
import CategoryRouter from "./category.route";
import ProductRouter from "./product.route";
import InvoiceRouter from "./invoice.route";
import UploadRouter from "./upload.route";

const mainRouter = Router();

mainRouter.use("/auth", AuthRouter);
mainRouter.use("/clients", ClientRouter);
mainRouter.use("/categories", CategoryRouter);
mainRouter.use("/products", ProductRouter);
mainRouter.use("/invoices", InvoiceRouter);
mainRouter.use("/uploads", UploadRouter);

export default mainRouter;