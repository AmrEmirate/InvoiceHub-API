import nodemailer from "nodemailer";
import logger from "../utils/logger";

export const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true untuk port 465, false untuk port lain seperti 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transport.verify((error, success) => {
  if (error) {
    logger.error("Nodemailer transport error:", error);
  } else {
    logger.info("Nodemailer transport is ready.");
  }
});