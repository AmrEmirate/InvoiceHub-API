import cron from "node-cron";
import RecurringService from "../service/recurring.service";
import logger from "../utils/logger";

class InvoiceCron {
  private recurringService: typeof RecurringService;

  constructor() {
    this.recurringService = RecurringService;
  }

  public start() {
    logger.info("Starting cron jobs...");

    cron.schedule("0 1 * * *", async () => {
      try {
        await this.recurringService.generateRecurringInvoices();
      } catch (error) {
        logger.error("[Cron] Error running recurring invoice job:", error);
      }
    });

    logger.info("Cron job for recurring invoices scheduled.");
  }
}

export default new InvoiceCron();