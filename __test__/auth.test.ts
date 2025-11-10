// File: __test__/auth.test.ts
import request from "supertest";
import App from "../src/app"; // Asumsi app.ts mengekspor instance App
import { PrismaClient } from "../src/generated/prisma";

const appInstance = new App();
const app = appInstance.app;
const prisma = new PrismaClient();

describe("POST /api/auth/register", () => {
  // Bersihkan database setelah semua tes
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        company: "Test Inc.",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.token).toBeDefined();
  });

  it("should fail registration if email already exists", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User 2",
        email: "test@example.com", // Email yang sama
        password: "password123",
        company: "Test Inc.",
      });

    expect(res.statusCode).toEqual(409); // 409 Conflict
    expect(res.body.message).toBe("Email already registered");
  });

  it("should fail registration if validation fails (e.g., missing name)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test2@example.com",
        password: "password123",
        company: "Test Inc.",
      });

    expect(res.statusCode).toEqual(400); // 400 Bad Request
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.details[0].path).toBe("name");
  });
});