import App from "../src/app";
import request from "supertest";
import { prisma } from "../src/config/prisma";

const appTest = new App().app;

describe("Connection testing", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Should return JSON info from main route", async () => {
    const response = await request(appTest).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", "InvoiceHub API");
    expect(response.body).toHaveProperty("version");
  });

  it("Should return 404 for unknown routes", async () => {
    const response = await request(appTest).get("/transaction");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("code", "ROUTE_NOT_FOUND");
  });
});
