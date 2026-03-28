import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { postsRouter } from "./routes/posts";
import { communitiesRouter } from "./routes/communities";
import { messagesRouter } from "./routes/messages";
import { marketplaceRouter } from "./routes/marketplace";
import { searchRouter } from "./routes/search";
import { notificationsRouter } from "./routes/notifications";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  posts: postsRouter,
  communities: communitiesRouter,
  messages: messagesRouter,
  marketplace: marketplaceRouter,
  search: searchRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
