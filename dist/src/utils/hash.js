"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = require("bcryptjs");
const SALT_ROUNDS = 10;
const hashPassword = async (password) => {
    return await (0, bcryptjs_1.hash)(password, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hash) => {
    return await (0, bcryptjs_1.compare)(password, hash);
};
exports.comparePassword = comparePassword;
