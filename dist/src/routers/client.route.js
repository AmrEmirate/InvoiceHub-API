"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = __importDefault(require("../controllers/client.controller"));
const client_validator_1 = require("../middleware/validators/client.validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
class ClientRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.controller = client_controller_1.default;
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.use(auth_middleware_1.authMiddleware);
        this.router.post("/", client_validator_1.createClientValidator, this.controller.create.bind(this.controller));
        this.router.get("/", client_validator_1.getClientsValidator, this.controller.getAll.bind(this.controller));
        this.router.get("/:id", client_validator_1.validateIdParam, this.controller.getOne.bind(this.controller));
        this.router.put("/:id", client_validator_1.validateIdParam, client_validator_1.updateClientValidator, this.controller.update.bind(this.controller));
        this.router.delete("/:id", client_validator_1.validateIdParam, this.controller.delete.bind(this.controller));
    }
}
exports.default = new ClientRouter().router;
