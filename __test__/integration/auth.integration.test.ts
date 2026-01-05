/**
 * Integration Tests for Authentication Endpoints
 */
import request from "supertest";
import App from "../../src/app";

const app = new App().app;

describe("Authentication Endpoints", () => {
  describe("POST /api/auth/register", () => {
    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({})
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("message", "Validation failed");
      expect(response.body).toHaveProperty("details");
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          company: "Test Company",
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });

    it("should validate name length", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "A", // Too short
          email: "test@example.com",
          company: "Test Company",
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("message", "Validation failed");
    });

    it("should validate email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "Password123!",
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });

    it("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/set-password", () => {
    it("should validate token format", async () => {
      const response = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: "invalid-token", // Not hexadecimal
          password: "Password123!",
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });

    it("should validate password complexity", async () => {
      const response = await request(app)
        .post("/api/auth/set-password")
        .send({
          token: "abc123def456789abcdef12345678901", // Valid hex format
          password: "weak", // Too weak
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("should validate password complexity", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "some-token",
          password: "weak", // Not meeting complexity requirements
        })
        .expect(400);

      expect(response.body.message).toBe("Validation failed");
    });

    it("should accept strong password", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "invalid-but-format-ok",
          password: "StrongP@ssw0rd!", // Meets all requirements
        });

      // Will fail with 404 (invalid token) but not 400 (validation)
      expect(response.status).not.toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should return 400 without refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Refresh token is required");
    });

    it("should return 401 with invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "invalid-token" })
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should succeed even without token", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .send({})
        .expect(200);

      expect(response.body.message).toBe("Logged out successfully");
    });
  });
});
