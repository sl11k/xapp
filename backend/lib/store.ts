function generateId(): string {
  return crypto.randomUUID();
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  name: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  industry: string;
  experience: string;
  skills: string[];
  avatarUrl: string | null;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

const users = new Map<string, User>();
const profiles = new Map<string, Profile>();
const sessions = new Map<string, Session>();
const emailIndex = new Map<string, string>();

function hashPassword(password: string): string {
  let hash = 0;
  const salt = "bh_salt_2024";
  const input = salt + password + salt;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return "h_" + Math.abs(hash).toString(36);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash;
}

export function createUser(email: string, password: string, name: string): { user: User; profile: Profile } {
  const normalizedEmail = email.toLowerCase().trim();

  if (emailIndex.has(normalizedEmail)) {
    throw new Error("EMAIL_EXISTS");
  }

  const id = generateId();
  const user: User = {
    id,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  const profile: Profile = {
    userId: id,
    name,
    role: "",
    company: "",
    location: "",
    bio: "",
    industry: "",
    experience: "",
    skills: [],
    avatarUrl: null,
  };

  users.set(id, user);
  profiles.set(id, profile);
  emailIndex.set(normalizedEmail, id);

  console.log("[Store] created user", id, normalizedEmail);
  return { user, profile };
}

export function findUserByEmail(email: string): User | undefined {
  const normalizedEmail = email.toLowerCase().trim();
  const userId = emailIndex.get(normalizedEmail);
  if (!userId) return undefined;
  return users.get(userId);
}

export function findUserById(id: string): User | undefined {
  return users.get(id);
}

export function getProfile(userId: string): Profile | undefined {
  return profiles.get(userId);
}

export function updateProfile(userId: string, data: Partial<Omit<Profile, "userId">>): Profile {
  const existing = profiles.get(userId);
  if (!existing) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const updated: Profile = { ...existing, ...data, userId };
  profiles.set(userId, updated);
  console.log("[Store] updated profile for", userId);
  return updated;
}

export function createSession(userId: string): Session {
  const token = generateId() + "-" + generateId();
  const session: Session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
  };
  sessions.set(token, session);
  console.log("[Store] created session for", userId);
  return session;
}

export function getSession(token: string): Session | undefined {
  return sessions.get(token);
}

export function deleteSession(token: string): void {
  sessions.delete(token);
  console.log("[Store] deleted session", token);
}

export function deleteAllUserSessions(userId: string): void {
  for (const [token, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
  console.log("[Store] deleted all sessions for", userId);
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  topic: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
}

const posts = new Map<string, Post>();
const comments = new Map<string, Comment>();
const likes = new Map<string, Set<string>>();
const saves = new Map<string, Set<string>>();
const postOrder: string[] = [];

export function createPost(authorId: string, content: string, topic: string): Post {
  const id = generateId();
  const post: Post = {
    id,
    authorId,
    content,
    topic,
    createdAt: new Date().toISOString(),
  };
  posts.set(id, post);
  postOrder.unshift(id);
  likes.set(id, new Set());
  saves.set(id, new Set());
  console.log("[Store] created post", id, "by", authorId);
  return post;
}

export function getPost(id: string): Post | undefined {
  return posts.get(id);
}

export function listPosts(cursor: number, limit: number): { posts: Post[]; nextCursor: number | null } {
  const start = cursor;
  const end = Math.min(start + limit, postOrder.length);
  const result: Post[] = [];
  for (let i = start; i < end; i++) {
    const p = posts.get(postOrder[i]);
    if (p) result.push(p);
  }
  const nextCursor = end < postOrder.length ? end : null;
  console.log("[Store] listPosts cursor=", cursor, "limit=", limit, "returned=", result.length);
  return { posts: result, nextCursor };
}

export function deletePost(id: string, userId: string): boolean {
  const post = posts.get(id);
  if (!post || post.authorId !== userId) return false;
  posts.delete(id);
  const idx = postOrder.indexOf(id);
  if (idx !== -1) postOrder.splice(idx, 1);
  likes.delete(id);
  saves.delete(id);
  for (const [cid, c] of comments) {
    if (c.postId === id) comments.delete(cid);
  }
  console.log("[Store] deleted post", id);
  return true;
}

export function toggleLike(postId: string, userId: string): boolean {
  let set = likes.get(postId);
  if (!set) {
    set = new Set();
    likes.set(postId, set);
  }
  if (set.has(userId)) {
    set.delete(userId);
    console.log("[Store] unliked", postId, "by", userId);
    return false;
  } else {
    set.add(userId);
    console.log("[Store] liked", postId, "by", userId);
    return true;
  }
}

export function isLiked(postId: string, userId: string): boolean {
  return likes.get(postId)?.has(userId) ?? false;
}

export function getLikeCount(postId: string): number {
  return likes.get(postId)?.size ?? 0;
}

export function toggleSave(postId: string, userId: string): boolean {
  let set = saves.get(postId);
  if (!set) {
    set = new Set();
    saves.set(postId, set);
  }
  if (set.has(userId)) {
    set.delete(userId);
    console.log("[Store] unsaved", postId, "by", userId);
    return false;
  } else {
    set.add(userId);
    console.log("[Store] saved", postId, "by", userId);
    return true;
  }
}

export function isSaved(postId: string, userId: string): boolean {
  return saves.get(postId)?.has(userId) ?? false;
}

export function getSaveCount(postId: string): number {
  return saves.get(postId)?.size ?? 0;
}

export function getUserSavedPosts(userId: string): Post[] {
  const result: Post[] = [];
  for (const [postId, set] of saves) {
    if (set.has(userId)) {
      const p = posts.get(postId);
      if (p) result.push(p);
    }
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  console.log("[Store] getUserSavedPosts", userId, "count=", result.length);
  return result;
}

export function addComment(postId: string, authorId: string, content: string, parentId: string | null): Comment {
  const id = generateId();
  const comment: Comment = {
    id,
    postId,
    authorId,
    content,
    parentId,
    createdAt: new Date().toISOString(),
  };
  comments.set(id, comment);
  console.log("[Store] added comment", id, "on post", postId);
  return comment;
}

export function getPostComments(postId: string): Comment[] {
  const result: Comment[] = [];
  for (const c of comments.values()) {
    if (c.postId === postId) result.push(c);
  }
  result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return result;
}

export function getCommentCount(postId: string): number {
  let count = 0;
  for (const c of comments.values()) {
    if (c.postId === postId) count++;
  }
  return count;
}

export interface Community {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  privacy: "public" | "private" | "premium";
  icon: string;
  accent: string;
  createdBy: string;
  createdAt: string;
}

const communitiesMap = new Map<string, Community>();
const communityMembers = new Map<string, Set<string>>();
const communityPosts = new Map<string, string[]>();

export function createCommunity(
  createdBy: string,
  data: { name: string; nameAr: string; description: string; descriptionAr: string; privacy: "public" | "private" | "premium"; icon: string; accent: string }
): Community {
  const id = generateId();
  const community: Community = {
    id,
    ...data,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  communitiesMap.set(id, community);
  communityMembers.set(id, new Set([createdBy]));
  communityPosts.set(id, []);
  console.log("[Store] created community", id, data.name);
  return community;
}

export function getCommunity(id: string): Community | undefined {
  return communitiesMap.get(id);
}

export function listCommunities(filter?: "public" | "private" | "premium"): Community[] {
  const result: Community[] = [];
  for (const c of communitiesMap.values()) {
    if (!filter || c.privacy === filter) {
      result.push(c);
    }
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  console.log("[Store] listCommunities filter=", filter, "count=", result.length);
  return result;
}

export function joinCommunity(communityId: string, userId: string): boolean {
  const members = communityMembers.get(communityId);
  if (!members) return false;
  if (members.has(userId)) return false;
  members.add(userId);
  console.log("[Store] user", userId, "joined community", communityId);
  return true;
}

export function leaveCommunity(communityId: string, userId: string): boolean {
  const members = communityMembers.get(communityId);
  if (!members) return false;
  if (!members.has(userId)) return false;
  members.delete(userId);
  console.log("[Store] user", userId, "left community", communityId);
  return true;
}

export function isCommunityMember(communityId: string, userId: string): boolean {
  return communityMembers.get(communityId)?.has(userId) ?? false;
}

export function getCommunityMemberIds(communityId: string): string[] {
  const members = communityMembers.get(communityId);
  if (!members) return [];
  return Array.from(members);
}

export function getCommunityMemberCount(communityId: string): number {
  return communityMembers.get(communityId)?.size ?? 0;
}

export function addPostToCommunity(communityId: string, postId: string): void {
  const postsList = communityPosts.get(communityId);
  if (postsList) {
    postsList.unshift(postId);
    console.log("[Store] added post", postId, "to community", communityId);
  }
}

export function getCommunityPostIds(communityId: string, cursor: number, limit: number): { postIds: string[]; nextCursor: number | null } {
  const postsList = communityPosts.get(communityId) ?? [];
  const start = cursor;
  const end = Math.min(start + limit, postsList.length);
  const postIds = postsList.slice(start, end);
  const nextCursor = end < postsList.length ? end : null;
  return { postIds, nextCursor };
}

export function getCommunityPostCount(communityId: string): number {
  return communityPosts.get(communityId)?.length ?? 0;
}

function seedCommunities(): void {
  const seedData: Array<{ name: string; nameAr: string; description: string; descriptionAr: string; privacy: "public" | "private" | "premium"; icon: string; accent: string }> = [
    {
      name: "Business Strategy",
      nameAr: "استراتيجية الأعمال",
      description: "Discuss business strategies, growth plans, and market analysis",
      descriptionAr: "ناقش استراتيجيات الأعمال وخطط النمو وتحليل السوق",
      privacy: "public",
      icon: "📊",
      accent: "#1A6B4A",
    },
    {
      name: "Legal & Compliance",
      nameAr: "القانون والامتثال",
      description: "Stay updated on legal frameworks and compliance requirements",
      descriptionAr: "ابقَ على اطلاع بالأطر القانونية ومتطلبات الامتثال",
      privacy: "public",
      icon: "⚖️",
      accent: "#2E7AD6",
    },
    {
      name: "Startup Founders",
      nameAr: "مؤسسو الشركات الناشئة",
      description: "A community for startup founders to share experiences and get advice",
      descriptionAr: "مجتمع لمؤسسي الشركات الناشئة لمشاركة الخبرات والحصول على المشورة",
      privacy: "public",
      icon: "🚀",
      accent: "#C94458",
    },
    {
      name: "Executive Circle",
      nameAr: "دائرة القادة التنفيذيين",
      description: "Exclusive community for C-level executives and senior leaders",
      descriptionAr: "مجتمع حصري للمدراء التنفيذيين والقادة الكبار",
      privacy: "premium",
      icon: "👔",
      accent: "#B8892A",
    },
    {
      name: "Finance & Investment",
      nameAr: "المالية والاستثمار",
      description: "Discuss financial markets, investment strategies, and economic trends",
      descriptionAr: "ناقش الأسواق المالية واستراتيجيات الاستثمار والاتجاهات الاقتصادية",
      privacy: "public",
      icon: "💰",
      accent: "#16A34A",
    },
    {
      name: "Tech Innovation Hub",
      nameAr: "مركز الابتكار التقني",
      description: "Explore cutting-edge technology trends and digital transformation",
      descriptionAr: "استكشف أحدث اتجاهات التكنولوجيا والتحول الرقمي",
      privacy: "private",
      icon: "💡",
      accent: "#7C3AED",
    },
  ];

  const systemUserId = "system";
  for (const data of seedData) {
    createCommunity(systemUserId, data);
  }
  console.log("[Store] seeded", seedData.length, "communities");
}

seedCommunities();

// ── Messaging ──

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: Set<string>;
}

export interface ConversationRecord {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
}

const conversationsMap = new Map<string, ConversationRecord>();
const messagesMap = new Map<string, Message>();
const conversationMessages = new Map<string, string[]>();
const userConversations = new Map<string, Set<string>>();

export function findConversation(userA: string, userB: string): ConversationRecord | undefined {
  const convIds = userConversations.get(userA);
  if (!convIds) return undefined;
  for (const cid of convIds) {
    const conv = conversationsMap.get(cid);
    if (conv && conv.participants.length === 2 && conv.participants.includes(userB)) {
      return conv;
    }
  }
  return undefined;
}

export function createConversation(participants: string[]): ConversationRecord {
  const id = generateId();
  const now = new Date().toISOString();
  const conv: ConversationRecord = { id, participants, createdAt: now, updatedAt: now };
  conversationsMap.set(id, conv);
  conversationMessages.set(id, []);
  for (const uid of participants) {
    let set = userConversations.get(uid);
    if (!set) {
      set = new Set();
      userConversations.set(uid, set);
    }
    set.add(id);
  }
  console.log("[Store] created conversation", id, "participants=", participants);
  return conv;
}

export function getConversation(id: string): ConversationRecord | undefined {
  return conversationsMap.get(id);
}

export function getUserConversations(userId: string): ConversationRecord[] {
  const convIds = userConversations.get(userId);
  if (!convIds) return [];
  const result: ConversationRecord[] = [];
  for (const cid of convIds) {
    const conv = conversationsMap.get(cid);
    if (conv) result.push(conv);
  }
  result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  console.log("[Store] getUserConversations", userId, "count=", result.length);
  return result;
}

export function sendMessage(conversationId: string, senderId: string, content: string): Message {
  const conv = conversationsMap.get(conversationId);
  if (!conv) throw new Error("CONVERSATION_NOT_FOUND");
  if (!conv.participants.includes(senderId)) throw new Error("NOT_PARTICIPANT");

  const id = generateId();
  const now = new Date().toISOString();
  const msg: Message = {
    id,
    conversationId,
    senderId,
    content,
    createdAt: now,
    readBy: new Set([senderId]),
  };
  messagesMap.set(id, msg);
  const msgList = conversationMessages.get(conversationId) ?? [];
  msgList.push(id);
  conversationMessages.set(conversationId, msgList);
  conv.updatedAt = now;
  console.log("[Store] sent message", id, "in conv", conversationId);
  return msg;
}

export function getConversationMessages(
  conversationId: string,
  cursor: number,
  limit: number
): { messages: Message[]; nextCursor: number | null } {
  const msgIds = conversationMessages.get(conversationId) ?? [];
  const total = msgIds.length;
  const end = total - cursor;
  const start = Math.max(end - limit, 0);
  const result: Message[] = [];
  for (let i = start; i < end; i++) {
    const m = messagesMap.get(msgIds[i]);
    if (m) result.push(m);
  }
  const nextCursor = start > 0 ? total - start : null;
  console.log("[Store] getConversationMessages conv=", conversationId, "cursor=", cursor, "returned=", result.length);
  return { messages: result, nextCursor };
}

export function markConversationRead(conversationId: string, userId: string): number {
  const msgIds = conversationMessages.get(conversationId) ?? [];
  let marked = 0;
  for (const mid of msgIds) {
    const msg = messagesMap.get(mid);
    if (msg && !msg.readBy.has(userId)) {
      msg.readBy.add(userId);
      marked++;
    }
  }
  console.log("[Store] markConversationRead conv=", conversationId, "user=", userId, "marked=", marked);
  return marked;
}

export function getUnreadCount(conversationId: string, userId: string): number {
  const msgIds = conversationMessages.get(conversationId) ?? [];
  let count = 0;
  for (const mid of msgIds) {
    const msg = messagesMap.get(mid);
    if (msg && !msg.readBy.has(userId)) count++;
  }
  return count;
}

export function getLastMessage(conversationId: string): Message | undefined {
  const msgIds = conversationMessages.get(conversationId) ?? [];
  if (msgIds.length === 0) return undefined;
  return messagesMap.get(msgIds[msgIds.length - 1]);
}

export function getOrCreateConversation(userA: string, userB: string): ConversationRecord {
  const existing = findConversation(userA, userB);
  if (existing) return existing;
  return createConversation([userA, userB]);
}

// ── Marketplace ──

export interface ServiceListingRecord {
  id: string;
  ownerId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  price: string;
  priceAr: string;
  delivery: string;
  deliveryAr: string;
  features: Array<{ en: string; ar: string }>;
  createdAt: string;
  updatedAt: string;
}

export type ServiceRequestStatus = "pending" | "accepted" | "rejected" | "completed";

export interface ServiceRequestRecord {
  id: string;
  serviceId: string;
  requesterId: string;
  message: string;
  proposedPrice: string;
  proposedTimeline: string;
  status: ServiceRequestStatus;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  serviceId: string;
  requestId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const reviewsMap = new Map<string, ReviewRecord>();
const reviewsByService = new Map<string, string[]>();

const servicesMap = new Map<string, ServiceListingRecord>();
const serviceOrder: string[] = [];
const serviceRequestsMap = new Map<string, ServiceRequestRecord>();
const serviceRequestsByService = new Map<string, string[]>();
const serviceRequestsByUser = new Map<string, string[]>();

export function createServiceListing(
  ownerId: string,
  data: Omit<ServiceListingRecord, "id" | "ownerId" | "createdAt" | "updatedAt">
): ServiceListingRecord {
  const id = generateId();
  const now = new Date().toISOString();
  const record: ServiceListingRecord = { id, ownerId, ...data, createdAt: now, updatedAt: now };
  servicesMap.set(id, record);
  serviceOrder.unshift(id);
  console.log("[Store] created service listing", id, "by", ownerId);
  return record;
}

export function updateServiceListing(
  id: string,
  ownerId: string,
  data: Partial<Omit<ServiceListingRecord, "id" | "ownerId" | "createdAt" | "updatedAt">>
): ServiceListingRecord {
  const existing = servicesMap.get(id);
  if (!existing) throw new Error("SERVICE_NOT_FOUND");
  if (existing.ownerId !== ownerId) throw new Error("NOT_OWNER");
  const updated: ServiceListingRecord = { ...existing, ...data, updatedAt: new Date().toISOString() };
  servicesMap.set(id, updated);
  console.log("[Store] updated service listing", id);
  return updated;
}

export function getServiceListing(id: string): ServiceListingRecord | undefined {
  return servicesMap.get(id);
}

export function listServiceListings(
  cursor: number,
  limit: number,
  category?: string
): { services: ServiceListingRecord[]; nextCursor: number | null } {
  let ids = serviceOrder;
  if (category) {
    ids = ids.filter((sid) => {
      const s = servicesMap.get(sid);
      return s && (s.category === category || s.categoryAr === category);
    });
  }
  const start = cursor;
  const end = Math.min(start + limit, ids.length);
  const result: ServiceListingRecord[] = [];
  for (let i = start; i < end; i++) {
    const s = servicesMap.get(ids[i]);
    if (s) result.push(s);
  }
  const nextCursor = end < ids.length ? end : null;
  console.log("[Store] listServiceListings cursor=", cursor, "limit=", limit, "returned=", result.length);
  return { services: result, nextCursor };
}

export function getUserServiceListings(ownerId: string): ServiceListingRecord[] {
  const result: ServiceListingRecord[] = [];
  for (const s of servicesMap.values()) {
    if (s.ownerId === ownerId) result.push(s);
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export function deleteServiceListing(id: string, ownerId: string): boolean {
  const s = servicesMap.get(id);
  if (!s || s.ownerId !== ownerId) return false;
  servicesMap.delete(id);
  const idx = serviceOrder.indexOf(id);
  if (idx !== -1) serviceOrder.splice(idx, 1);
  console.log("[Store] deleted service listing", id);
  return true;
}

export function createServiceRequest(
  serviceId: string,
  requesterId: string,
  message: string,
  proposedPrice: string = "",
  proposedTimeline: string = ""
): ServiceRequestRecord {
  const service = servicesMap.get(serviceId);
  if (!service) throw new Error("SERVICE_NOT_FOUND");
  if (service.ownerId === requesterId) throw new Error("CANNOT_REQUEST_OWN");

  const id = generateId();
  const now = new Date().toISOString();
  const record: ServiceRequestRecord = {
    id,
    serviceId,
    requesterId,
    message,
    proposedPrice,
    proposedTimeline,
    status: "pending",
    conversationId: null,
    createdAt: now,
    updatedAt: now,
  };
  serviceRequestsMap.set(id, record);

  let byService = serviceRequestsByService.get(serviceId);
  if (!byService) { byService = []; serviceRequestsByService.set(serviceId, byService); }
  byService.unshift(id);

  let byUser = serviceRequestsByUser.get(requesterId);
  if (!byUser) { byUser = []; serviceRequestsByUser.set(requesterId, byUser); }
  byUser.unshift(id);

  console.log("[Store] created service request", id, "for service", serviceId, "by", requesterId);
  return record;
}

export function getServiceRequest(id: string): ServiceRequestRecord | undefined {
  return serviceRequestsMap.get(id);
}

export function getUserServiceRequests(userId: string): ServiceRequestRecord[] {
  const ids = serviceRequestsByUser.get(userId) ?? [];
  const result: ServiceRequestRecord[] = [];
  for (const rid of ids) {
    const r = serviceRequestsMap.get(rid);
    if (r) result.push(r);
  }
  return result;
}

export function getServiceRequests(serviceId: string): ServiceRequestRecord[] {
  const ids = serviceRequestsByService.get(serviceId) ?? [];
  const result: ServiceRequestRecord[] = [];
  for (const rid of ids) {
    const r = serviceRequestsMap.get(rid);
    if (r) result.push(r);
  }
  return result;
}

export function updateServiceRequestStatus(
  requestId: string,
  ownerId: string,
  status: ServiceRequestStatus
): ServiceRequestRecord {
  const request = serviceRequestsMap.get(requestId);
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  const service = servicesMap.get(request.serviceId);
  if (!service || service.ownerId !== ownerId) throw new Error("NOT_OWNER");
  request.status = status;
  request.updatedAt = new Date().toISOString();
  console.log("[Store] updated request", requestId, "status=", status);
  return request;
}

export function confirmServiceDelivery(
  requestId: string,
  requesterId: string
): ServiceRequestRecord {
  const request = serviceRequestsMap.get(requestId);
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.requesterId !== requesterId) throw new Error("NOT_REQUESTER");
  if (request.status !== "accepted") throw new Error("NOT_ACCEPTED");
  request.status = "completed";
  request.updatedAt = new Date().toISOString();
  console.log("[Store] confirmed delivery for request", requestId);
  return request;
}

export function setRequestConversation(requestId: string, conversationId: string): void {
  const request = serviceRequestsMap.get(requestId);
  if (request) {
    request.conversationId = conversationId;
    console.log("[Store] set conversation", conversationId, "for request", requestId);
  }
}

export function getProviderIncomingRequests(ownerId: string): ServiceRequestRecord[] {
  const result: ServiceRequestRecord[] = [];
  for (const r of serviceRequestsMap.values()) {
    const service = servicesMap.get(r.serviceId);
    if (service && service.ownerId === ownerId) {
      result.push(r);
    }
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  console.log("[Store] getProviderIncomingRequests", ownerId, "count=", result.length);
  return result;
}

export function getRequestByConversation(conversationId: string): ServiceRequestRecord | undefined {
  for (const r of serviceRequestsMap.values()) {
    if (r.conversationId === conversationId) return r;
  }
  return undefined;
}

export function createReview(
  serviceId: string,
  requestId: string,
  reviewerId: string,
  rating: number,
  comment: string
): ReviewRecord {
  const id = generateId();
  const record: ReviewRecord = {
    id,
    serviceId,
    requestId,
    reviewerId,
    rating: Math.min(5, Math.max(1, rating)),
    comment,
    createdAt: new Date().toISOString(),
  };
  reviewsMap.set(id, record);
  let byService = reviewsByService.get(serviceId);
  if (!byService) { byService = []; reviewsByService.set(serviceId, byService); }
  byService.unshift(id);
  console.log("[Store] created review", id, "for service", serviceId, "rating=", rating);
  return record;
}

export function getServiceReviews(serviceId: string): ReviewRecord[] {
  const ids = reviewsByService.get(serviceId) ?? [];
  const result: ReviewRecord[] = [];
  for (const rid of ids) {
    const r = reviewsMap.get(rid);
    if (r) result.push(r);
  }
  return result;
}

export function getServiceAverageRating(serviceId: string): { average: number; count: number } {
  const reviews = getServiceReviews(serviceId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

function seedServices(): void {
  const systemUserId = "system";
  const seedData: Array<Omit<ServiceListingRecord, "id" | "ownerId" | "createdAt" | "updatedAt">> = [
    {
      title: "Corporate Governance Audit",
      titleAr: "تدقيق حوكمة الشركات",
      description: "Comprehensive governance audit including board effectiveness, compliance framework review, and risk assessment with actionable recommendations.",
      descriptionAr: "تدقيق شامل للحوكمة يشمل فعالية مجلس الإدارة ومراجعة إطار الامتثال وتقييم المخاطر مع توصيات قابلة للتنفيذ.",
      category: "Governance",
      categoryAr: "حوكمة",
      price: "SAR 5,000",
      priceAr: "٥٬٠٠٠ ر.س",
      delivery: "2-3 weeks",
      deliveryAr: "٢-٣ أسابيع",
      features: [
        { en: "Board effectiveness assessment", ar: "تقييم فعالية مجلس الإدارة" },
        { en: "Compliance framework review", ar: "مراجعة إطار الامتثال" },
        { en: "Risk assessment report", ar: "تقرير تقييم المخاطر" },
        { en: "Actionable recommendations", ar: "توصيات قابلة للتنفيذ" },
      ],
    },
    {
      title: "Business Strategy Consulting",
      titleAr: "استشارات استراتيجية الأعمال",
      description: "Strategic planning session with market analysis, competitive positioning, and growth roadmap for your business.",
      descriptionAr: "جلسة تخطيط استراتيجي مع تحليل السوق والوضع التنافسي وخارطة طريق النمو لأعمالك.",
      category: "Consulting",
      categoryAr: "استشارات",
      price: "SAR 3,500",
      priceAr: "٣٬٥٠٠ ر.س",
      delivery: "1-2 weeks",
      deliveryAr: "١-٢ أسابيع",
      features: [
        { en: "Market analysis report", ar: "تقرير تحليل السوق" },
        { en: "Competitive landscape review", ar: "مراجعة المشهد التنافسي" },
        { en: "Growth strategy roadmap", ar: "خارطة طريق استراتيجية النمو" },
      ],
    },
    {
      title: "Cybersecurity Assessment",
      titleAr: "تقييم الأمن السيبراني",
      description: "Full security assessment including vulnerability scanning, penetration testing, and security policy recommendations.",
      descriptionAr: "تقييم أمني شامل يشمل فحص الثغرات واختبار الاختراق وتوصيات سياسة الأمان.",
      category: "Cybersecurity",
      categoryAr: "أمن سيبراني",
      price: "SAR 8,000",
      priceAr: "٨٬٠٠٠ ر.س",
      delivery: "3-4 weeks",
      deliveryAr: "٣-٤ أسابيع",
      features: [
        { en: "Vulnerability scanning", ar: "فحص الثغرات" },
        { en: "Penetration testing", ar: "اختبار الاختراق" },
        { en: "Security policy review", ar: "مراجعة سياسة الأمان" },
        { en: "Incident response plan", ar: "خطة الاستجابة للحوادث" },
      ],
    },
    {
      title: "Digital Marketing Strategy",
      titleAr: "استراتيجية التسويق الرقمي",
      description: "Complete digital marketing strategy with SEO, social media planning, and content calendar for the Saudi market.",
      descriptionAr: "استراتيجية تسويق رقمي شاملة مع تحسين محركات البحث وتخطيط وسائل التواصل الاجتماعي وتقويم المحتوى للسوق السعودي.",
      category: "Marketing",
      categoryAr: "تسويق",
      price: "SAR 4,500",
      priceAr: "٤٬٥٠٠ ر.س",
      delivery: "1-2 weeks",
      deliveryAr: "١-٢ أسابيع",
      features: [
        { en: "SEO audit & strategy", ar: "تدقيق واستراتيجية تحسين محركات البحث" },
        { en: "Social media plan", ar: "خطة وسائل التواصل الاجتماعي" },
        { en: "Content calendar", ar: "تقويم المحتوى" },
      ],
    },
  ];

  for (const data of seedData) {
    createServiceListing(systemUserId, data);
  }
  console.log("[Store] seeded", seedData.length, "service listings");
}

seedServices();

// ── Notifications ──

export type NotificationType = "like" | "comment" | "message" | "service_request";

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
}

const notificationsMap = new Map<string, NotificationRecord>();
const userNotifications = new Map<string, string[]>();

export function createNotification(
  userId: string,
  type: NotificationType,
  actorId: string,
  referenceId: string
): NotificationRecord {
  if (userId === actorId) return null as unknown as NotificationRecord;

  const id = generateId();
  const record: NotificationRecord = {
    id,
    userId,
    type,
    actorId,
    referenceId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notificationsMap.set(id, record);

  let list = userNotifications.get(userId);
  if (!list) {
    list = [];
    userNotifications.set(userId, list);
  }
  list.unshift(id);
  console.log("[Store] created notification", id, "type=", type, "for user", userId);
  return record;
}

export function getUserNotifications(
  userId: string,
  cursor: number,
  limit: number,
  filter?: NotificationType | "unread"
): { notifications: NotificationRecord[]; nextCursor: number | null } {
  const allIds = userNotifications.get(userId) ?? [];
  let filtered: string[];

  if (filter === "unread") {
    filtered = allIds.filter((nid) => {
      const n = notificationsMap.get(nid);
      return n && !n.read;
    });
  } else if (filter) {
    filtered = allIds.filter((nid) => {
      const n = notificationsMap.get(nid);
      return n && n.type === filter;
    });
  } else {
    filtered = allIds;
  }

  const start = cursor;
  const end = Math.min(start + limit, filtered.length);
  const result: NotificationRecord[] = [];
  for (let i = start; i < end; i++) {
    const n = notificationsMap.get(filtered[i]);
    if (n) result.push(n);
  }
  const nextCursor = end < filtered.length ? end : null;
  console.log("[Store] getUserNotifications user=", userId, "filter=", filter, "returned=", result.length);
  return { notifications: result, nextCursor };
}

export function markNotificationRead(notificationId: string, userId: string): boolean {
  const n = notificationsMap.get(notificationId);
  if (!n || n.userId !== userId) return false;
  n.read = true;
  console.log("[Store] marked notification read", notificationId);
  return true;
}

export function markAllNotificationsRead(userId: string): number {
  const ids = userNotifications.get(userId) ?? [];
  let count = 0;
  for (const nid of ids) {
    const n = notificationsMap.get(nid);
    if (n && !n.read) {
      n.read = true;
      count++;
    }
  }
  console.log("[Store] markAllNotificationsRead user=", userId, "count=", count);
  return count;
}

export function getUnreadNotificationCount(userId: string): number {
  const ids = userNotifications.get(userId) ?? [];
  let count = 0;
  for (const nid of ids) {
    const n = notificationsMap.get(nid);
    if (n && !n.read) count++;
  }
  return count;
}

// ── Search ──

export interface SearchResults {
  posts: Post[];
  communities: Community[];
  services: ServiceListingRecord[];
  users: Profile[];
}

export function searchAll(query: string, limit: number = 10): SearchResults {
  const q = query.toLowerCase().trim();
  if (!q) return { posts: [], communities: [], services: [], users: [] };

  const matchedPosts: Post[] = [];
  for (const p of posts.values()) {
    if (
      p.content.toLowerCase().includes(q) ||
      p.topic.toLowerCase().includes(q)
    ) {
      matchedPosts.push(p);
      if (matchedPosts.length >= limit) break;
    }
  }

  const matchedCommunities: Community[] = [];
  for (const c of communitiesMap.values()) {
    if (
      c.name.toLowerCase().includes(q) ||
      c.nameAr.includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.descriptionAr.includes(q)
    ) {
      matchedCommunities.push(c);
      if (matchedCommunities.length >= limit) break;
    }
  }

  const matchedServices: ServiceListingRecord[] = [];
  for (const s of servicesMap.values()) {
    if (
      s.title.toLowerCase().includes(q) ||
      s.titleAr.includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.descriptionAr.includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.categoryAr.includes(q)
    ) {
      matchedServices.push(s);
      if (matchedServices.length >= limit) break;
    }
  }

  const matchedUsers: Profile[] = [];
  for (const p of profiles.values()) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q) ||
      p.industry.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q))
    ) {
      matchedUsers.push(p);
      if (matchedUsers.length >= limit) break;
    }
  }

  console.log(
    "[Store] searchAll q=", q,
    "posts=", matchedPosts.length,
    "communities=", matchedCommunities.length,
    "services=", matchedServices.length,
    "users=", matchedUsers.length
  );

  return {
    posts: matchedPosts,
    communities: matchedCommunities,
    services: matchedServices,
    users: matchedUsers,
  };
}
