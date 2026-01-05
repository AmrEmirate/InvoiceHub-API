/**
 * Integration Tests for Health Check Endpoints
 */
import request from "supertest";
import App from "../../src/app";

const app = new App().app;

describe("Health Check Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/api/health")
        .expect("Content-Type", /json/);

      // May return 200 or 503 depending on database connection
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("checks");
      expect(response.body.checks).toHaveProperty("database");
      expect(response.body.checks).toHaveProperty("memory");
    });

    it("should include memory information", async () => {
      const response = await request(app).get("/api/health");

      const { memory } = response.body.checks;
      expect(memory).toHaveProperty("heapUsed");
      expect(memory).toHaveProperty("heapTotal");
      expect(memory).toHaveProperty("rss");
    });
  });

  describe("GET /api/health/live", () => {
    it("should return alive status", async () => {
      const response = await request(app)
        .get("/api/health/live")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toEqual({ status: "alive" });
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return ready status based on database", async () => {
      const response = await request(app)
        .get("/api/health/ready")
        .expect("Content-Type", /json/);

      // May return 200 or 503 depending on database connection
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
    });
  });
});

describe("Root Endpoint", () => {
  describe("GET /", () => {
    it("should return API info", async () => {
      const response = await request(app)
        .get("/")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("name", "InvoiceHub API");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("documentation");
      expect(response.body).toHaveProperty("health");
    });
  });
});

describe("404 Handler", () => {
  it("should return 404 for unknown routes", async () => {
    const response = await request(app)
      .get("/api/unknown-route")
      .expect(404)
      .expect("Content-Type", /json/);

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("code", "ROUTE_NOT_FOUND");
  });
});
