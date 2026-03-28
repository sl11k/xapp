import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, createTRPCRouter } from "../create-context";
import {
  getOrCreateConversation,
  getConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markConversationRead,
  getUnreadCount,
  getLastMessage,
  getProfile,
  findUserByEmail,
  findUserById,
  createNotification,
} from "@/backend/lib/store";

function serializeMessage(msg: { id: string; conversationId: string; senderId: string; content: string; createdAt: string; readBy: Set<string> }) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    createdAt: msg.createdAt,
    readBy: Array.from(msg.readBy),
  };
}

export const messagesRouter = createTRPCRouter({
  listConversations: protectedProcedure.query(({ ctx }) => {
    const convs = getUserConversations(ctx.userId);
    console.log("[Messages] listConversations for", ctx.userId, "count=", convs.length);

    return convs.map((conv) => {
      const otherParticipantId = conv.participants.find((p) => p !== ctx.userId) ?? conv.participants[0];
      const otherProfile = getProfile(otherParticipantId);
      const otherUser = findUserById(otherParticipantId);
      const last = getLastMessage(conv.id);
      const unread = getUnreadCount(conv.id, ctx.userId);

      return {
        id: conv.id,
        participants: conv.participants,
        otherUser: {
          id: otherParticipantId,
          name: otherProfile?.name ?? otherUser?.email ?? "Unknown",
          avatarUrl: otherProfile?.avatarUrl ?? null,
          role: otherProfile?.role ?? "",
        },
        lastMessage: last ? serializeMessage(last) : null,
        unreadCount: unread,
        updatedAt: conv.updatedAt,
      };
    });
  }),

  getOrCreate: protectedProcedure
    .input(z.object({ otherUserId: z.string() }))
    .mutation(({ ctx, input }) => {
      if (input.otherUserId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
      }
      const other = findUserById(input.otherUserId);
      if (!other) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      const conv = getOrCreateConversation(ctx.userId, input.otherUserId);
      console.log("[Messages] getOrCreate conv=", conv.id, "between", ctx.userId, "and", input.otherUserId);
      return { conversationId: conv.id };
    }),

  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      cursor: z.number().default(0),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(({ ctx, input }) => {
      const conv = getConversation(input.conversationId);
      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      if (!conv.participants.includes(ctx.userId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const result = getConversationMessages(input.conversationId, input.cursor, input.limit);
      console.log("[Messages] getMessages conv=", input.conversationId, "count=", result.messages.length);

      return {
        messages: result.messages.map(serializeMessage),
        nextCursor: result.nextCursor,
      };
    }),

  send: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1).max(5000),
    }))
    .mutation(({ ctx, input }) => {
      const conv = getConversation(input.conversationId);
      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      if (!conv.participants.includes(ctx.userId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const msg = sendMessage(input.conversationId, ctx.userId, input.content);
      for (const pid of conv.participants) {
        if (pid !== ctx.userId) {
          createNotification(pid, "message", ctx.userId, input.conversationId);
        }
      }
      console.log("[Messages] sent message", msg.id, "in conv", input.conversationId);
      return serializeMessage(msg);
    }),

  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => {
      const conv = getConversation(input.conversationId);
      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      if (!conv.participants.includes(ctx.userId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const marked = markConversationRead(input.conversationId, ctx.userId);
      console.log("[Messages] markRead conv=", input.conversationId, "marked=", marked);
      return { marked };
    }),

  getConversationInfo: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ ctx, input }) => {
      const conv = getConversation(input.conversationId);
      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }
      if (!conv.participants.includes(ctx.userId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      }

      const otherParticipantId = conv.participants.find((p) => p !== ctx.userId) ?? conv.participants[0];
      const otherProfile = getProfile(otherParticipantId);
      const otherUser = findUserById(otherParticipantId);

      return {
        id: conv.id,
        participants: conv.participants,
        otherUser: {
          id: otherParticipantId,
          name: otherProfile?.name ?? otherUser?.email ?? "Unknown",
          avatarUrl: otherProfile?.avatarUrl ?? null,
          role: otherProfile?.role ?? "",
        },
        updatedAt: conv.updatedAt,
      };
    }),
});
