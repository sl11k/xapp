import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERS: 'bh_users',
  PROFILES: 'bh_profiles',
  SESSIONS: 'bh_sessions',
  POSTS: 'bh_posts',
  COMMENTS: 'bh_comments',
  LIKES: 'bh_likes',
  SAVES: 'bh_saves',
  COMMUNITIES: 'bh_communities',
  COMMUNITY_MEMBERS: 'bh_community_members',
  COMMUNITY_POSTS: 'bh_community_posts',
  CONVERSATIONS: 'bh_conversations',
  MESSAGES: 'bh_messages',
  SERVICES: 'bh_services',
  SERVICE_REQUESTS: 'bh_service_requests',
  NOTIFICATIONS: 'bh_notifications',
  FOLLOWS: 'bh_follows',
  COMMUNITY_CHATS: 'bh_community_chats',
  COMMUNITY_NOTIF_SETTINGS: 'bh_community_notif_settings',
  SEEDED: 'bh_seeded',
};

function generateId(): string {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function hashPassword(password: string): string {
  let hash = 0;
  const salt = 'bh_salt_2024';
  const input = salt + password + salt;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
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

export interface Community {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  privacy: 'public' | 'private' | 'premium';
  icon: string;
  accent: string;
  createdBy: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface ConversationRecord {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  communityId?: string;
  communityName?: string;
  communityIcon?: string;
}

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

export type ServiceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface ServiceRequestRecord {
  id: string;
  serviceId: string;
  requesterId: string;
  message: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'like' | 'comment' | 'message' | 'service_request';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
}

const memCache = new Map<string, unknown>();
let dirtyKeys = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushDirty();
  }, 100);
}

async function flushDirty() {
  if (dirtyKeys.size === 0) return;
  const keys = [...dirtyKeys];
  dirtyKeys = new Set<string>();
  const pairs: [string, string][] = keys
    .filter((k) => memCache.has(k))
    .map((k) => [k, JSON.stringify(memCache.get(k))]);
  if (pairs.length > 0) {
    try {
      await AsyncStorage.multiSet(pairs);
    } catch (err) {
      console.log('[LocalStore] flush error', err);
    }
  }
}

function get<T>(key: string, fallback: T): T {
  if (memCache.has(key)) {
    return memCache.get(key) as T;
  }
  return fallback;
}

function put<T>(key: string, data: T): void {
  memCache.set(key, data);
  dirtyKeys.add(key);
  scheduleFlush();
}

