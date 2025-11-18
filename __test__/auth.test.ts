import request from "supertest";
import App from "../src/app";
import { PrismaClient } from "../src/generated/prisma";
import { transport } from "../src/config/nodemailer";
jest.mock("../src/config/nodemailer", () => ({
  transport: {
    sendMail: jest.fn().mockImplementation(() => Promise.resolve(true)),
  },
}));

const appInstance = new App();
const app = appInstance.app;
const prisma = new PrismaClient();

describe("Auth Flow (Register, Set Password, Login)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  let verificationToken: string | null = null;

  describe("1. POST /api/auth/register", () => {
    it("should register a new user and ask for email verification", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test.auth@example.com",
          company: "Test Inc.",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe(
        "Registration successful. Please check your email to set your password."
      );
      expect(res.body.data).toBeUndefined();

      const user = await prisma.user.findUnique({
        where: { email: "test.auth@example.com" },
      });
      expect(user).toBeDefined();
      expect(user?.isVerified).toBe(false);
      expect(user?.password).toBeNull();
      expect(user?.verificationToken).toBeDefined();

      verificationToken = user?.verificationToken || null;
    });

    it("should fail registration if email already exists", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User 2",
          email: "test.auth@example.com",
          company: "Test Inc.",
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe("Email already registered");
    });

    it("should fail registration if validation fails (e.g., missing name)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test2@example.com",
          company: "Test Inc.",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.details[0].path).toBe("name");
    });
  });

  describe("2. POST /api/auth/set-password", () => {
    it("should fail if token is invalid", async () => {
      const res = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: "invalidtoken123",
          password: "newpassword123",
        });

      expect(res.statusCode).toEqual(400);
    });
    
    it("should fail if password is too short", async () => {
      const res = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: verificationToken,
          password: "123",
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should set password and verify user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: verificationToken,
          password: "newpassword123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe(
        "Password set successfully. You can now login."
      );

      const user = await prisma.user.findUnique({
        where: { email: "test.auth@example.com" },
      });
      expect(user?.isVerified).toBe(true);
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBeNull();
      expect(user?.verificationToken).toBeNull();
    });
  });

  describe("3. POST /api/auth/login", () => {
     it("should fail login with wrong password", async () => {
       const res = await request(app)
         .post("/api/auth/login")
         .send({
           email: "test.auth@example.com",
           password: "wrongpassword",
         });
         
       expect(res.statusCode).toEqual(401);
       expect(res.body.message).toBe("Invalid email or password");
     });
     
     it("should login successfully with correct password", async () => {
       const res = await request(app)
         .post("/api/auth/login")
         .send({
           email: "test.auth@example.com",
           password: "newpassword123",
         });
         
       expect(res.statusCode).toEqual(200);
       expect(res.body.message).toBe("User logged in successfully");
       expect(res.body.data.user.email).toBe("test.auth@example.com");
       expect(res.body.data.token).toBeDefined();
     });
  });
});