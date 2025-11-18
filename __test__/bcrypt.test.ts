import { hashPassword } from "../src/utils/hash";
import { compare } from "bcrypt";

describe("Test hashing", () => {
  it("Should correctly hash a password", async () => {
    const password = "mysecretpassword123";
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe("string");
    
    expect(hashedPassword).not.toBe(password);

    const isMatch = await compare(password, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it("Should fail to compare wrong password", async () => {
     const password = "mysecretpassword123";
     const wrongPassword = "wrongpassword";
     const hashedPassword = await hashPassword(password);

     const isMatch = await compare(wrongPassword, hashedPassword);
     expect(isMatch).toBe(false);
  });
});