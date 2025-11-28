"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("./utils/logger"));
const AppError_1 = __importDefault(require("./utils/AppError"));
const routers_1 = __importDefault(require("./routers"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const PORT = process.env.PORT || "2020";
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.configure();
        this.route();
        this.errorHandler();
    }
    configure() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(passport_1.default.initialize());
        this.app.use((req, res, next) => {
            logger_1.default.info(`${req.method} ${req.path}`);
            next();
        });
    }
    route() {
        this.app.get("/", (req, res) => {
            res.status(200).send("<h1>Classbase API</h1>");
        });
        this.app.use("/api", routers_1.default);
    }
    errorHandler() {
        this.app.use((error, req, res, next) => {
            logger_1.default.error(`${req.method} ${req.path}: ${error.message} ${JSON.stringify(error)}`);
            if (error instanceof AppError_1.default) {
                return res.status(error.code).json({
                    message: error.message,
                    details: error.details,
                });
            }
            res.status(500).json({
                message: "Internal Server Error",
                details: error.message,
            });
        });
    }
    start() {
        this.app.listen(PORT, () => {
            logger_1.default.info(`API Running: http://localhost:${PORT}`);
        });
    }
}
exports.default = App;
