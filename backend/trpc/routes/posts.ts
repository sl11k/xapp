import { TRPCError } from "@trpc/server";
import * as z from "zod";

import {
  createPost,
  getPost,
  listPosts,
  deletePost,
  toggleLike,
  isLiked,
  getLikeCount,
  toggleSave,
  isSaved,
  getSaveCount,
  getUserSavedPosts,
  addComment,
  getPostComments,
  getCommentCount,
  getProfile,
  createNotification,
} from "@/backend/lib/store";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

export const postsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.number().default(0),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(({ input, ctx }) => {
      console.log("[Posts] list cursor=", input.cursor, "limit=", input.limit);
      const result = listPosts(input.cursor, input.limit);
      const userId = ctx.userId;

      const enriched = result.posts.map((post) => {
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
      });

      return {
        posts: enriched,
        nextCursor: result.nextCursor,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      console.log("[Posts] byId", input.id);
      const post = getPost(input.id);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      const authorProfile = getProfile(post.authorId);
      const userId = ctx.userId;

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
    }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(10).max(2000),
        topic: z.string().min(1),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Posts] create by", ctx.userId, "topic=", input.topic);
      const post = createPost(ctx.userId, input.content, input.topic);
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

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Posts] delete", input.id, "by", ctx.userId);
      const ok = deletePost(input.id, ctx.userId);
      if (!ok) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete this post" });
      }
      return { success: true };
    }),

  toggleLike: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) => {
      const post = getPost(input.postId);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      const liked = toggleLike(input.postId, ctx.userId);
      if (liked && post.authorId !== ctx.userId) {
        createNotification(post.authorId, "like", ctx.userId, post.id);
      }
      return { liked, likesCount: getLikeCount(input.postId) };
    }),

  toggleSave: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) => {
      const post = getPost(input.postId);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      const saved = toggleSave(input.postId, ctx.userId);
      return { saved, savesCount: getSaveCount(input.postId) };
    }),

  savedPosts: protectedProcedure.query(({ ctx }) => {
    console.log("[Posts] savedPosts for", ctx.userId);
    const savedList = getUserSavedPosts(ctx.userId);
    return savedList.map((post) => {
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
        isLiked: isLiked(post.id, ctx.userId),
        isSaved: true,
      };
    });
  }),

  comments: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(({ input }) => {
      console.log("[Posts] comments for", input.postId);
      const raw = getPostComments(input.postId);
      return raw.map((c) => {
        const profile = getProfile(c.authorId);
        return {
          ...c,
          authorName: profile?.name ?? "Unknown",
          authorRole: profile?.role ?? "",
          authorInitial: (profile?.name ?? "U").charAt(0).toUpperCase(),
        };
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(1000),
        parentId: z.string().nullable().default(null),
      })
    )
    .mutation(({ ctx, input }) => {
      const post = getPost(input.postId);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      console.log("[Posts] addComment on", input.postId, "by", ctx.userId);
      const comment = addComment(input.postId, ctx.userId, input.content, input.parentId);
      if (post.authorId !== ctx.userId) {
        createNotification(post.authorId, "comment", ctx.userId, post.id);
      }
      const profile = getProfile(ctx.userId);
      return {
        ...comment,
        authorName: profile?.name ?? "Unknown",
        authorRole: profile?.role ?? "",
        authorInitial: (profile?.name ?? "U").charAt(0).toUpperCase(),
      };
    }),
});
