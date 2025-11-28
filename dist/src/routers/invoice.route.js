"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = __importDefault(require("../controllers/invoice.controller"));
const invoice_validator_1 = require("../middleware/validators/invoice.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
class InvoiceRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = invoice_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.get("/stats", this.controller.getDashboardStats.bind(this.controller));
        this.router.get("/stats/chart", this.controller.getChartStats.bind(this.controller));
        this.router.post("/", invoice_validator_1.createInvoiceValidatorV2, this.controller.create.bind(this.controller));
        this.router.get("/", invoice_validator_1.getInvoicesValidator, this.controller.getAll.bind(this.controller));
        this.router.get("/:id", invoice_validator_1.validateIdParam, this.controller.getOne.bind(this.controller));
        this.router.patch("/:id/status", invoice_validator_1.validateIdParam, invoice_validator_1.updateInvoiceStatusValidator, this.controller.updateStatus.bind(this.controller));
        this.router.post("/:id/send", invoice_validator_1.validateIdParam, this.controller.sendEmail.bind(this.controller));
        this.router.delete("/:id", invoice_validator_1.validateIdParam, this.controller.delete.bind(this.controller));
    }
}
exports.default = new InvoiceRouter().router;
