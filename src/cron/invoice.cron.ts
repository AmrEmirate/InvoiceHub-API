// File: src/cron/invoice.cron.ts
import cron from "node-cron";
import RecurringService from "../service/recurring.service";
import logger from "../utils/logger";

class InvoiceCron {
  private recurringService: typeof RecurringService;

  constructor() {
    this.recurringService = RecurringService;
  }

  /**
   * Mulai semua cron job
   */
  public start() {
    logger.info("Starting cron jobs...");

    // Jadwal: '0 1 * * *' = Jam 1 pagi setiap hari
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