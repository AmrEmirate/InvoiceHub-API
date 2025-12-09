import cron from "node-cron";
import RecurringService from "../service/recurring.service";
import InvoiceService from "../service/invoice.service";
import logger from "../utils/logger";

class InvoiceCron {
  private recurringService: typeof RecurringService;
  private invoiceService: typeof InvoiceService;

  constructor() {
    this.recurringService = RecurringService;
    this.invoiceService = InvoiceService;
  }

  public start() {
    logger.info("Starting cron jobs...");

    // Run every day at 1:00 AM - Generate recurring invoices
    cron.schedule("0 1 * * *", async () => {
      try {
        await this.recurringService.generateRecurringInvoices();
      } catch (error) {
        logger.error("[Cron] Error running recurring invoice job:", error);
      }
    });

    // Run every day at 00:05 AM - Mark overdue invoices
    cron.schedule("5 0 * * *", async () => {
      try {
        logger.info("[Cron] Checking for overdue invoices...");
        await this.invoiceService.markOverdueInvoices();
      } catch (error) {
        logger.error("[Cron] Error marking overdue invoices:", error);
      }
    });

    logger.info(
      "Cron jobs scheduled: recurring invoices (1:00 AM), overdue check (00:05 AM)"
    );
  }
}

export default new InvoiceCron();
