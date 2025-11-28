"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invoice_repository_1 = __importDefault(require("../repositories/invoice.repository"));
const client_repository_1 = __importDefault(require("../repositories/client.repository"));
const product_repository_1 = __importDefault(require("../repositories/product.repository"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const library_1 = require("@prisma/client/runtime/library");
const prisma_1 = require("../generated/prisma");
const nodemailer_1 = require("../config/nodemailer");
const prisma_2 = require("../config/prisma");
class InvoiceService {
    async getDashboardStats(userId) {
        try {
            const stats = await invoice_repository_1.default.getDashboardStats(userId);
            return stats;
        }
        catch (error) {
            logger_1.default.error(`Error fetching dashboard stats: ${error.message}`);
            throw new AppError_1.default(500, "Failed to get dashboard stats", error);
        }
    }
    async generateInvoiceNumber(userId) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const datePrefix = `${year}${month}${day}`;
        const lastInvoice = await invoice_repository_1.default.findLastInvoiceByDate(userId, today);
        let sequence = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split("-");
            if (parts.length === 3 && parts[1] === datePrefix) {
                const lastSequence = parseInt(parts[2], 10);
                if (!isNaN(lastSequence)) {
                    sequence = lastSequence + 1;
                }
            }
        }
        return `INV-${datePrefix}-${String(sequence).padStart(4, "0")}`;
    }
    async createInvoice(input, userId) {
        const client = await client_repository_1.default.findByIdAndUser(input.clientId, userId);
        if (!client) {
            throw new AppError_1.default(404, "Client not found or does not belong to user");
        }
        let totalAmount = new library_1.Decimal(0);
        await Promise.all(input.items.map(async (item) => {
            if (item.productId) {
                const product = await product_repository_1.default.findByIdAndUser(item.productId, userId);
                if (!product) {
                    throw new AppError_1.default(404, `Product with ID ${item.productId} not found`);
                }
            }
            const itemTotal = new library_1.Decimal(item.price).times(item.quantity);
            totalAmount = totalAmount.add(itemTotal);
        }));
        const invoiceNumber = await this.generateInvoiceNumber(userId);
        try {
            const newInvoice = await invoice_repository_1.default.create({ ...input, invoiceNumber }, userId, totalAmount);
            logger_1.default.info(`New invoice created (ID: ${newInvoice.id}) by user ${userId}`);
            return newInvoice;
        }
        catch (error) {
            logger_1.default.error(`Invoice creation failed: ${error.message}`, error);
            if (error.code === "P2002") {
                try {
                    const retryInvoiceNumber = await this.generateInvoiceNumber(userId);
                    const newInvoice = await invoice_repository_1.default.create({ ...input, invoiceNumber: retryInvoiceNumber }, userId, totalAmount);
                    return newInvoice;
                }
                catch (retryError) {
                    throw new AppError_1.default(409, "Invoice number already exists.");
                }
            }
            throw new AppError_1.default(500, "Failed to create invoice", error);
        }
    }
    async getInvoices(userId, filters, pagination) {
        return await invoice_repository_1.default.findAllByUser(userId, filters, pagination);
    }
    async getInvoiceById(id, userId) {
        const invoice = await invoice_repository_1.default.findByIdAndUser(id, userId);
        if (!invoice) {
            throw new AppError_1.default(404, "Invoice not found");
        }
        return invoice;
    }
    async updateInvoiceStatus(id, status, userId) {
        const invoice = await this.getInvoiceById(id, userId);
        if (invoice.status === prisma_1.InvoiceStatus.PAID) {
            throw new AppError_1.default(400, "Cannot update a paid invoice");
        }
        const updatedInvoice = await invoice_repository_1.default.updateStatus(id, { status });
        logger_1.default.info(`Invoice (ID: ${id}) status updated to ${status} by user ${userId}`);
        return updatedInvoice;
    }
    async deleteInvoice(id, userId) {
        await this.getInvoiceById(id, userId);
        await invoice_repository_1.default.delete(id);
        logger_1.default.info(`Invoice (ID: ${id}) deleted by user ${userId}`);
        return true;
    }
    async sendInvoiceEmail(invoiceId, userId) {
        const invoice = await this.getInvoiceById(invoiceId, userId);
        if (!invoice.client || !invoice.client.email) {
            throw new AppError_1.default(404, "Client email not found for this invoice");
        }
        const user = invoice.user;
        const client = invoice.client;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Halo ${client.name},</h2>
        <p>Anda menerima invoice baru (${invoice.invoiceNumber}) dari ${user.company}.</p>
        <p><strong>Total Tagihan: Rp ${Number(invoice.totalAmount).toLocaleString("id-ID")}</strong></p>
        <p><strong>Jatuh Tempo: ${new Date(invoice.dueDate).toLocaleDateString("id-ID")}</strong></p>
        <hr>
        <h3>Detail Item:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #f4f4f4;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Deskripsi</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
            .map((item) => `<tr>
             <td style="padding: 8px; border: 1px solid #ddd;">${item.description}</td>
             <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
             <td style="padding: 8px; border: 1px solid #ddd;">Rp ${Number(item.price).toLocaleString("id-ID")}</td>
           </tr>`)
            .join("")}
          </tbody>
        </table>
        <hr>
        <p>Catatan:</p>
        <p><em>${invoice.notes || "Tidak ada catatan."}</em></p>
        <p>Terima kasih!</p>
      </div>
    `;
        const mailOptions = {
            from: `"${user.company}" <${process.env.SMTP_USER}>`,
            to: client.email,
            subject: `Invoice Baru dari ${user.company} (${invoice.invoiceNumber})`,
            html: emailHtml,
        };
        try {
            await nodemailer_1.transport.sendMail(mailOptions);
            logger_1.default.info(`Invoice (ID: ${invoiceId}) sent to ${client.email} by user ${userId}`);
            if (invoice.status === prisma_1.InvoiceStatus.DRAFT) {
                await invoice_repository_1.default.updateStatus(invoiceId, {
                    status: prisma_1.InvoiceStatus.SENT,
                });
            }
            return true;
        }
        catch (emailError) {
            logger_1.default.error(`Failed to send invoice email: ${emailError.message}`);
            throw new AppError_1.default(500, "Failed to send email", emailError);
        }
    }
    async getChartData(userId) {
        try {
            const result = await prisma_2.prisma.$queryRaw `
        SELECT 
          TO_CHAR(date_trunc('month', i."invoiceDate"), 'YYYY-MM') as month,
          SUM(i."totalAmount")::float as revenue
        FROM "Invoice" i
        WHERE i."userId" = ${userId}
          AND i."status" = ${prisma_1.InvoiceStatus.PAID}::"InvoiceStatus"
          AND i."invoiceDate" >= date_trunc('month', NOW() - interval '11 months')
        GROUP BY 1
        ORDER BY 1 ASC;
      `;
            const monthlyData = {};
            const months = [];
            const today = new Date();
            for (let i = 0; i < 12; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                months.push(monthKey);
                monthlyData[monthKey] = 0;
            }
            result.forEach(item => {
                if (monthlyData.hasOwnProperty(item.month)) {
                    monthlyData[item.month] = item.revenue;
                }
            });
            const formattedData = months.map(monthKey => ({
                month: monthKey,
                revenue: monthlyData[monthKey]
            })).reverse();
            return formattedData;
        }
        catch (error) {
            logger_1.default.error(`Error fetching chart data: ${error.message}`);
            throw new AppError_1.default(500, "Failed to get chart data", error);
        }
    }
}
exports.default = new InvoiceService();
