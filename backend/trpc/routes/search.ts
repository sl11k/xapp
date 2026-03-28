import * as z from "zod";

import {
  searchAll,
  getProfile,
  getLikeCount,
  getCommentCount,
  getSaveCount,
  isLiked,
  isSaved,
  getCommunityMemberCount,
  isCommunityMember,
} from "@/backend/lib/store";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const searchRouter = createTRPCRouter({
  query: publicProcedure
    .input(
      z.object({
        q: z.string().min(1).max(200),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(({ input, ctx }) => {
      console.log("[Search] query=", input.q, "limit=", input.limit);
      const results = searchAll(input.q, input.limit);
      const userId = ctx.userId;

      const posts = results.posts.map((post) => {
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

      const communities = results.communities.map((c) => ({
        ...c,
        memberCount: getCommunityMemberCount(c.id),
        isMember: userId ? isCommunityMember(c.id, userId) : false,
      }));

      const services = results.services.map((s) => {
        const ownerProfile = getProfile(s.ownerId);
        return {
          ...s,
          ownerName: ownerProfile?.name ?? "Unknown",
          ownerInitial: (ownerProfile?.name ?? "U").charAt(0).toUpperCase(),
        };
      });

      const users = results.users.map((p) => ({
        userId: p.userId,
        name: p.name,
        role: p.role,
        company: p.company,
        bio: p.bio,
        industry: p.industry,
        initial: (p.name || "U").charAt(0).toUpperCase(),
      }));

      return { posts, communities, services, users };
    }),
});
