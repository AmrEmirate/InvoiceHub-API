import swaggerJSDoc from "swagger-jsdoc";

/**
 * Swagger/OpenAPI configuration for InvoiceHub API
 */
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "InvoiceHub API",
      version: "1.0.0",
      description: "Invoice Management System API Documentation",
      contact: {
        name: "InvoiceHub Support",
        email: "support@invoicehub.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            company: { type: "string" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            state: { type: "string", nullable: true },
            zipCode: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            taxId: { type: "string", nullable: true },
            bankAccount: { type: "string", nullable: true },
            avatar: { type: "string", nullable: true },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Client: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            paymentPreferences: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Invoice: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            invoiceNumber: { type: "string" },
            status: {
              type: "string",
              enum: [
                "DRAFT",
                "SENT",
                "PENDING",
                "PAID",
                "OVERDUE",
                "CANCELLED",
              ],
            },
            invoiceDate: { type: "string", format: "date-time" },
            dueDate: { type: "string", format: "date-time" },
            currency: { type: "string", default: "IDR" },
            notes: { type: "string", nullable: true },
            totalAmount: { type: "number" },
            isRecurring: { type: "boolean" },
            recurrenceInterval: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number" },
            sku: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            code: { type: "string" },
            details: { type: "object" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: { type: "object" } },
            meta: {
              type: "object",
              properties: {
                total: { type: "number" },
                page: { type: "number" },
                limit: { type: "number" },
                totalPages: { type: "number" },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "name", "company"],
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string", minLength: 2 },
            company: { type: "string", minLength: 2 },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFoundError: {
          description: "The requested resource was not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Clients", description: "Client management endpoints" },
      { name: "Invoices", description: "Invoice management endpoints" },
      { name: "Products", description: "Product management endpoints" },
      { name: "Categories", description: "Category management endpoints" },
      { name: "Upload", description: "File upload endpoints" },
    ],
  },
  apis: ["./src/routers/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
