"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const invoice_cron_1 = __importDefault(require("./cron/invoice.cron"));
const main = () => {
    const server = new app_1.default();
    const cronJobs = invoice_cron_1.default;
    server.start();
    cronJobs.start();
};
main();
