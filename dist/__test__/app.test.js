"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const supertest_1 = __importDefault(require("supertest"));
const prisma_1 = require("../src/config/prisma");
const appTest = new app_1.default().app;
describe("Connection testing", () => {
    beforeEach(() => {
    });
    beforeAll(async () => {
        await prisma_1.prisma.$connect();
    });
    afterEach(() => {
    });
    afterAll(async () => {
        await prisma_1.prisma.$disconnect();
    });
    it("Should return message from main route", async () => {
        const response = await (0, supertest_1.default)(appTest).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toEqual("<h1>Classbase API</h1>");
    });
    it("Should return NOT FOUND PAGE", async () => {
        const response = await (0, supertest_1.default)(appTest).get("/transaction");
        expect(response.status).toBe(404);
    });
});
