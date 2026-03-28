import { TRPCError } from "@trpc/server";
import * as z from "zod";

import {
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  deleteSession,
  getSession,
  getProfile,
  updateProfile,
  findUserById,
} from "@/backend/lib/store";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(({ input }) => {
      console.log("[Auth] register attempt", input.email);
      try {
        const { user, profile } = createUser(input.email, input.password, input.name);
        const session = createSession(user.id);
        return {
          token: session.token,
          user: { id: user.id, email: user.email },
          profile,
        };
      } catch (err) {
        if (err instanceof Error && err.message === "EMAIL_EXISTS") {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }
        throw err;
      }
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(({ input }) => {
      console.log("[Auth] login attempt", input.email);
      const user = findUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid email or password" });
      }

      if (!verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const session = createSession(user.id);
      const profile = getProfile(user.id);

      return {
        token: session.token,
        user: { id: user.id, email: user.email },
        profile: profile ?? null,
      };
    }),

  me: protectedProcedure.query(({ ctx }) => {
    console.log("[Auth] me query", ctx.userId);
    const user = findUserById(ctx.userId);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }
    const profile = getProfile(ctx.userId);
    return {
      user: { id: user.id, email: user.email },
      profile: profile ?? null,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        role: z.string().optional(),
        company: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().max(300).optional(),
        industry: z.string().optional(),
        experience: z.string().optional(),
        skills: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Auth] updateProfile", ctx.userId, input);
      const updated = updateProfile(ctx.userId, input);
      return updated;
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      deleteSession(token);
    }
    console.log("[Auth] logout", ctx.userId);
    return { success: true };
  }),
});
