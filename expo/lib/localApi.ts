import { store } from './localStore';
import type { Profile, NotificationType } from './localStore';
import { getAuthToken } from './authToken';

const AVATAR_COLORS = ['#1A6B4A', '#B8892A', '#C94458', '#2E7AD6', '#7C3AED', '#059669'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function getCurrentUserId(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const session = await store.getSession(token);
  return session?.userId ?? null;
}

function buildNotificationText(
  type: NotificationType,
  actorName: string,
  _referenceId: string
): { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string } {
  switch (type) {
    case 'like':
      return { titleEn: `${actorName} liked your post`, titleAr: `أعجب ${actorName} بمنشورك`, bodyEn: 'Tap to view the post', bodyAr: 'انقر لعرض المنشور' };
    case 'comment':
      return { titleEn: `${actorName} commented on your post`, titleAr: `علق ${actorName} على منشورك`, bodyEn: 'Tap to view the comment', bodyAr: 'انقر لعرض التعليق' };
    case 'message':
      return { titleEn: `${actorName} sent you a message`, titleAr: `أرسل لك ${actorName} رسالة`, bodyEn: 'Tap to read the message', bodyAr: 'انقر لقراءة الرسالة' };
    case 'service_request': {
      return { titleEn: `${actorName} requested your service`, titleAr: `طلب ${actorName} خدمتك`, bodyEn: 'Tap to view the request', bodyAr: 'انقر لعرض الطلب' };
    }
    default:
      return { titleEn: 'New notification', titleAr: 'إشعار جديد', bodyEn: '', bodyAr: '' };
  }
}

async function enrichPost(post: { id: string; authorId: string; content: string; topic: string; createdAt: string }, userId: string | null) {
  const authorProfile = await store.getProfile(post.authorId);
  return {
    ...post,
    authorName: authorProfile?.name ?? 'Unknown',
    authorRole: authorProfile?.role ?? '',
    authorCompany: authorProfile?.company ?? '',
    authorInitial: (authorProfile?.name ?? 'U').charAt(0).toUpperCase(),
    likesCount: await store.getLikeCount(post.id),
    commentsCount: await store.getCommentCount(post.id),
    savesCount: await store.getSaveCount(post.id),
    isLiked: userId ? await store.isLiked(post.id, userId) : false,
    isSaved: userId ? await store.isSaved(post.id, userId) : false,
  };
}

async function enrichService(s: { id: string; ownerId: string; title: string; titleAr: string; description: string; descriptionAr: string; category: string; categoryAr: string; price: string; priceAr: string; delivery: string; deliveryAr: string; features: Array<{ en: string; ar: string }>; createdAt: string; updatedAt: string }) {
  const ownerProfile = await store.getProfile(s.ownerId);
  return {
    ...s,
    ownerName: ownerProfile?.name ?? 'Business Hub',
    ownerInitial: (ownerProfile?.name ?? 'B').charAt(0).toUpperCase(),
    ownerRole: ownerProfile?.role ?? '',
  };
}

export const localApi = {
  auth: {
    register: {
      async mutate(input: { email: string; password: string; name: string }) {
        console.log('[LocalApi] register', input.email);
        const { user, profile } = await store.createUser(input.email, input.password, input.name);
        const session = await store.createSession(user.id);
        return { token: session.token, user: { id: user.id, email: user.email }, profile };
      },
    },
    login: {
      async mutate(input: { email: string; password: string }) {
        console.log('[LocalApi] login', input.email);
        const user = await store.findUserByEmail(input.email);
        if (!user) throw new Error('Invalid email or password');
        if (!store.verifyPassword(input.password, user.passwordHash)) throw new Error('Invalid email or password');
        const session = await store.createSession(user.id);
        const profile = await store.getProfile(user.id);
        return { token: session.token, user: { id: user.id, email: user.email }, profile: profile ?? null };
      },
    },
    me: {
      async query() {
        console.log('[LocalApi] me');
        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');
        const session = await store.getSession(token);
        if (!session) throw new Error('Not authenticated');
        const user = await store.findUserById(session.userId);
        if (!user) throw new Error('User not found');
        const profile = await store.getProfile(session.userId);
        return { user: { id: user.id, email: user.email }, profile: profile ?? null };
      },
    },
    updateProfile: {
      async mutate(input: Partial<Omit<Profile, 'userId' | 'avatarUrl'>>) {
        console.log('[LocalApi] updateProfile', input);
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        return await store.updateProfile(userId, input);
      },
    },
    logout: {
      async mutate() {
        console.log('[LocalApi] logout');
        const token = await getAuthToken();
        if (token) await store.deleteSession(token);
        return { success: true };
      },
    },
  },

  posts: {
    list: {
      async query(input: { cursor?: number; limit?: number }) {
        const userId = await getCurrentUserId();
        const result = await store.listPosts(input.cursor ?? 0, input.limit ?? 20);
        const enriched = await Promise.all(result.posts.map((p) => enrichPost(p, userId)));
        return { posts: enriched, nextCursor: result.nextCursor };
      },
    },
    byId: {
      async query(input: { id: string }) {
        const userId = await getCurrentUserId();
        const post = await store.getPost(input.id);
        if (!post) throw new Error('Post not found');
        return await enrichPost(post, userId);
      },
    },
    create: {
      async mutate(input: { content: string; topic: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const post = await store.createPost(userId, input.content, input.topic);
        return await enrichPost(post, userId);
      },
    },
    delete: {
      async mutate(input: { id: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const ok = await store.deletePost(input.id, userId);
        if (!ok) throw new Error('Cannot delete this post');
        return { success: true };
      },
    },
    toggleLike: {
      async mutate(input: { postId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const post = await store.getPost(input.postId);
        if (!post) throw new Error('Post not found');
        const liked = await store.toggleLike(input.postId, userId);
        if (liked && post.authorId !== userId) {
          await store.createNotification(post.authorId, 'like', userId, post.id);
        }
        return { liked, likesCount: await store.getLikeCount(input.postId) };
      },
    },
    toggleSave: {
      async mutate(input: { postId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const post = await store.getPost(input.postId);
        if (!post) throw new Error('Post not found');
        const saved = await store.toggleSave(input.postId, userId);
        return { saved, savesCount: await store.getSaveCount(input.postId) };
      },
    },
    savedPosts: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const savedList = await store.getUserSavedPosts(userId);
        return Promise.all(
          savedList.map(async (post) => {
            const enriched = await enrichPost(post, userId);
            return { ...enriched, isSaved: true };
          })
        );
      },
    },
    comments: {
      async query(input: { postId: string }) {
        const raw = await store.getPostComments(input.postId);
        return Promise.all(
          raw.map(async (c) => {
            const profile = await store.getProfile(c.authorId);
            return {
              ...c,
              authorName: profile?.name ?? 'Unknown',
              authorRole: profile?.role ?? '',
              authorInitial: (profile?.name ?? 'U').charAt(0).toUpperCase(),
            };
          })
        );
      },
    },
    addComment: {
      async mutate(input: { postId: string; content: string; parentId?: string | null }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const post = await store.getPost(input.postId);
        if (!post) throw new Error('Post not found');
        const comment = await store.addComment(input.postId, userId, input.content, input.parentId ?? null);
        if (post.authorId !== userId) {
          await store.createNotification(post.authorId, 'comment', userId, post.id);
        }
        const profile = await store.getProfile(userId);
        return {
          ...comment,
          authorName: profile?.name ?? 'Unknown',
          authorRole: profile?.role ?? '',
          authorInitial: (profile?.name ?? 'U').charAt(0).toUpperCase(),
        };
      },
    },
  },

  communities: {
    list: {
      async query(input?: { filter?: 'public' | 'private' | 'premium' }) {
        const userId = await getCurrentUserId();
        const raw = await store.listCommunities(input?.filter);
        return Promise.all(
          raw.map(async (c) => ({
            id: c.id,
            name: c.name,
            nameAr: c.nameAr,
            description: c.description,
            descriptionAr: c.descriptionAr,
            privacy: c.privacy,
            icon: c.icon,
            accent: c.accent,
            memberCount: await store.getCommunityMemberCount(c.id),
            postCount: await store.getCommunityPostCount(c.id),
            isMember: userId ? await store.isCommunityMember(c.id, userId) : false,
            createdAt: c.createdAt,
          }))
        );
      },
    },
    byId: {
      async query(input: { id: string }) {
        const userId = await getCurrentUserId();
        const c = await store.getCommunity(input.id);
        if (!c) throw new Error('Community not found');
        return {
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          description: c.description,
          descriptionAr: c.descriptionAr,
          privacy: c.privacy,
          icon: c.icon,
          accent: c.accent,
          memberCount: await store.getCommunityMemberCount(c.id),
          postCount: await store.getCommunityPostCount(c.id),
          isMember: userId ? await store.isCommunityMember(c.id, userId) : false,
          createdBy: c.createdBy,
          createdAt: c.createdAt,
        };
      },
    },
    join: {
      async mutate(input: { communityId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        await store.joinCommunity(input.communityId, userId);
        const c = await store.getCommunity(input.communityId);
        if (c) {
          await store.getOrCreateCommunityConversation(input.communityId, c.name, c.icon, userId);
          console.log('[LocalApi] created community chat for', c.name);
        }
        return { success: true, isMember: true, memberCount: await store.getCommunityMemberCount(input.communityId) };
      },
    },
    leave: {
      async mutate(input: { communityId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        await store.leaveCommunity(input.communityId, userId);
        await store.removeCommunityConversationParticipant(input.communityId, userId);
        return { success: true, isMember: false, memberCount: await store.getCommunityMemberCount(input.communityId) };
      },
    },
    toggleNotifications: {
      async mutate(input: { communityId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const current = await store.getCommunityNotifications(input.communityId, userId);
        await store.setCommunityNotifications(input.communityId, userId, !current);
        return { enabled: !current };
      },
    },
    getNotificationSetting: {
      async query(input: { communityId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) return { enabled: true };
        const enabled = await store.getCommunityNotifications(input.communityId, userId);
        return { enabled };
      },
    },
    members: {
      async query(input: { communityId: string }) {
        const c = await store.getCommunity(input.communityId);
        if (!c) throw new Error('Community not found');
        const memberIds = await store.getCommunityMemberIds(input.communityId);
        return Promise.all(
          memberIds
            .filter((id) => id !== 'system')
            .map(async (id) => {
              const profile = await store.getProfile(id);
              return {
                userId: id,
                name: profile?.name ?? 'Unknown',
                role: profile?.role ?? '',
                company: profile?.company ?? '',
                initial: (profile?.name ?? 'U').charAt(0).toUpperCase(),
                isModerator: id === c.createdBy,
              };
            })
        );
      },
    },
    posts: {
      async query(input: { communityId: string; cursor?: number; limit?: number }) {
        const userId = await getCurrentUserId();
        const c = await store.getCommunity(input.communityId);
        if (!c) throw new Error('Community not found');
        const { postIds, nextCursor } = await store.getCommunityPostIds(input.communityId, input.cursor ?? 0, input.limit ?? 20);
        const enriched = await Promise.all(
          postIds.map(async (pid) => {
            const post = await store.getPost(pid);
            if (!post) return null;
            return enrichPost(post, userId);
          })
        );
        return { posts: enriched.filter((p): p is NonNullable<typeof p> => p !== null), nextCursor };
      },
    },
    createPost: {
      async mutate(input: { communityId: string; content: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const c = await store.getCommunity(input.communityId);
        if (!c) throw new Error('Community not found');
        const isMember = await store.isCommunityMember(input.communityId, userId);
        if (!isMember) throw new Error('Must be a member to post');
        const post = await store.createPost(userId, input.content, c.name);
        await store.addPostToCommunity(input.communityId, post.id);
        return await enrichPost(post, userId);
      },
    },
  },

  messages: {
    listConversations: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const convs = await store.getUserConversations(userId);
        return Promise.all(
          convs.map(async (conv) => {
            const otherParticipantId = conv.participants.find((p) => p !== userId) ?? conv.participants[0];
            const otherProfile = await store.getProfile(otherParticipantId);
            const otherUser = await store.findUserById(otherParticipantId);
            const last = await store.getLastMessage(conv.id);
            const unread = await store.getUnreadCount(conv.id, userId);
            return {
              id: conv.id,
              participants: conv.participants,
              otherUser: {
                id: otherParticipantId,
                name: otherProfile?.name ?? otherUser?.email ?? 'Unknown',
                avatarUrl: otherProfile?.avatarUrl ?? null,
                role: otherProfile?.role ?? '',
              },
              lastMessage: last ?? null,
              unreadCount: unread,
              updatedAt: conv.updatedAt,
              communityId: conv.communityId ?? undefined,
              communityName: conv.communityName ?? undefined,
              communityIcon: conv.communityIcon ?? undefined,
            };
          })
        );
      },
    },
    getOrCreate: {
      async mutate(input: { otherUserId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        if (input.otherUserId === userId) throw new Error('Cannot message yourself');
        const conv = await store.getOrCreateConversation(userId, input.otherUserId);
        return { conversationId: conv.id };
      },
    },
    getMessages: {
      async query(input: { conversationId: string; cursor?: number; limit?: number }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const conv = await store.getConversation(input.conversationId);
        if (!conv) throw new Error('Conversation not found');
        if (!conv.participants.includes(userId)) throw new Error('Not a participant');
        return await store.getConversationMessages(input.conversationId, input.cursor ?? 0, input.limit ?? 50);
      },
    },
    send: {
      async mutate(input: { conversationId: string; content: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const conv = await store.getConversation(input.conversationId);
        if (!conv) throw new Error('Conversation not found');
        if (!conv.participants.includes(userId)) throw new Error('Not a participant');
        const msg = await store.sendMessage(input.conversationId, userId, input.content);
        for (const pid of conv.participants) {
          if (pid !== userId) {
            await store.createNotification(pid, 'message', userId, input.conversationId);
          }
        }
        return msg;
      },
    },
    markRead: {
      async mutate(input: { conversationId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const marked = await store.markConversationRead(input.conversationId, userId);
        return { marked };
      },
    },
    getConversationInfo: {
      async query(input: { conversationId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const conv = await store.getConversation(input.conversationId);
        if (!conv) throw new Error('Conversation not found');
        if (!conv.participants.includes(userId)) throw new Error('Not a participant');
        const otherParticipantId = conv.participants.find((p) => p !== userId) ?? conv.participants[0];
        const otherProfile = await store.getProfile(otherParticipantId);
        const otherUser = await store.findUserById(otherParticipantId);
        return {
          id: conv.id,
          participants: conv.participants,
          otherUser: {
            id: otherParticipantId,
            name: otherProfile?.name ?? otherUser?.email ?? 'Unknown',
            avatarUrl: otherProfile?.avatarUrl ?? null,
            role: otherProfile?.role ?? '',
          },
          updatedAt: conv.updatedAt,
        };
      },
    },
  },

  marketplace: {
    list: {
      async query(input: { cursor?: number; limit?: number; category?: string }) {
        const result = await store.listServiceListings(input.cursor ?? 0, input.limit ?? 20, input.category);
        const enriched = await Promise.all(result.services.map(enrichService));
        return { services: enriched, nextCursor: result.nextCursor };
      },
    },
    byId: {
      async query(input: { id: string }) {
        const service = await store.getServiceListing(input.id);
        if (!service) throw new Error('Service not found');
        return await enrichService(service);
      },
    },
    create: {
      async mutate(input: { title: string; titleAr: string; description?: string; descriptionAr?: string; category: string; categoryAr: string; price: string; priceAr: string; delivery: string; deliveryAr: string; features?: Array<{ en: string; ar: string }> }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const service = await store.createServiceListing(userId, {
          title: input.title,
          titleAr: input.titleAr,
          description: input.description ?? '',
          descriptionAr: input.descriptionAr ?? '',
          category: input.category,
          categoryAr: input.categoryAr,
          price: input.price,
          priceAr: input.priceAr,
          delivery: input.delivery,
          deliveryAr: input.deliveryAr,
          features: input.features ?? [],
        });
        return await enrichService(service);
      },
    },
    update: {
      async mutate(input: { id: string; title?: string; titleAr?: string; description?: string; descriptionAr?: string; category?: string; categoryAr?: string; price?: string; priceAr?: string; delivery?: string; deliveryAr?: string; features?: Array<{ en: string; ar: string }> }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const { id, ...data } = input;
        const service = await store.updateServiceListing(id, userId, data);
        return await enrichService(service);
      },
    },
    delete: {
      async mutate(input: { id: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const ok = await store.deleteServiceListing(input.id, userId);
        if (!ok) throw new Error('Cannot delete this service');
        return { success: true };
      },
    },
    myListings: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const listings = await store.getUserServiceListings(userId);
        return Promise.all(listings.map(enrichService));
      },
    },
    requestService: {
      async mutate(input: { serviceId: string; message?: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const request = await store.createServiceRequest(input.serviceId, userId, input.message ?? '');
        const service = await store.getServiceListing(request.serviceId);
        if (service) {
          await store.createNotification(service.ownerId, 'service_request', userId, service.id);
        }
        return {
          ...request,
          serviceTitle: service?.title ?? '',
          serviceTitleAr: service?.titleAr ?? '',
        };
      },
    },
    myRequests: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const requests = await store.getUserServiceRequests(userId);
        return Promise.all(
          requests.map(async (r) => {
            const service = await store.getServiceListing(r.serviceId);
            return { ...r, serviceTitle: service?.title ?? '', serviceTitleAr: service?.titleAr ?? '' };
          })
        );
      },
    },
    serviceRequests: {
      async query(input: { serviceId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const service = await store.getServiceListing(input.serviceId);
        if (!service || service.ownerId !== userId) throw new Error('Not the owner');
        const requests = await store.getServiceRequests(input.serviceId);
        return Promise.all(
          requests.map(async (r) => {
            const requesterProfile = await store.getProfile(r.requesterId);
            return {
              ...r,
              requesterName: requesterProfile?.name ?? 'Unknown',
              requesterInitial: (requesterProfile?.name ?? 'U').charAt(0).toUpperCase(),
            };
          })
        );
      },
    },
    updateRequestStatus: {
      async mutate(input: { requestId: string; status: 'accepted' | 'rejected' | 'completed' }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        return await store.updateServiceRequestStatus(input.requestId, userId, input.status);
      },
    },
  },

  users: {
    list: {
      async query() {
        const profiles = await store.listAllUsers();
        return profiles.map((p) => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          company: p.company,
          initial: (p.name || 'U').charAt(0).toUpperCase(),
        }));
      },
    },
    stats: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) return { postsCount: 0, commentsCount: 0, receivedLikes: 0, servicesCount: 0, completedServices: 0, communitiesJoined: 0, postsThisMonth: 0, reputationLevel: 0, reputationProgress: 0 };
        return await store.getUserStats(userId);
      },
    },
    totalUnread: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) return { count: 0 };
        const count = await store.getTotalUnreadMessages(userId);
        return { count };
      },
    },
    profile: {
      async query(input: { userId: string }) {
        const currentUserId = await getCurrentUserId();
        const profile = await store.getProfile(input.userId);
        if (!profile) throw new Error('User not found');
        const followersCount = await store.getFollowersCount(input.userId);
        const followingCount = await store.getFollowingCount(input.userId);
        const isFollowing = currentUserId ? await store.isFollowing(currentUserId, input.userId) : false;
        const stats = await store.getUserStats(input.userId);
        const repStats = await store.getReputationStats(input.userId);
        return {
          ...profile,
          followersCount,
          followingCount,
          isFollowing,
          isOwnProfile: currentUserId === input.userId,
          stats,
          reputationLevel: repStats.level,
          reputationProgress: repStats.progress,
        };
      },
    },
    userPosts: {
      async query(input: { userId: string }) {
        const currentUserId = await getCurrentUserId();
        const posts = await store.getUserPosts(input.userId);
        return Promise.all(posts.map((p) => enrichPost(p, currentUserId)));
      },
    },
    userLikedPosts: {
      async query(input: { userId: string }) {
        const currentUserId = await getCurrentUserId();
        const likedIds = await store.getUserLikedPostIds(input.userId);
        const allPosts = await Promise.all(likedIds.map((id) => store.getPost(id)));
        const validPosts = allPosts.filter((p): p is NonNullable<typeof p> => p !== null);
        return Promise.all(validPosts.map((p) => enrichPost(p, currentUserId)));
      },
    },
    userCommunities: {
      async query(input: { userId: string }) {
        const communityIds = await store.getUserCommunityIds(input.userId);
        return Promise.all(
          communityIds.map(async (cid) => {
            const c = await store.getCommunity(cid);
            if (!c) return null;
            return {
              id: c.id,
              name: c.name,
              nameAr: c.nameAr,
              icon: c.icon,
              accent: c.accent,
              memberCount: await store.getCommunityMemberCount(c.id),
              privacy: c.privacy,
            };
          })
        ).then((r) => r.filter((c): c is NonNullable<typeof c> => c !== null));
      },
    },
    userServices: {
      async query(input: { userId: string }) {
        const listings = await store.getUserServiceListings(input.userId);
        return Promise.all(listings.map(enrichService));
      },
    },
    follow: {
      async mutate(input: { targetUserId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        await store.followUser(userId, input.targetUserId);
        return { success: true, isFollowing: true };
      },
    },
    unfollow: {
      async mutate(input: { targetUserId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        await store.unfollowUser(userId, input.targetUserId);
        return { success: true, isFollowing: false };
      },
    },
  },

  search: {
    query: {
      async query(input: { q: string; limit?: number }) {
        const userId = await getCurrentUserId();
        const results = await store.searchAll(input.q, input.limit ?? 10);

        const posts = await Promise.all(results.posts.map((p) => enrichPost(p, userId)));

        const communities = await Promise.all(
          results.communities.map(async (c) => ({
            ...c,
            memberCount: await store.getCommunityMemberCount(c.id),
            isMember: userId ? await store.isCommunityMember(c.id, userId) : false,
          }))
        );

        const services = await Promise.all(
          results.services.map(async (s) => {
            const ownerProfile = await store.getProfile(s.ownerId);
            return {
              ...s,
              ownerName: ownerProfile?.name ?? 'Unknown',
              ownerInitial: (ownerProfile?.name ?? 'U').charAt(0).toUpperCase(),
            };
          })
        );

        const users = results.users.map((p) => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          company: p.company,
          bio: p.bio,
          industry: p.industry,
          initial: (p.name || 'U').charAt(0).toUpperCase(),
        }));

        return { posts, communities, services, users };
      },
    },
  },

  notifications: {
    list: {
      async query(input: { cursor?: number; limit?: number; filter?: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const result = await store.getUserNotifications(userId, input.cursor ?? 0, input.limit ?? 20, input.filter);
        const enriched = await Promise.all(
          result.notifications.map(async (n) => {
            const actorProfile = await store.getProfile(n.actorId);
            const actorName = actorProfile?.name ?? 'Someone';
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
          })
        );
        return { notifications: enriched, nextCursor: result.nextCursor };
      },
    },
    unreadCount: {
      async query() {
        const userId = await getCurrentUserId();
        if (!userId) return { count: 0 };
        const count = await store.getUnreadNotificationCount(userId);
        return { count };
      },
    },
    markRead: {
      async mutate(input: { notificationId: string }) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const ok = await store.markNotificationRead(input.notificationId, userId);
        return { success: ok };
      },
    },
    markAllRead: {
      async mutate() {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Not authenticated');
        const count = await store.markAllNotificationsRead(userId);
        return { marked: count };
      },
    },
  },
};
