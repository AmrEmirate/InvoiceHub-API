import bcrypt from "bcrypt";
import { hashPassword } from "../src/utils/hashPassword";

jest.mock("bcrypt");

describe("Test hashing", () => {
  it("Should return fake hash", async () => {
    (bcrypt.hash as jest.Mock).mockReturnValue("fake-hash");

    const newPassword = await hashPassword("1234");
    expect(newPassword).toBe("fake-hash");
  });
});
