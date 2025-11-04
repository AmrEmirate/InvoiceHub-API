import App from "../src/app";
import request from "supertest";

const appTest = new App().app;

describe("Authentication", () => {
  // GOOD CASE
  it("Should login successfully with correct data", async () => {
    const response = await request(appTest).post("/auth/signin").send({
      email: "jelito1573@gardsiir.com",
      password: "jelito1573@gardsiir.coM",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("account");
    expect(response.body.success).toBeTruthy();
  });

  // BAD CASE
  it("Should fail login with incorrect password", async () => {
    const response = await request(appTest).post("/auth/signin").send({
      email: "jelito1573@gardsiir.com",
      password: "jelito1573@gardsiir.cM",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Password is wrong");
  });
});
