import App from "./app";
import InvoiceCron from "./cron/invoice.cron";

const main = () => {
  const server = new App();
  const cronJobs = InvoiceCron; 

  server.start();
  cronJobs.start(); 
};

main();