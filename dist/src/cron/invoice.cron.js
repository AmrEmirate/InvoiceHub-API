"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const recurring_service_1 = __importDefault(require("../service/recurring.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class InvoiceCron {
    constructor() {
        this.recurringService = recurring_service_1.default;
    }
    start() {
        logger_1.default.info("Starting cron jobs...");
        node_cron_1.default.schedule("0 1 * * *", async () => {
            try {
                await this.recurringService.generateRecurringInvoices();
            }
            catch (error) {
                logger_1.default.error("[Cron] Error running recurring invoice job:", error);
            }
        });
        logger_1.default.info("Cron job for recurring invoices scheduled.");
    }
}
exports.default = new InvoiceCron();
