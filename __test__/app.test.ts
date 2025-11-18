import App from "../src/app";
import request from "supertest";
import { prisma } from "../src/config/prisma";

const appTest = new App().app;

describe("Connection testing", () => {
  beforeEach(() => {
  });

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(() => {
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Should return message from main route", async () => {
    const response = await request(appTest).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toEqual("<h1>Classbase API</h1>");
  });

  it("Should return NOT FOUND PAGE", async () => {
    const response = await request(appTest).get("/transaction");

    expect(response.status).toBe(404);
  });
});
