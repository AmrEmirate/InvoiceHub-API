import request from "supertest";
import App from "../src/app";
import { PrismaClient } from "../src/generated/prisma";
import { transport } from "../src/config/nodemailer";

// Mock Nodemailer agar tidak benar-benar mengirim email saat testing
jest.mock("../src/config/nodemailer", () => ({
  transport: {
    sendMail: jest.fn().mockImplementation(() => Promise.resolve(true)),
  },
}));

const appInstance = new App();
const app = appInstance.app;
const prisma = new PrismaClient();

describe("Auth Flow (Register, Set Password, Login)", () => {
  // Variable untuk menyimpan token antar test step
  let verificationToken: string | null = null;
  const testEmail = "test.auth@example.com";

  // --- BAGIAN PENTING: CLEANUP SEBELUM TEST ---
  // Menghapus user test sebelum test dimulai agar tidak kena error "Email already exists"
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testEmail, "test2@example.com"], // Hapus email utama dan email test validasi
        },
      },
    });
  });

  // --- BAGIAN PENTING: CLEANUP SETELAH TEST ---
  // Membersihkan data sampah dan menutup koneksi database
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testEmail, "test2@example.com"],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe("1. POST /api/auth/register", () => {
    it("should register a new user and ask for email verification", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: testEmail,
        company: "Test Inc.",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe(
        "Registration successful. Please check your email to set your password."
      );
      expect(res.body.data).toBeUndefined();

      // Cek database untuk memastikan user terbuat dan ambil tokennya
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(user).toBeDefined();
      expect(user?.isVerified).toBe(false);
      expect(user?.password).toBeNull();
      expect(user?.verificationToken).toBeDefined();

      // SIMPAN TOKEN UNTUK TEST SELANJUTNYA
      verificationToken = user?.verificationToken || null;
    });

    it("should fail registration if email already exists", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User 2",
        email: testEmail, // Menggunakan email yang sama dengan test di atas
        company: "Test Inc.",
      });

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe("Email already registered");
    });

    it("should fail registration if validation fails (e.g., missing name)", async () => {
      const res = await request(app).post("/api/auth/register").send({
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
      const res = await request(app).post("/api/auth/set-password").send({
        token: "invalidtoken123",
        password: "newpassword123",
      });

      expect(res.statusCode).toEqual(400);
    });

    it("should fail if password is too short", async () => {
      const res = await request(app).post("/api/auth/set-password").send({
        token: verificationToken, // Menggunakan token asli dari step 1
        password: "123",
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should set password and verify user successfully", async () => {
      // Pastikan token ada (dari step 1)
      expect(verificationToken).not.toBeNull();

      const res = await request(app).post("/api/auth/set-password").send({
        token: verificationToken,
        password: "newpassword123",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe(
        "Password set successfully. You can now login."
      );

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(user?.isVerified).toBe(true);
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBeNull();
      expect(user?.verificationToken).toBeNull();
    });
  });

  describe("3. POST /api/auth/login", () => {
    it("should fail login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should login successfully with correct password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "newpassword123",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("User logged in successfully");
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.token).toBeDefined();
    });
  });
});