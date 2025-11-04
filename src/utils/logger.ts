import path from "path";
import { createLogger, format, transports } from "winston";

// 1. Format Log Kustom
const logFormat = format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// 2. Filter untuk setiap level log
const filterLog = (level: string) => {
  return format((info) => {
    return info.level === level ? info : false;
  })();
};

// 3. Membuat Logger Instance
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.json(),
    logFormat
  ),
  // 4. Transport: Tujuan output log
  transports: [
    new transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      format: format.combine(filterLog("error")), // Hanya menyimpan log level 'error'
    }),
    new transports.File({
      filename: path.join(__dirname, "../../logs/info.log"),
      format: format.combine(filterLog("info")), // Hanya menyimpan log level 'info'
    }),
  ],
});

// 5. Menambahkan transport console untuk development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      logFormat
    ),
  }));
}

export default logger;