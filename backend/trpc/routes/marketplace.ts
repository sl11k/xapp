import { TRPCError } from "@trpc/server";
import * as z from "zod";

import {
  createServiceListing,
  updateServiceListing,
  getServiceListing,
  listServiceListings,
  getUserServiceListings,
  deleteServiceListing,
  createServiceRequest,
  getUserServiceRequests,
  getServiceRequests,
  updateServiceRequestStatus,
  confirmServiceDelivery,
  setRequestConversation,
  getProviderIncomingRequests,
  getRequestByConversation,
  getServiceRequest,
  createReview,
  getServiceReviews,
  getServiceAverageRating,
  getProfile,
  createNotification,
  getOrCreateConversation,
} from "@/backend/lib/store";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";

export const marketplaceRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        cursor: z.number().default(0),
        limit: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
      })
    )
    .query(({ input }) => {
      console.log("[Marketplace] list cursor=", input.cursor, "limit=", input.limit, "category=", input.category);
      const result = listServiceListings(input.cursor, input.limit, input.category);

      const enriched = result.services.map((s) => {
        const ownerProfile = getProfile(s.ownerId);
        const rating = getServiceAverageRating(s.id);
        return {
          ...s,
          ownerName: ownerProfile?.name ?? "Business Hub",
          ownerInitial: (ownerProfile?.name ?? "B").charAt(0).toUpperCase(),
          ownerRole: ownerProfile?.role ?? "",
          averageRating: rating.average,
          reviewCount: rating.count,
        };
      });

      return {
        services: enriched,
        nextCursor: result.nextCursor,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      console.log("[Marketplace] byId", input.id);
      const service = getServiceListing(input.id);
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
      }
      const ownerProfile = getProfile(service.ownerId);
      const rating = getServiceAverageRating(service.id);
      const reviews = getServiceReviews(service.id).map((r) => {
        const reviewerProfile = getProfile(r.reviewerId);
        return {
          ...r,
          reviewerName: reviewerProfile?.name ?? "Unknown",
          reviewerInitial: (reviewerProfile?.name ?? "U").charAt(0).toUpperCase(),
        };
      });
      return {
        ...service,
        ownerName: ownerProfile?.name ?? "Business Hub",
        ownerInitial: (ownerProfile?.name ?? "B").charAt(0).toUpperCase(),
        ownerRole: ownerProfile?.role ?? "",
        averageRating: rating.average,
        reviewCount: rating.count,
        reviews,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        titleAr: z.string().min(3).max(200),
        description: z.string().max(2000).default(""),
        descriptionAr: z.string().max(2000).default(""),
        category: z.string().min(1),
        categoryAr: z.string().min(1),
        price: z.string().min(1),
        priceAr: z.string().min(1),
        delivery: z.string().min(1),
        deliveryAr: z.string().min(1),
        features: z.array(z.object({ en: z.string(), ar: z.string() })).default([]),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] create by", ctx.userId);
      const service = createServiceListing(ctx.userId, input);
      const ownerProfile = getProfile(ctx.userId);
      return {
        ...service,
        ownerName: ownerProfile?.name ?? "Unknown",
        ownerInitial: (ownerProfile?.name ?? "U").charAt(0).toUpperCase(),
        ownerRole: ownerProfile?.role ?? "",
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        titleAr: z.string().min(3).max(200).optional(),
        description: z.string().max(2000).optional(),
        descriptionAr: z.string().max(2000).optional(),
        category: z.string().optional(),
        categoryAr: z.string().optional(),
        price: z.string().optional(),
        priceAr: z.string().optional(),
        delivery: z.string().optional(),
        deliveryAr: z.string().optional(),
        features: z.array(z.object({ en: z.string(), ar: z.string() })).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] update", input.id, "by", ctx.userId);
      const { id, ...data } = input;
      try {
        const service = updateServiceListing(id, ctx.userId, data);
        const ownerProfile = getProfile(ctx.userId);
        return {
          ...service,
          ownerName: ownerProfile?.name ?? "Unknown",
          ownerInitial: (ownerProfile?.name ?? "U").charAt(0).toUpperCase(),
          ownerRole: ownerProfile?.role ?? "",
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message === "SERVICE_NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
        }
        if (message === "NOT_OWNER") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not the owner of this service" });
        }
        throw err;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] delete", input.id, "by", ctx.userId);
      const ok = deleteServiceListing(input.id, ctx.userId);
      if (!ok) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete this service" });
      }
      return { success: true };
    }),

  myListings: protectedProcedure.query(({ ctx }) => {
    console.log("[Marketplace] myListings for", ctx.userId);
    const listings = getUserServiceListings(ctx.userId);
    const ownerProfile = getProfile(ctx.userId);
    return listings.map((s) => ({
      ...s,
      ownerName: ownerProfile?.name ?? "Unknown",
      ownerInitial: (ownerProfile?.name ?? "U").charAt(0).toUpperCase(),
      ownerRole: ownerProfile?.role ?? "",
    }));
  }),

  requestService: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        message: z.string().max(1000).default(""),
        proposedPrice: z.string().max(200).default(""),
        proposedTimeline: z.string().max(200).default(""),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] requestService", input.serviceId, "by", ctx.userId);
      try {
        const request = createServiceRequest(
          input.serviceId,
          ctx.userId,
          input.message,
          input.proposedPrice,
          input.proposedTimeline
        );
        const service = getServiceListing(request.serviceId);
        if (service) {
          createNotification(service.ownerId, "service_request", ctx.userId, service.id);
        }
        return {
          ...request,
          serviceTitle: service?.title ?? "",
          serviceTitleAr: service?.titleAr ?? "",
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message === "SERVICE_NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
        }
        if (message === "CANNOT_REQUEST_OWN") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot request your own service" });
        }
        throw err;
      }
    }),

  myRequests: protectedProcedure.query(({ ctx }) => {
    console.log("[Marketplace] myRequests for", ctx.userId);
    const requests = getUserServiceRequests(ctx.userId);
    return requests.map((r) => {
      const service = getServiceListing(r.serviceId);
      const ownerProfile = service ? getProfile(service.ownerId) : undefined;
      return {
        ...r,
        serviceTitle: service?.title ?? "",
        serviceTitleAr: service?.titleAr ?? "",
        servicePrice: service?.price ?? "",
        servicePriceAr: service?.priceAr ?? "",
        providerName: ownerProfile?.name ?? "Unknown",
        providerInitial: (ownerProfile?.name ?? "U").charAt(0).toUpperCase(),
      };
    });
  }),

  incomingRequests: protectedProcedure.query(({ ctx }) => {
    console.log("[Marketplace] incomingRequests for", ctx.userId);
    const requests = getProviderIncomingRequests(ctx.userId);
    return requests.map((r) => {
      const service = getServiceListing(r.serviceId);
      const requesterProfile = getProfile(r.requesterId);
      return {
        ...r,
        serviceTitle: service?.title ?? "",
        serviceTitleAr: service?.titleAr ?? "",
        servicePrice: service?.price ?? "",
        servicePriceAr: service?.priceAr ?? "",
        requesterName: requesterProfile?.name ?? "Unknown",
        requesterInitial: (requesterProfile?.name ?? "U").charAt(0).toUpperCase(),
      };
    });
  }),

  serviceRequests: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(({ ctx, input }) => {
      console.log("[Marketplace] serviceRequests for", input.serviceId);
      const service = getServiceListing(input.serviceId);
      if (!service || service.ownerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not the owner" });
      }
      const requests = getServiceRequests(input.serviceId);
      return requests.map((r) => {
        const requesterProfile = getProfile(r.requesterId);
        return {
          ...r,
          requesterName: requesterProfile?.name ?? "Unknown",
          requesterInitial: (requesterProfile?.name ?? "U").charAt(0).toUpperCase(),
        };
      });
    }),

  updateRequestStatus: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        status: z.enum(["accepted", "rejected", "completed"]),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] updateRequestStatus", input.requestId, "to", input.status);
      try {
        const updated = updateServiceRequestStatus(input.requestId, ctx.userId, input.status);

        if (input.status === "accepted") {
          const conv = getOrCreateConversation(ctx.userId, updated.requesterId);
          setRequestConversation(input.requestId, conv.id);
          updated.conversationId = conv.id;
          console.log("[Marketplace] created conversation", conv.id, "for accepted request", input.requestId);
        }

        return updated;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message === "REQUEST_NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        if (message === "NOT_OWNER") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not the service owner" });
        }
        throw err;
      }
    }),

  confirmDelivery: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] confirmDelivery", input.requestId, "by", ctx.userId);
      try {
        const updated = confirmServiceDelivery(input.requestId, ctx.userId);
        return updated;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message === "REQUEST_NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }
        if (message === "NOT_REQUESTER") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not the requester" });
        }
        if (message === "NOT_ACCEPTED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Request not in accepted state" });
        }
        throw err;
      }
    }),

  addReview: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        requestId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).default(""),
      })
    )
    .mutation(({ ctx, input }) => {
      console.log("[Marketplace] addReview for service", input.serviceId, "by", ctx.userId);
      const request = getServiceRequest(input.requestId);
      if (!request || request.requesterId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to review" });
      }
      if (request.status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only review completed services" });
      }
      const review = createReview(input.serviceId, input.requestId, ctx.userId, input.rating, input.comment);
      return review;
    }),

  getReviews: publicProcedure
    .input(z.object({ serviceId: z.string() }))
    .query(({ input }) => {
      const reviews = getServiceReviews(input.serviceId);
      const rating = getServiceAverageRating(input.serviceId);
      return {
        reviews: reviews.map((r) => {
          const reviewerProfile = getProfile(r.reviewerId);
          return {
            ...r,
            reviewerName: reviewerProfile?.name ?? "Unknown",
            reviewerInitial: (reviewerProfile?.name ?? "U").charAt(0).toUpperCase(),
          };
        }),
        averageRating: rating.average,
        reviewCount: rating.count,
      };
    }),

  getRequestByConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => {
      console.log("[Marketplace] getRequestByConversation", input.conversationId);
      const request = getRequestByConversation(input.conversationId);
      if (!request) return null;
      const service = getServiceListing(request.serviceId);
      return {
        ...request,
        serviceTitle: service?.title ?? "",
        serviceTitleAr: service?.titleAr ?? "",
      };
    }),
});
