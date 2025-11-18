import { User } from "../generated/prisma";

type SafeUser = Omit<User, "password">;

declare global {
  namespace Express {
    export interface Request {
      user?: SafeUser;
    }
  }
}