import { hashPassword } from "../src/utils/hash";
import { compare } from "bcrypt"; // Impor 'compare'

describe("Test hashing", () => {
  it("Should correctly hash a password", async () => {
    const password = "mysecretpassword123";
    const hashedPassword = await hashPassword(password);

    // 1. Pastikan hash bukan string kosong
    expect(hashedPassword).toBeDefined();
    expect(typeof hashedPassword).toBe("string");
    
    // 2. Pastikan hash tidak sama dengan password asli
    expect(hashedPassword).not.toBe(password);

    // 3. Pastikan hash yang dihasilkan valid
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