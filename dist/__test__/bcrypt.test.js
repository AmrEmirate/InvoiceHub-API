"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("../src/utils/hash");
const bcrypt_1 = require("bcrypt");
describe("Test hashing", () => {
    it("Should correctly hash a password", async () => {
        const password = "mysecretpassword123";
        const hashedPassword = await (0, hash_1.hashPassword)(password);
        expect(hashedPassword).toBeDefined();
        expect(typeof hashedPassword).toBe("string");
        expect(hashedPassword).not.toBe(password);
        const isMatch = await (0, bcrypt_1.compare)(password, hashedPassword);
        expect(isMatch).toBe(true);
    });
    it("Should fail to compare wrong password", async () => {
        const password = "mysecretpassword123";
        const wrongPassword = "wrongpassword";
        const hashedPassword = await (0, hash_1.hashPassword)(password);
        const isMatch = await (0, bcrypt_1.compare)(wrongPassword, hashedPassword);
        expect(isMatch).toBe(false);
    });
});