async function seedIfNeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(KEYS.SEEDED);
  if (seeded === 'v2') {
    const allKeys = Object.values(KEYS).filter((k) => k !== KEYS.SEEDED);
    const pairs = await AsyncStorage.multiGet(allKeys);
    for (const [k, v] of pairs) {
      if (v) {
        try {
          memCache.set(k, JSON.parse(v));
        } catch {
          // skip
        }
      }
    }
    for (const k of allKeys) {
      if (!memCache.has(k)) {
        if (k === KEYS.LIKES || k === KEYS.SAVES || k === KEYS.COMMUNITY_MEMBERS || k === KEYS.COMMUNITY_POSTS) {
          memCache.set(k, {});
        } else {
          memCache.set(k, []);
        }
      }
    }
    console.log('[LocalStore] loaded all data into memory');
    return;
  }

  console.log('[LocalStore] seeding initial data...');

  const communities: Community[] = [
    { id: generateId(), name: 'Business Strategy', nameAr: 'استراتيجية الأعمال', description: 'Discuss business strategies, growth plans, and market analysis', descriptionAr: 'ناقش استراتيجيات الأعمال وخطط النمو وتحليل السوق', privacy: 'public', icon: '📊', accent: '#1A6B4A', createdBy: 'system', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Legal & Compliance', nameAr: 'القانون والامتثال', description: 'Stay updated on legal frameworks and compliance requirements', descriptionAr: 'ابقَ على اطلاع بالأطر القانونية ومتطلبات الامتثال', privacy: 'public', icon: '⚖️', accent: '#2E7AD6', createdBy: 'system', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Startup Founders', nameAr: 'مؤسسو الشركات الناشئة', description: 'A community for startup founders to share experiences and get advice', descriptionAr: 'مجتمع لمؤسسي الشركات الناشئة لمشاركة الخبرات والحصول على المشورة', privacy: 'public', icon: '🚀', accent: '#C94458', createdBy: 'system', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Executive Circle', nameAr: 'دائرة القادة التنفيذيين', description: 'Exclusive community for C-level executives and senior leaders', descriptionAr: 'مجتمع حصري للمدراء التنفيذيين والقادة الكبار', privacy: 'premium', icon: '👔', accent: '#B8892A', createdBy: 'system', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Finance & Investment', nameAr: 'المالية والاستثمار', description: 'Discuss financial markets, investment strategies, and economic trends', descriptionAr: 'ناقش الأسواق المالية واستراتيجيات الاستثمار والاتجاهات الاقتصادية', privacy: 'public', icon: '💰', accent: '#16A34A', createdBy: 'system', createdAt: new Date().toISOString() },
    { id: generateId(), name: 'Tech Innovation Hub', nameAr: 'مركز الابتكار التقني', description: 'Explore cutting-edge technology trends and digital transformation', descriptionAr: 'استكشف أحدث اتجاهات التكنولوجيا والتحول الرقمي', privacy: 'private', icon: '💡', accent: '#7C3AED', createdBy: 'system', createdAt: new Date().toISOString() },
  ];

  const services: ServiceListingRecord[] = [
    { id: generateId(), ownerId: 'system', title: 'Corporate Governance Audit', titleAr: 'تدقيق حوكمة الشركات', description: 'Comprehensive governance audit including board effectiveness, compliance framework review, and risk assessment with actionable recommendations.', descriptionAr: 'تدقيق شامل للحوكمة يشمل فعالية مجلس الإدارة ومراجعة إطار الامتثال وتقييم المخاطر مع توصيات قابلة للتنفيذ.', category: 'Governance', categoryAr: 'حوكمة', price: 'SAR 5,000', priceAr: '٥٬٠٠٠ ر.س', delivery: '2-3 weeks', deliveryAr: '٢-٣ أسابيع', features: [{ en: 'Board effectiveness assessment', ar: 'تقييم فعالية مجلس الإدارة' }, { en: 'Compliance framework review', ar: 'مراجعة إطار الامتثال' }, { en: 'Risk assessment report', ar: 'تقرير تقييم المخاطر' }, { en: 'Actionable recommendations', ar: 'توصيات قابلة للتنفيذ' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), ownerId: 'system', title: 'Business Strategy Consulting', titleAr: 'استشارات استراتيجية الأعمال', description: 'Strategic planning session with market analysis, competitive positioning, and growth roadmap for your business.', descriptionAr: 'جلسة تخطيط استراتيجي مع تحليل السوق والوضع التنافسي وخارطة طريق النمو لأعمالك.', category: 'Consulting', categoryAr: 'استشارات', price: 'SAR 3,500', priceAr: '٣٬٥٠٠ ر.س', delivery: '1-2 weeks', deliveryAr: '١-٢ أسابيع', features: [{ en: 'Market analysis report', ar: 'تقرير تحليل السوق' }, { en: 'Competitive landscape review', ar: 'مراجعة المشهد التنافسي' }, { en: 'Growth strategy roadmap', ar: 'خارطة طريق استراتيجية النمو' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), ownerId: 'system', title: 'Cybersecurity Assessment', titleAr: 'تقييم الأمن السيبراني', description: 'Full security assessment including vulnerability scanning, penetration testing, and security policy recommendations.', descriptionAr: 'تقييم أمني شامل يشمل فحص الثغرات واختبار الاختراق وتوصيات سياسة الأمان.', category: 'Cybersecurity', categoryAr: 'أمن سيبراني', price: 'SAR 8,000', priceAr: '٨٬٠٠٠ ر.س', delivery: '3-4 weeks', deliveryAr: '٣-٤ أسابيع', features: [{ en: 'Vulnerability scanning', ar: 'فحص الثغرات' }, { en: 'Penetration testing', ar: 'اختبار الاختراق' }, { en: 'Security policy review', ar: 'مراجعة سياسة الأمان' }, { en: 'Incident response plan', ar: 'خطة الاستجابة للحوادث' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), ownerId: 'system', title: 'Digital Marketing Strategy', titleAr: 'استراتيجية التسويق الرقمي', description: 'Complete digital marketing strategy with SEO, social media planning, and content calendar for the Saudi market.', descriptionAr: 'استراتيجية تسويق رقمي شاملة مع تحسين محركات البحث وتخطيط وسائل التواصل الاجتماعي وتقويم المحتوى للسوق السعودي.', category: 'Marketing', categoryAr: 'تسويق', price: 'SAR 4,500', priceAr: '٤٬٥٠٠ ر.س', delivery: '1-2 weeks', deliveryAr: '١-٢ أسابيع', features: [{ en: 'SEO audit & strategy', ar: 'تدقيق واستراتيجية تحسين محركات البحث' }, { en: 'Social media plan', ar: 'خطة وسائل التواصل الاجتماعي' }, { en: 'Content calendar', ar: 'تقويم المحتوى' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const communityMembers: Record<string, string[]> = {};
  const communityPosts: Record<string, string[]> = {};
  for (const c of communities) {
    communityMembers[c.id] = ['system'];
    communityPosts[c.id] = [];
  }

  memCache.set(KEYS.COMMUNITIES, communities);
  memCache.set(KEYS.COMMUNITY_MEMBERS, communityMembers);
  memCache.set(KEYS.COMMUNITY_POSTS, communityPosts);
  memCache.set(KEYS.SERVICES, services);
  memCache.set(KEYS.SERVICE_REQUESTS, []);
  memCache.set(KEYS.USERS, []);
  memCache.set(KEYS.PROFILES, []);
  memCache.set(KEYS.SESSIONS, []);
  memCache.set(KEYS.POSTS, []);
  memCache.set(KEYS.COMMENTS, []);
  memCache.set(KEYS.LIKES, {} as Record<string, string[]>);
  memCache.set(KEYS.SAVES, {} as Record<string, string[]>);
  memCache.set(KEYS.CONVERSATIONS, []);
  memCache.set(KEYS.MESSAGES, []);
  memCache.set(KEYS.NOTIFICATIONS, []);
  memCache.set(KEYS.FOLLOWS, {} as Record<string, string[]>);
  memCache.set(KEYS.COMMUNITY_CHATS, {} as Record<string, string>);
  memCache.set(KEYS.COMMUNITY_NOTIF_SETTINGS, {} as Record<string, boolean>);

  const pairs: [string, string][] = [];
  for (const [k, v] of memCache.entries()) {
    pairs.push([k, JSON.stringify(v)]);
  }
  await AsyncStorage.multiSet(pairs);
  await AsyncStorage.setItem(KEYS.SEEDED, 'v2');
  console.log('[LocalStore] seeded initial data');
}

let initPromise: Promise<void> | null = null;

export function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = seedIfNeeded();
  }
  return initPromise;
}

export const store = {
  async createUser(email: string, password: string, name: string) {
    await ensureInit();
    const users = get<User[]>(KEYS.USERS, []);
    const normalizedEmail = email.toLowerCase().trim();
    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error('Email already registered');
    }
    const id = generateId();
    const user: User = { id, email: normalizedEmail, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    const profile: Profile = { userId: id, name, role: '', company: '', location: '', bio: '', industry: '', experience: '', skills: [], avatarUrl: null };
    users.push(user);
    const profiles = get<Profile[]>(KEYS.PROFILES, []);
    profiles.push(profile);
    put(KEYS.USERS, users);
    put(KEYS.PROFILES, profiles);
    console.log('[LocalStore] created user', id, normalizedEmail);
    return { user, profile };
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    await ensureInit();
    const users = get<User[]>(KEYS.USERS, []);
    return users.find((u) => u.email === email.toLowerCase().trim());
  },

  async findUserById(id: string): Promise<User | undefined> {
    await ensureInit();
    const users = get<User[]>(KEYS.USERS, []);
    return users.find((u) => u.id === id);
  },

  async getProfile(userId: string): Promise<Profile | undefined> {
    await ensureInit();
    const profiles = get<Profile[]>(KEYS.PROFILES, []);
    return profiles.find((p) => p.userId === userId);
  },

  async updateProfile(userId: string, data: Partial<Omit<Profile, 'userId'>>): Promise<Profile> {
    await ensureInit();
    const profiles = get<Profile[]>(KEYS.PROFILES, []);
    const idx = profiles.findIndex((p) => p.userId === userId);
    if (idx === -1) throw new Error('Profile not found');
    profiles[idx] = { ...profiles[idx], ...data, userId };
    put(KEYS.PROFILES, profiles);
    return profiles[idx];
  },

  /** Ensures a cloud-auth user exists locally so posts/messages keep using the same user id. */
  async upsertUserAndProfile(user: { id: string; email: string }, profile: Profile): Promise<void> {
    await ensureInit();
    const users = get<User[]>(KEYS.USERS, []);
    const normalizedEmail = user.email.toLowerCase().trim();
    const existingIdx = users.findIndex((u) => u.id === user.id);
    const remotePlaceholder = '__supabase_remote__';
    if (existingIdx === -1) {
      users.push({
        id: user.id,
        email: normalizedEmail,
        passwordHash: remotePlaceholder,
        createdAt: new Date().toISOString(),
      });
    } else {
      users[existingIdx] = { ...users[existingIdx], email: normalizedEmail };
    }
    put(KEYS.USERS, users);

    const profiles = get<Profile[]>(KEYS.PROFILES, []);
    const pIdx = profiles.findIndex((p) => p.userId === user.id);
    const merged: Profile = { ...profile, userId: user.id };
    if (pIdx === -1) {
      profiles.push(merged);
    } else {
      profiles[pIdx] = { ...profiles[pIdx], ...merged };
    }
    put(KEYS.PROFILES, profiles);
  },

  async createSession(userId: string): Promise<Session> {
    await ensureInit();
    const sessions = get<Session[]>(KEYS.SESSIONS, []);
    const token = generateId() + '-' + generateId();
    const session: Session = { token, userId, createdAt: new Date().toISOString() };
    sessions.push(session);
    put(KEYS.SESSIONS, sessions);
    return session;
  },

  async getSession(token: string): Promise<Session | undefined> {
    await ensureInit();
    const sessions = get<Session[]>(KEYS.SESSIONS, []);
    return sessions.find((s) => s.token === token);
  },

  async deleteSession(token: string): Promise<void> {
    await ensureInit();
    const sessions = get<Session[]>(KEYS.SESSIONS, []);
    put(KEYS.SESSIONS, sessions.filter((s) => s.token !== token));
  },

  verifyPassword(password: string, storedHash: string): boolean {
    return hashPassword(password) === storedHash;
  },

  async createPost(authorId: string, content: string, topic: string): Promise<Post> {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    const id = generateId();
    const post: Post = { id, authorId, content, topic, createdAt: new Date().toISOString() };
    posts.unshift(post);
    put(KEYS.POSTS, posts);
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    likes[id] = [];
    put(KEYS.LIKES, likes);
    const saves = get<Record<string, string[]>>(KEYS.SAVES, {});
    saves[id] = [];
    put(KEYS.SAVES, saves);
    return post;
  },

  async getPost(id: string): Promise<Post | undefined> {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    return posts.find((p) => p.id === id);
  },

  async listPosts(cursor: number, limit: number) {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    const slice = posts.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < posts.length ? cursor + limit : null;
    return { posts: slice, nextCursor };
  },

  async deletePost(id: string, userId: string): Promise<boolean> {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    const idx = posts.findIndex((p) => p.id === id && p.authorId === userId);
    if (idx === -1) return false;
    posts.splice(idx, 1);
    put(KEYS.POSTS, posts);
    return true;
  },

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    if (!likes[postId]) likes[postId] = [];
    const idx = likes[postId].indexOf(userId);
    let liked: boolean;
    if (idx !== -1) {
      likes[postId].splice(idx, 1);
      liked = false;
    } else {
      likes[postId].push(userId);
      liked = true;
    }
    put(KEYS.LIKES, likes);
    return liked;
  },

  async isLiked(postId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    return (likes[postId] ?? []).includes(userId);
  },

  async getLikeCount(postId: string): Promise<number> {
    await ensureInit();
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    return (likes[postId] ?? []).length;
  },

  async toggleSave(postId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const saves = get<Record<string, string[]>>(KEYS.SAVES, {});
    if (!saves[postId]) saves[postId] = [];
    const idx = saves[postId].indexOf(userId);
    let saved: boolean;
    if (idx !== -1) {
      saves[postId].splice(idx, 1);
      saved = false;
    } else {
      saves[postId].push(userId);
      saved = true;
    }
    put(KEYS.SAVES, saves);
    return saved;
  },

  async isSaved(postId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const saves = get<Record<string, string[]>>(KEYS.SAVES, {});
    return (saves[postId] ?? []).includes(userId);
  },

  async getSaveCount(postId: string): Promise<number> {
    await ensureInit();
    const saves = get<Record<string, string[]>>(KEYS.SAVES, {});
    return (saves[postId] ?? []).length;
  },

  async getUserSavedPosts(userId: string): Promise<Post[]> {
    await ensureInit();
    const saves = get<Record<string, string[]>>(KEYS.SAVES, {});
    const posts = get<Post[]>(KEYS.POSTS, []);
    const savedPostIds = Object.entries(saves)
      .filter(([, users]) => users.includes(userId))
      .map(([postId]) => postId);
    return posts
      .filter((p) => savedPostIds.includes(p.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addComment(postId: string, authorId: string, content: string, parentId: string | null): Promise<Comment> {
    await ensureInit();
    const comments = get<Comment[]>(KEYS.COMMENTS, []);
    const id = generateId();
    const comment: Comment = { id, postId, authorId, content, parentId, createdAt: new Date().toISOString() };
    comments.push(comment);
    put(KEYS.COMMENTS, comments);
    return comment;
  },

  async getPostComments(postId: string): Promise<Comment[]> {
    await ensureInit();
    const comments = get<Comment[]>(KEYS.COMMENTS, []);
    return comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async getCommentCount(postId: string): Promise<number> {
    await ensureInit();
    const comments = get<Comment[]>(KEYS.COMMENTS, []);
    return comments.filter((c) => c.postId === postId).length;
  },

  async listCommunities(filter?: 'public' | 'private' | 'premium'): Promise<Community[]> {
    await ensureInit();
    const communities = get<Community[]>(KEYS.COMMUNITIES, []);
    const filtered = filter ? communities.filter((c) => c.privacy === filter) : communities;
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCommunity(id: string): Promise<Community | undefined> {
    await ensureInit();
    const communities = get<Community[]>(KEYS.COMMUNITIES, []);
    return communities.find((c) => c.id === id);
  },

  async joinCommunity(communityId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    if (!members[communityId]) members[communityId] = [];
    if (members[communityId].includes(userId)) return false;
    members[communityId].push(userId);
    put(KEYS.COMMUNITY_MEMBERS, members);
    return true;
  },

  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    if (!members[communityId]) return false;
    const idx = members[communityId].indexOf(userId);
    if (idx === -1) return false;
    members[communityId].splice(idx, 1);
    put(KEYS.COMMUNITY_MEMBERS, members);
    return true;
  },

  async isCommunityMember(communityId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    return (members[communityId] ?? []).includes(userId);
  },

  async getCommunityMemberIds(communityId: string): Promise<string[]> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    return members[communityId] ?? [];
  },

  async getCommunityMemberCount(communityId: string): Promise<number> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    return (members[communityId] ?? []).length;
  },

  async getCommunityPostIds(communityId: string, cursor: number, limit: number) {
    await ensureInit();
    const communityPosts = get<Record<string, string[]>>(KEYS.COMMUNITY_POSTS, {});
    const postIds = communityPosts[communityId] ?? [];
    const slice = postIds.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < postIds.length ? cursor + limit : null;
    return { postIds: slice, nextCursor };
  },

  async getCommunityPostCount(communityId: string): Promise<number> {
    await ensureInit();
    const communityPosts = get<Record<string, string[]>>(KEYS.COMMUNITY_POSTS, {});
    return (communityPosts[communityId] ?? []).length;
  },

  async addPostToCommunity(communityId: string, postId: string): Promise<void> {
    await ensureInit();
    const communityPosts = get<Record<string, string[]>>(KEYS.COMMUNITY_POSTS, {});
    if (!communityPosts[communityId]) communityPosts[communityId] = [];
    communityPosts[communityId].unshift(postId);
    put(KEYS.COMMUNITY_POSTS, communityPosts);
  },

  async getUserConversations(userId: string): Promise<ConversationRecord[]> {
    await ensureInit();
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    return convs
      .filter((c) => c.participants.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getConversation(id: string): Promise<ConversationRecord | undefined> {
    await ensureInit();
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    return convs.find((c) => c.id === id);
  },

  async getOrCreateConversation(userA: string, userB: string): Promise<ConversationRecord> {
    await ensureInit();
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    const existing = convs.find(
      (c) => c.participants.length === 2 && c.participants.includes(userA) && c.participants.includes(userB)
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    const conv: ConversationRecord = { id: generateId(), participants: [userA, userB], createdAt: now, updatedAt: now };
    convs.push(conv);
    put(KEYS.CONVERSATIONS, convs);
    return conv;
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    await ensureInit();
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    const conv = convs.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');
    if (!conv.participants.includes(senderId)) throw new Error('Not a participant');

    const messages = get<Message[]>(KEYS.MESSAGES, []);
    const now = new Date().toISOString();
    const msg: Message = { id: generateId(), conversationId, senderId, content, createdAt: now, readBy: [senderId] };
    messages.push(msg);
    conv.updatedAt = now;
    put(KEYS.MESSAGES, messages);
    put(KEYS.CONVERSATIONS, convs);
    return msg;
  },

  async getConversationMessages(conversationId: string, cursor: number, limit: number) {
    await ensureInit();
    const messages = get<Message[]>(KEYS.MESSAGES, []);
    const convMsgs = messages.filter((m) => m.conversationId === conversationId);
    const total = convMsgs.length;
    const end = total - cursor;
    const start = Math.max(end - limit, 0);
    const slice = convMsgs.slice(start, end);
    const nextCursor = start > 0 ? total - start : null;
    return { messages: slice, nextCursor };
  },

  async markConversationRead(conversationId: string, userId: string): Promise<number> {
    await ensureInit();
    const messages = get<Message[]>(KEYS.MESSAGES, []);
    let marked = 0;
    for (const m of messages) {
      if (m.conversationId === conversationId && !m.readBy.includes(userId)) {
        m.readBy.push(userId);
        marked++;
      }
    }
    if (marked > 0) put(KEYS.MESSAGES, messages);
    return marked;
  },

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    await ensureInit();
    const messages = get<Message[]>(KEYS.MESSAGES, []);
    return messages.filter((m) => m.conversationId === conversationId && !m.readBy.includes(userId)).length;
  },

  async getLastMessage(conversationId: string): Promise<Message | undefined> {
    await ensureInit();
    const messages = get<Message[]>(KEYS.MESSAGES, []);
    const convMsgs = messages.filter((m) => m.conversationId === conversationId);
    return convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : undefined;
  },

  async listServiceListings(cursor: number, limit: number, category?: string) {
    await ensureInit();
    let services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    if (category) {
      services = services.filter((s) => s.category === category || s.categoryAr === category);
    }
    const slice = services.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < services.length ? cursor + limit : null;
    return { services: slice, nextCursor };
  },

  async getServiceListing(id: string): Promise<ServiceListingRecord | undefined> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    return services.find((s) => s.id === id);
  },

  async createServiceListing(ownerId: string, data: Omit<ServiceListingRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<ServiceListingRecord> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const now = new Date().toISOString();
    const record: ServiceListingRecord = { id: generateId(), ownerId, ...data, createdAt: now, updatedAt: now };
    services.unshift(record);
    put(KEYS.SERVICES, services);
    return record;
  },

  async updateServiceListing(id: string, ownerId: string, data: Partial<Omit<ServiceListingRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>): Promise<ServiceListingRecord> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const idx = services.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Service not found');
    if (services[idx].ownerId !== ownerId) throw new Error('Not the owner');
    services[idx] = { ...services[idx], ...data, updatedAt: new Date().toISOString() };
    put(KEYS.SERVICES, services);
    return services[idx];
  },

  async deleteServiceListing(id: string, ownerId: string): Promise<boolean> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const idx = services.findIndex((s) => s.id === id && s.ownerId === ownerId);
    if (idx === -1) return false;
    services.splice(idx, 1);
    put(KEYS.SERVICES, services);
    return true;
  },

  async getUserServiceListings(ownerId: string): Promise<ServiceListingRecord[]> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    return services.filter((s) => s.ownerId === ownerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createServiceRequest(serviceId: string, requesterId: string, message: string): Promise<ServiceRequestRecord> {
    await ensureInit();
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const service = services.find((s) => s.id === serviceId);
    if (!service) throw new Error('Service not found');
    if (service.ownerId === requesterId) throw new Error('Cannot request own service');
    const requests = get<ServiceRequestRecord[]>(KEYS.SERVICE_REQUESTS, []);
    const now = new Date().toISOString();
    const record: ServiceRequestRecord = { id: generateId(), serviceId, requesterId, message, status: 'pending', createdAt: now, updatedAt: now };
    requests.unshift(record);
    put(KEYS.SERVICE_REQUESTS, requests);
    return record;
  },

  async getUserServiceRequests(userId: string): Promise<ServiceRequestRecord[]> {
    await ensureInit();
    const requests = get<ServiceRequestRecord[]>(KEYS.SERVICE_REQUESTS, []);
    return requests.filter((r) => r.requesterId === userId);
  },

  async getServiceRequests(serviceId: string): Promise<ServiceRequestRecord[]> {
    await ensureInit();
    const requests = get<ServiceRequestRecord[]>(KEYS.SERVICE_REQUESTS, []);
    return requests.filter((r) => r.serviceId === serviceId);
  },

  async updateServiceRequestStatus(requestId: string, ownerId: string, status: ServiceRequestStatus): Promise<ServiceRequestRecord> {
    await ensureInit();
    const requests = get<ServiceRequestRecord[]>(KEYS.SERVICE_REQUESTS, []);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const service = services.find((s) => s.id === req.serviceId);
    if (!service || service.ownerId !== ownerId) throw new Error('Not the owner');
    req.status = status;
    req.updatedAt = new Date().toISOString();
    put(KEYS.SERVICE_REQUESTS, requests);
    return req;
  },

  async createNotification(userId: string, type: NotificationType, actorId: string, referenceId: string): Promise<NotificationRecord | null> {
    await ensureInit();
    if (userId === actorId) return null;
    const notifications = get<NotificationRecord[]>(KEYS.NOTIFICATIONS, []);
    const record: NotificationRecord = { id: generateId(), userId, type, actorId, referenceId, read: false, createdAt: new Date().toISOString() };
    notifications.unshift(record);
    put(KEYS.NOTIFICATIONS, notifications);
    return record;
  },

  async getUserNotifications(userId: string, cursor: number, limit: number, filter?: string) {
    await ensureInit();
    const notifications = get<NotificationRecord[]>(KEYS.NOTIFICATIONS, []);
    let filtered = notifications.filter((n) => n.userId === userId);
    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter) {
      filtered = filtered.filter((n) => n.type === filter);
    }
    const slice = filtered.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < filtered.length ? cursor + limit : null;
    return { notifications: slice, nextCursor };
  },

  async markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const notifications = get<NotificationRecord[]>(KEYS.NOTIFICATIONS, []);
    const n = notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!n) return false;
    n.read = true;
    put(KEYS.NOTIFICATIONS, notifications);
    return true;
  },

  async markAllNotificationsRead(userId: string): Promise<number> {
    await ensureInit();
    const notifications = get<NotificationRecord[]>(KEYS.NOTIFICATIONS, []);
    let count = 0;
    for (const n of notifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count++;
      }
    }
    if (count > 0) put(KEYS.NOTIFICATIONS, notifications);
    return count;
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    await ensureInit();
    const notifications = get<NotificationRecord[]>(KEYS.NOTIFICATIONS, []);
    return notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  async listAllUsers(): Promise<Profile[]> {
    await ensureInit();
    const profiles = get<Profile[]>(KEYS.PROFILES, []);
    return profiles;
  },

  async getUserStats(userId: string) {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    const comments = get<Comment[]>(KEYS.COMMENTS, []);
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const serviceRequests = get<ServiceRequestRecord[]>(KEYS.SERVICE_REQUESTS, []);
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});

    const userPosts = posts.filter((p) => p.authorId === userId);
    const userComments = comments.filter((c) => c.authorId === userId);
    const userServices = services.filter((s) => s.ownerId === userId);
    const completedRequests = serviceRequests.filter((r) => r.status === 'completed' && userServices.some((s) => s.id === r.serviceId));

    let receivedLikes = 0;
    for (const post of userPosts) {
      receivedLikes += (likes[post.id] ?? []).length;
    }

    let communitiesJoined = 0;
    for (const memberList of Object.values(members)) {
      if (memberList.includes(userId)) communitiesJoined++;
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const postsThisMonth = userPosts.filter((p) => new Date(p.createdAt) >= thisMonth).length;

    const repStats = await store.getReputationStats(userId);
    const reputationLevel = repStats.level;
    const reputationProgress = repStats.progress;

    return {
      postsCount: userPosts.length,
      commentsCount: userComments.length,
      receivedLikes,
      servicesCount: userServices.length,
      completedServices: completedRequests.length,
      communitiesJoined,
      postsThisMonth,
      reputationLevel,
      reputationProgress: Math.min(100, reputationProgress),
    };
  },

  async getTotalUnreadMessages(userId: string): Promise<number> {
    await ensureInit();
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    const messages = get<Message[]>(KEYS.MESSAGES, []);
    let total = 0;
    for (const conv of convs) {
      if (!conv.participants.includes(userId)) continue;
      total += messages.filter((m) => m.conversationId === conv.id && !m.readBy.includes(userId)).length;
    }
    return total;
  },

  async followUser(followerId: string, targetId: string): Promise<boolean> {
    await ensureInit();
    if (followerId === targetId) return false;
    const follows = get<Record<string, string[]>>(KEYS.FOLLOWS, {});
    if (!follows[followerId]) follows[followerId] = [];
    if (follows[followerId].includes(targetId)) return false;
    follows[followerId].push(targetId);
    put(KEYS.FOLLOWS, follows);
    return true;
  },

  async unfollowUser(followerId: string, targetId: string): Promise<boolean> {
    await ensureInit();
    const follows = get<Record<string, string[]>>(KEYS.FOLLOWS, {});
    if (!follows[followerId]) return false;
    const idx = follows[followerId].indexOf(targetId);
    if (idx === -1) return false;
    follows[followerId].splice(idx, 1);
    put(KEYS.FOLLOWS, follows);
    return true;
  },

  async isFollowing(followerId: string, targetId: string): Promise<boolean> {
    await ensureInit();
    const follows = get<Record<string, string[]>>(KEYS.FOLLOWS, {});
    return (follows[followerId] ?? []).includes(targetId);
  },

  async getFollowersCount(userId: string): Promise<number> {
    await ensureInit();
    const follows = get<Record<string, string[]>>(KEYS.FOLLOWS, {});
    let count = 0;
    for (const list of Object.values(follows)) {
      if (list.includes(userId)) count++;
    }
    return count;
  },

  async getFollowingCount(userId: string): Promise<number> {
    await ensureInit();
    const follows = get<Record<string, string[]>>(KEYS.FOLLOWS, {});
    return (follows[userId] ?? []).length;
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    return posts.filter((p) => p.authorId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUserLikedPostIds(userId: string): Promise<string[]> {
    await ensureInit();
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});
    const postIds: string[] = [];
    for (const [postId, users] of Object.entries(likes)) {
      if (users.includes(userId)) postIds.push(postId);
    }
    return postIds;
  },

  async getUserCommunityIds(userId: string): Promise<string[]> {
    await ensureInit();
    const members = get<Record<string, string[]>>(KEYS.COMMUNITY_MEMBERS, {});
    const ids: string[] = [];
    for (const [communityId, memberList] of Object.entries(members)) {
      if (memberList.includes(userId)) ids.push(communityId);
    }
    return ids;
  },

  async getOrCreateCommunityConversation(communityId: string, communityName: string, communityIcon: string, userId: string): Promise<ConversationRecord> {
    await ensureInit();
    const chatMap = get<Record<string, string>>(KEYS.COMMUNITY_CHATS, {});
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);

    if (chatMap[communityId]) {
      const existing = convs.find((c) => c.id === chatMap[communityId]);
      if (existing) {
        if (!existing.participants.includes(userId)) {
          existing.participants.push(userId);
          put(KEYS.CONVERSATIONS, convs);
        }
        return existing;
      }
    }

    const now = new Date().toISOString();
    const conv: ConversationRecord = {
      id: 'comm_' + communityId,
      participants: [userId],
      createdAt: now,
      updatedAt: now,
      communityId,
      communityName,
      communityIcon,
    };
    convs.push(conv);
    chatMap[communityId] = conv.id;
    put(KEYS.CONVERSATIONS, convs);
    put(KEYS.COMMUNITY_CHATS, chatMap);
    return conv;
  },

  async removeCommunityConversationParticipant(communityId: string, userId: string): Promise<void> {
    await ensureInit();
    const chatMap = get<Record<string, string>>(KEYS.COMMUNITY_CHATS, {});
    const convId = chatMap[communityId];
    if (!convId) return;
    const convs = get<ConversationRecord[]>(KEYS.CONVERSATIONS, []);
    const conv = convs.find((c) => c.id === convId);
    if (!conv) return;
    conv.participants = conv.participants.filter((p) => p !== userId);
    put(KEYS.CONVERSATIONS, convs);
  },

  async setCommunityNotifications(communityId: string, userId: string, enabled: boolean): Promise<void> {
    await ensureInit();
    const settings = get<Record<string, boolean>>(KEYS.COMMUNITY_NOTIF_SETTINGS, {});
    settings[`${communityId}_${userId}`] = enabled;
    put(KEYS.COMMUNITY_NOTIF_SETTINGS, settings);
  },

  async getCommunityNotifications(communityId: string, userId: string): Promise<boolean> {
    await ensureInit();
    const settings = get<Record<string, boolean>>(KEYS.COMMUNITY_NOTIF_SETTINGS, {});
    return settings[`${communityId}_${userId}`] ?? true;
  },

  async getReputationStats(userId: string) {
    await ensureInit();
    const posts = get<Post[]>(KEYS.POSTS, []);
    const likes = get<Record<string, string[]>>(KEYS.LIKES, {});

    const userPosts = posts.filter((p) => p.authorId === userId);
    const totalPostCount = userPosts.length;

    let totalLikesGiven = 0;
    for (const users of Object.values(likes)) {
      if (users.includes(userId)) totalLikesGiven++;
    }

    let postsWithMinLikes = 0;
    for (const post of userPosts) {
      if ((likes[post.id] ?? []).length >= 5) postsWithMinLikes++;
    }

    let level = 0;
    let progress = 0;

    const l1Posts = 25;
    const l1Likes = 50;
    const l1QualityPosts = 5;

    if (totalPostCount >= l1Posts && totalLikesGiven >= l1Likes && postsWithMinLikes >= l1QualityPosts) {
      level = 1;
      const l2Posts = 50;
      const l2Likes = 100;
      const extraPosts = totalPostCount - l1Posts;
      const extraLikes = totalLikesGiven - l1Likes;
      const postProgress = Math.min(1, extraPosts / l2Posts);
      const likeProgress = Math.min(1, extraLikes / l2Likes);
      progress = Math.round(((postProgress + likeProgress) / 2) * 100);

      if (extraPosts >= l2Posts && extraLikes >= l2Likes) {
        level = 2;
        const l3Posts = 100;
        const l3Likes = 200;
        const e2Posts = extraPosts - l2Posts;
        const e2Likes = extraLikes - l2Likes;
        const p2 = Math.min(1, e2Posts / l3Posts);
        const l2p = Math.min(1, e2Likes / l3Likes);
        progress = Math.round(((p2 + l2p) / 2) * 100);

        if (e2Posts >= l3Posts && e2Likes >= l3Likes) {
          level = 3;
          progress = 100;
        }
      }
    } else {
      const postP = Math.min(1, totalPostCount / l1Posts);
      const likeP = Math.min(1, totalLikesGiven / l1Likes);
      const qualP = Math.min(1, postsWithMinLikes / l1QualityPosts);
      progress = Math.round(((postP + likeP + qualP) / 3) * 100);
    }

    return {
      level,
      progress: Math.min(100, progress),
      totalPosts: totalPostCount,
      totalLikesGiven,
      postsWithMinLikes,
    };
  },

  async searchAll(query: string, limit: number = 10) {
    await ensureInit();
    const q = query.toLowerCase().trim();
    if (!q) return { posts: [] as Post[], communities: [] as Community[], services: [] as ServiceListingRecord[], users: [] as Profile[] };

    const posts = get<Post[]>(KEYS.POSTS, []);
    const communities = get<Community[]>(KEYS.COMMUNITIES, []);
    const services = get<ServiceListingRecord[]>(KEYS.SERVICES, []);
    const profiles = get<Profile[]>(KEYS.PROFILES, []);

    const matchedPosts = posts.filter((p) => p.content.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q)).slice(0, limit);
    const matchedCommunities = communities.filter((c) => c.name.toLowerCase().includes(q) || c.nameAr.includes(q) || c.description.toLowerCase().includes(q) || c.descriptionAr.includes(q)).slice(0, limit);
    const matchedServices = services.filter((s) => s.title.toLowerCase().includes(q) || s.titleAr.includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, limit);
    const matchedUsers = profiles.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q)).slice(0, limit);

    return { posts: matchedPosts, communities: matchedCommunities, services: matchedServices, users: matchedUsers };
  },
};
