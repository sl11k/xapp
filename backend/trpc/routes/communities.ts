import { TRPCError } from "@trpc/server";
import * as z from "zod";

import {
  createCommunity,
  getCommunity,
  listCommunities,
  joinCommunity,
  leaveCommunity,
  isCommunityMember,
  getCommunityMemberIds,
  getCommunityMemberCount,
  getCommunityPostIds,
  getCommunityPostCount,
  addPostToCommunity,
  getPost,
  getProfile,
  getLikeCount,
  getCommentCount,
  getSaveCount,
  isLiked,
  isSaved,
  createPost,
} from "@/backend/lib/store";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

export const communitiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        filter: z.enum(["public", "private", "premium"]).optional(),
      }).optional()
    )
    .query(({ input, ctx }) => {
      const filter = input?.filter;
      console.log("[Communities] list filter=", filter);
      const raw = listCommunities(filter);
      const userId = ctx.userId;

      return raw.map((c) => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        description: c.description,
        descriptionAr: c.descriptionAr,
        privacy: c.privacy,
        icon: c.icon,
        accent: c.accent,
        memberCount: getCommunityMemberCount(c.id),
        postCount: getCommunityPostCount(c.id),
        isMember: userId ? isCommunityMember(c.id, userId) : false,
        createdAt: c.createdAt,
      }));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      console.log("[Communities] byId", input.id);
      const c = getCommunity(input.id);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      const userId = ctx.userId;

      return {
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
        description: c.description,
        descriptionAr: c.descriptionAr,
        privacy: c.privacy,
        icon: c.icon,
        accent: c.accent,
        memberCount: getCommunityMemberCount(c.id),
        postCount: getCommunityPostCount(c.id),
        isMember: userId ? isCommunityMember(c.id, userId) : false,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
      };
    }),

  join: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Communities] join", input.communityId, "by", ctx.userId);
      const c = getCommunity(input.communityId);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      joinCommunity(input.communityId, ctx.userId);
      return {
        success: true,
        isMember: true,
        memberCount: getCommunityMemberCount(input.communityId),
      };
    }),

  leave: protectedProcedure
    .input(z.object({ communityId: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Communities] leave", input.communityId, "by", ctx.userId);
      const c = getCommunity(input.communityId);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      leaveCommunity(input.communityId, ctx.userId);
      return {
        success: true,
        isMember: false,
        memberCount: getCommunityMemberCount(input.communityId),
      };
    }),

  members: publicProcedure
    .input(z.object({ communityId: z.string() }))
    .query(({ input }) => {
      console.log("[Communities] members for", input.communityId);
      const c = getCommunity(input.communityId);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      const memberIds = getCommunityMemberIds(input.communityId);
      return memberIds
        .filter((id) => id !== "system")
        .map((id) => {
          const profile = getProfile(id);
          return {
            userId: id,
            name: profile?.name ?? "Unknown",
            role: profile?.role ?? "",
            company: profile?.company ?? "",
            initial: (profile?.name ?? "U").charAt(0).toUpperCase(),
            isModerator: id === c.createdBy,
          };
        });
    }),

  posts: publicProcedure
    .input(
      z.object({
        communityId: z.string(),
        cursor: z.number().default(0),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(({ input, ctx }) => {
      console.log("[Communities] posts for", input.communityId, "cursor=", input.cursor);
      const c = getCommunity(input.communityId);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      const { postIds, nextCursor } = getCommunityPostIds(input.communityId, input.cursor, input.limit);
      const userId = ctx.userId;

      const enriched = postIds
        .map((pid) => {
          const post = getPost(pid);
          if (!post) return null;
          const authorProfile = getProfile(post.authorId);
          return {
            ...post,
            authorName: authorProfile?.name ?? "Unknown",
            authorRole: authorProfile?.role ?? "",
            authorCompany: authorProfile?.company ?? "",
            authorInitial: (authorProfile?.name ?? "U").charAt(0).toUpperCase(),
            likesCount: getLikeCount(post.id),
            commentsCount: getCommentCount(post.id),
            savesCount: getSaveCount(post.id),
            isLiked: userId ? isLiked(post.id, userId) : false,
            isSaved: userId ? isSaved(post.id, userId) : false,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      return { posts: enriched, nextCursor };
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        communityId: z.string(),
        content: z.string().min(10).max(2000),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Communities] createPost in", input.communityId, "by", ctx.userId);
      const c = getCommunity(input.communityId);
      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Community not found" });
      }
      if (!isCommunityMember(input.communityId, ctx.userId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Must be a member to post" });
      }
      const post = createPost(ctx.userId, input.content, c.name);
      addPostToCommunity(input.communityId, post.id);
      const authorProfile = getProfile(ctx.userId);
      return {
        ...post,
        authorName: authorProfile?.name ?? "Unknown",
        authorRole: authorProfile?.role ?? "",
        authorCompany: authorProfile?.company ?? "",
        authorInitial: (authorProfile?.name ?? "U").charAt(0).toUpperCase(),
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        isLiked: false,
        isSaved: false,
      };
    }),
});
