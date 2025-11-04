import App from "../src/app";
import request from "supertest";
import { prisma } from "../src/config/prisma";

const appTest = new App().app;

describe("Connection testing", () => {
  beforeEach(() => {
    // Menyiapkan program/function yang ingin dijalankan
    // sebelum tiap skenario testing dieksekusi
  });

  beforeAll(async () => {
    // Menyiapkan program yang ingin dijalankan sebelum semua skenario dijalankan
    await prisma.$connect();
  });

  afterEach(() => {
    // Menyiapkan program/function yang ingin dijalankan
    // setelah tiap skenario testing dieksekusi
  });

  afterAll(async () => {
    // Menyiapkan program yang ingin dijalankan setelah semua skenario dijalankan
    await prisma.$disconnect();
  });

  // Testing scenario
  //   GOOD CASE
  it("Should return message from main route", async () => {
    const response = await request(appTest).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toEqual("<h1>Classbase API</h1>");
  });

  //   BAD CASE
  it("Should return NOT FOUND PAGE", async () => {
    const response = await request(appTest).get("/transaction");

    expect(response.status).toBe(404);
  });
});
