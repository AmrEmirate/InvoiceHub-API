import request from "supertest";
import App from "../src/app";
import { PrismaClient } from "../src/generated/prisma";
// Import 'transport' untuk di-mock
import { transport } from "../src/config/nodemailer";

// Mock nodemailer agar tidak mengirim email sungguhan saat tes
jest.mock("../src/config/nodemailer", () => ({
  transport: {
    sendMail: jest.fn().mockImplementation(() => Promise.resolve(true)),
  },
}));

const appInstance = new App();
const app = appInstance.app;
const prisma = new PrismaClient();

describe("Auth Flow (Register, Set Password, Login)", () => {
  // Bersihkan database setelah semua tes
  afterAll(async () => {
    // --- PERBAIKAN ---
    // Baris ini telah diberi komentar agar tidak menghapus database Anda
    // saat menjalankan 'npm test'.
    // await prisma.user.deleteMany(); 
    
    await prisma.$disconnect();
  });

  // Variabel untuk menyimpan token antar tes
  let verificationToken: string | null = null;

  describe("1. POST /api/auth/register", () => {
    it("should register a new user and ask for email verification", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test.auth@example.com",
          company: "Test Inc.",
          // Password tidak dikirim
        });

      expect(res.statusCode).toEqual(201);
      // Cek pesan baru
      expect(res.body.message).toBe(
        "Registration successful. Please check your email to set your password."
      );
      // Pastikan TIDAK ADA token atau data user yang dikembalikan
      expect(res.body.data).toBeUndefined();

      // Cek di database apakah user dibuat dengan benar
      const user = await prisma.user.findUnique({
        where: { email: "test.auth@example.com" },
      });
      expect(user).toBeDefined();
      expect(user?.isVerified).toBe(false); // Belum terverifikasi
      expect(user?.password).toBeNull(); // Password null
      expect(user?.verificationToken).toBeDefined(); // Token ada

      // Simpan token untuk tes berikutnya
      verificationToken = user?.verificationToken || null;
    });

    it("should fail registration if email already exists", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User 2",
          email: "test.auth@example.com", // Email yang sama
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

      expect(res.statusCode).toEqual(400); // Gagal validasi heksadesimal
    });
    
    it("should fail if password is too short", async () => {
      const res = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: verificationToken, // Token yang valid
          password: "123", // Password terlalu pendek
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Validation failed");
    });

    it("should set password and verify user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: verificationToken, // Token yang valid
          password: "newpassword123",
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe(
        "Password set successfully. You can now login."
      );

      // Cek database
      const user = await prisma.user.findUnique({
        where: { email: "test.auth@example.com" },
      });
      expect(user?.isVerified).toBe(true); // Sudah terverifikasi
      expect(user?.password).toBeDefined(); // Password sudah di-set
      expect(user?.password).not.toBeNull();
      expect(user?.verificationToken).toBeNull(); // Token sudah dihapus
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
           password: "newpassword123", // Password yang baru di-set
         });
         
       expect(res.statusCode).toEqual(200);
       expect(res.body.message).toBe("User logged in successfully");
       expect(res.body.data.user.email).toBe("test.auth@example.com");
       expect(res.body.data.token).toBeDefined(); // Dapat token JWT
     });
  });
});