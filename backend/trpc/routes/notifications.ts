import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  getProfile,
  getPost,
  getServiceListing,
  type NotificationType,
} from "@/backend/lib/store";

function buildNotificationText(
  type: NotificationType,
  actorName: string,
  referenceId: string
): { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string } {
  switch (type) {
    case "like": {
      return {
        titleEn: `${actorName} liked your post`,
        titleAr: `أعجب ${actorName} بمنشورك`,
        bodyEn: "Tap to view the post",
        bodyAr: "انقر لعرض المنشور",
      };
    }
    case "comment": {
      return {
        titleEn: `${actorName} commented on your post`,
        titleAr: `علق ${actorName} على منشورك`,
        bodyEn: "Tap to view the comment",
        bodyAr: "انقر لعرض التعليق",
      };
    }
    case "message": {
      return {
        titleEn: `${actorName} sent you a message`,
        titleAr: `أرسل لك ${actorName} رسالة`,
        bodyEn: "Tap to read the message",
        bodyAr: "انقر لقراءة الرسالة",
      };
    }
    case "service_request": {
      const service = getServiceListing(referenceId);
      const serviceName = service?.title ?? "your service";
      const serviceNameAr = service?.titleAr ?? "خدمتك";
      return {
        titleEn: `${actorName} requested ${serviceName}`,
        titleAr: `طلب ${actorName} ${serviceNameAr}`,
        bodyEn: "Tap to view the request",
        bodyAr: "انقر لعرض الطلب",
      };
    }
    default:
      return {
        titleEn: "New notification",
        titleAr: "إشعار جديد",
        bodyEn: "",
        bodyAr: "",
      };
  }
}

const AVATAR_COLORS = ["#1A6B4A", "#B8892A", "#C94458", "#2E7AD6", "#7C3AED", "#059669"];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const notificationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.number().default(0),
        limit: z.number().min(1).max(50).default(20),
        filter: z.enum(["like", "comment", "message", "service_request", "unread"]).optional(),
      })
    )
    .query(({ ctx, input }) => {
      console.log("[Notifications] list for", ctx.userId, "filter=", input.filter);
      const result = getUserNotifications(ctx.userId, input.cursor, input.limit, input.filter);

      const enriched = result.notifications.map((n) => {
        const actorProfile = getProfile(n.actorId);
        const actorName = actorProfile?.name ?? "Someone";
        const actorInitial = actorName.charAt(0).toUpperCase();
        const texts = buildNotificationText(n.type, actorName, n.referenceId);

        return {
          id: n.id,
          type: n.type,
          actorId: n.actorId,
          actorName,
          actorInitial,
          avatarColor: getAvatarColor(actorName),
          referenceId: n.referenceId,
          read: n.read,
          createdAt: n.createdAt,
          title: { en: texts.titleEn, ar: texts.titleAr },
          body: { en: texts.bodyEn, ar: texts.bodyAr },
        };
      });

      return {
        notifications: enriched,
        nextCursor: result.nextCursor,
      };
    }),

  unreadCount: protectedProcedure.query(({ ctx }) => {
    const count = getUnreadNotificationCount(ctx.userId);
    console.log("[Notifications] unreadCount for", ctx.userId, "=", count);
    return { count };
  }),

  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Notifications] markRead", input.notificationId, "by", ctx.userId);
      const ok = markNotificationRead(input.notificationId, ctx.userId);
      return { success: ok };
    }),

  markAllRead: protectedProcedure.mutation(({ ctx }) => {
    console.log("[Notifications] markAllRead for", ctx.userId);
    const count = markAllNotificationsRead(ctx.userId);
    return { marked: count };
  }),
});
