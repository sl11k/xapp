export type SupportedLanguage = 'ar' | 'en';

export type LocalizedText = Record<SupportedLanguage, string>;

export type PostType = 'text' | 'poll' | 'image' | 'document' | 'insight';

export interface PollOption {
  id: string;
  text: LocalizedText;
  votes: number;
}

export interface FeedPost {
  id: string;
  author: string;
  authorInitial: string;
  role: LocalizedText;
  company: string;
  content: LocalizedText;
  topic: LocalizedText;
  timeAgo: LocalizedText;
  avatarColor: string;
  postType: PostType;
  imageUrl?: string;
  pollOptions?: PollOption[];
  documentTitle?: LocalizedText;
  isTrending?: boolean;
  isVerified?: boolean;
  stats: {
    likes: number;
    comments: number;
    saves: number;
  };
}

export interface PostComment {
  id: string;
  author: string;
  authorInitial: string;
  role: LocalizedText;
  content: LocalizedText;
  timeAgo: LocalizedText;
  avatarColor: string;
  likes: number;
  replies?: PostComment[];
}

export interface Community {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  members: string;
  posts: string;
  privacy: LocalizedText;
  accent: string;
  icon: string;
}

export interface Conversation {
  id: string;
  name: string;
  nameInitial: string;
  title: LocalizedText;
  preview: LocalizedText;
  unread: number;
  time: string;
  avatarColor: string;
  isGroup: boolean;
}

export interface ChatMessage {
  id: string;
  text: LocalizedText;
  sender: 'me' | 'other';
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface ServiceListing {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  provider: string;
  providerInitial: string;
  price: LocalizedText;
  delivery: LocalizedText;
  rating: number;
  reviews: number;
  category: LocalizedText;
  avatarColor: string;
  features?: LocalizedText[];
}

export interface ResourceItem {
  id: string;
  title: LocalizedText;
  type: LocalizedText;
  category: LocalizedText;
  description?: LocalizedText;
  author?: string;
  readTime?: LocalizedText;
}

export interface EventItem {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  date: string;
  day: string;
  month: LocalizedText;
  host: string;
  format: LocalizedText;
  attendees: number;
  accent?: string;
}

export interface GovernanceCategory {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  icon: string;
  count: number;
  accent: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'service' | 'event' | 'group';
  title: LocalizedText;
  body: LocalizedText;
  time: LocalizedText;
  avatarColor: string;
  initial: string;
  read: boolean;
}

export interface ProfileStat {
  label: LocalizedText;
  value: string;
}

export interface TrendingTopic {
  id: string;
  label: LocalizedText;
  posts: string;
  isHot: boolean;
}

export interface ExpertSuggestion {
  id: string;
  name: string;
  nameInitial: string;
  role: LocalizedText;
  reputation: string;
  avatarColor: string;
}

export const feedPosts: FeedPost[] = [
  {
    id: 'feed-1',
    author: 'سارة الأنصاري',
    authorInitial: 'س',
    role: { ar: 'مستشارة نمو الأعمال', en: 'Business growth consultant' },
    company: 'North Axis',
    content: {
      ar: 'ما أفضل طريقة لبناء مجتمع عملاء B2B مبكرًا دون إنفاق كبير على الإعلانات؟ أبحث عن قنوات تحقق تفاعلًا حقيقيًا داخل السوق الخليجي.',
      en: 'What is the best way to build an early B2B customer community without heavy ad spend? Looking for channels that drive real engagement in the Gulf market.',
    },
    topic: { ar: 'استراتيجية النمو', en: 'Growth strategy' },
    timeAgo: { ar: 'منذ 42 د', en: '42m ago' },
    avatarColor: '#1A6B4A',
    postType: 'text',
    isVerified: true,
    stats: { likes: 126, comments: 18, saves: 47 },
  },
  {
    id: 'feed-2',
    author: 'Omar Haddad',
    authorInitial: 'O',
    role: { ar: 'خبير امتثال تقني', en: 'Technology compliance expert' },
    company: 'RegForward',
    content: {
      ar: 'أشارك إطارًا عمليًا لتجهيز الشركات الناشئة لتقييمات الأمن السيبراني ومتطلبات الامتثال قبل التوسع المؤسسي.',
      en: 'Sharing a practical framework to prepare startups for cybersecurity assessments and compliance requirements before enterprise expansion.',
    },
    topic: { ar: 'الحوكمة والامتثال', en: 'Governance & Compliance' },
    timeAgo: { ar: 'منذ ساعتين', en: '2h ago' },
    avatarColor: '#B8892A',
    postType: 'document',
    documentTitle: { ar: 'إطار جاهزية الأمن السيبراني للشركات الناشئة', en: 'Startup Cybersecurity Readiness Framework' },
    isVerified: true,
    stats: { likes: 89, comments: 11, saves: 63 },
  },
  {
    id: 'feed-3',
    author: 'نورة البدر',
    authorInitial: 'ن',
    role: { ar: 'مؤسسة ومديرة تنفيذية', en: 'Founder & CEO' },
    company: 'Qarar Tech',
    content: {
      ar: 'أكبر خطأ ارتكبناه كشركة ناشئة: تأخير بناء فريق المبيعات. المنتج الممتاز لا يكفي بدون قدرة توزيع قوية من اليوم الأول.',
      en: 'Our biggest startup mistake: delaying the sales team build. A great product is not enough without strong distribution from day one.',
    },
    topic: { ar: 'ريادة الأعمال', en: 'Entrepreneurship' },
    timeAgo: { ar: 'منذ 5 ساعات', en: '5h ago' },
    avatarColor: '#2E7AD6',
    postType: 'insight',
    isTrending: true,
    stats: { likes: 234, comments: 42, saves: 91 },
  },
  {
    id: 'feed-4',
    author: 'Tariq Al Salem',
    authorInitial: 'T',
    role: { ar: 'شريك استراتيجيات النمو', en: 'Growth strategy partner' },
    company: 'Ascend Advisory',
    content: {
      ar: 'ما الأهم عند بناء فريق مبيعات B2B في الخليج؟',
      en: 'What matters most when building a B2B sales team in the Gulf?',
    },
    topic: { ar: 'استراتيجية التسعير', en: 'Pricing strategy' },
    timeAgo: { ar: 'منذ 8 ساعات', en: '8h ago' },
    avatarColor: '#C94458',
    postType: 'poll',
    pollOptions: [
      { id: 'p1', text: { ar: 'الخبرة المحلية بالسوق', en: 'Local market expertise' }, votes: 67 },
      { id: 'p2', text: { ar: 'شبكة العلاقات القوية', en: 'Strong network connections' }, votes: 54 },
      { id: 'p3', text: { ar: 'المعرفة التقنية العميقة', en: 'Deep technical knowledge' }, votes: 31 },
      { id: 'p4', text: { ar: 'مهارات التفاوض والإغلاق', en: 'Negotiation and closing skills' }, votes: 26 },
    ],
    stats: { likes: 178, comments: 29, saves: 82 },
  },
  {
    id: 'feed-5',
    author: 'خالد المنصور',
    authorInitial: 'خ',
    role: { ar: 'مدير تطوير الأعمال', en: 'Business Development Director' },
    company: 'Gulf Ventures',
    content: {
      ar: 'الاستثمار في التقنية المالية بمنطقة الخليج يشهد طفرة غير مسبوقة. نصيحتي للمؤسسين: ركزوا على حل مشكلات حقيقية وليس على التقنية فقط.',
      en: 'Fintech investment in the Gulf is booming. My advice to founders: focus on solving real problems, not just the technology.',
    },
    topic: { ar: 'الاستثمار', en: 'Investment' },
    timeAgo: { ar: 'منذ يوم', en: '1d ago' },
    avatarColor: '#7C3AED',
    postType: 'text',
    isTrending: true,
    isVerified: true,
    stats: { likes: 312, comments: 56, saves: 124 },
  },
  {
    id: 'feed-6',
    author: 'ليلى حسن',
    authorInitial: 'ل',
    role: { ar: 'مديرة تسويق رقمي', en: 'Digital Marketing Director' },
    company: 'Bloom Agency',
    content: {
      ar: 'نتائج حملتنا الأخيرة على لينكدإن: معدل تحويل 4.2% من المحتوى العربي مقابل 1.1% من المحتوى الإنجليزي في السوق السعودي. المحتوى المحلي يفوز دائماً.',
      en: 'Our latest LinkedIn campaign results: 4.2% conversion from Arabic content vs 1.1% from English in Saudi market. Local content always wins.',
    },
    topic: { ar: 'التسويق الرقمي', en: 'Digital Marketing' },
    timeAgo: { ar: 'منذ يومين', en: '2d ago' },
    avatarColor: '#059669',
    postType: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop',
    stats: { likes: 445, comments: 67, saves: 198 },
  },
];

export const postComments: Record<string, PostComment[]> = {
  'feed-1': [
    {
      id: 'c1',
      author: 'فهد العتيبي',
      authorInitial: 'ف',
      role: { ar: 'مؤسس شريك', en: 'Co-founder' },
      content: {
        ar: 'جربنا بناء مجتمع على تليجرام وكان فعالاً جداً في البداية. المفتاح هو تقديم قيمة حقيقية قبل طلب أي شيء.',
        en: 'We tried building a community on Telegram and it was very effective early on. The key is delivering real value before asking for anything.',
      },
      timeAgo: { ar: 'منذ 30 د', en: '30m ago' },
      avatarColor: '#3B82F6',
      likes: 24,
      replies: [
        {
          id: 'c1r1',
          author: 'سارة الأنصاري',
          authorInitial: 'س',
          role: { ar: 'مستشارة نمو الأعمال', en: 'Business growth consultant' },
          content: {
            ar: 'شكراً فهد! هل واجهتم تحديات في إدارة المحتوى مع نمو المجموعة؟',
            en: 'Thanks Fahd! Did you face challenges managing content as the group grew?',
          },
          timeAgo: { ar: 'منذ 20 د', en: '20m ago' },
          avatarColor: '#1B6B4A',
          likes: 8,
        },
      ],
    },
    {
      id: 'c2',
      author: 'ليلى حسن',
      authorInitial: 'ل',
      role: { ar: 'مديرة تسويق', en: 'Marketing Director' },
      content: {
        ar: 'LinkedIn مازال أقوى قناة B2B في الخليج. المحتوى العربي الأصيل يحقق تفاعلاً أعلى بثلاث مرات من المحتوى الإنجليزي.',
        en: 'LinkedIn is still the strongest B2B channel in the Gulf. Authentic Arabic content gets 3x more engagement than English content.',
      },
      timeAgo: { ar: 'منذ ساعة', en: '1h ago' },
      avatarColor: '#D44B63',
      likes: 31,
    },
    {
      id: 'c3',
      author: 'عمر الحداد',
      authorInitial: 'ع',
      role: { ar: 'خبير امتثال', en: 'Compliance expert' },
      content: {
        ar: 'أنصح بالتركيز على المؤتمرات والفعاليات المحلية. العلاقات الشخصية في السوق الخليجي لا يمكن استبدالها بالقنوات الرقمية فقط.',
        en: 'I recommend focusing on local conferences and events. Personal relationships in the Gulf market cannot be replaced by digital channels alone.',
      },
      timeAgo: { ar: 'منذ ساعتين', en: '2h ago' },
      avatarColor: '#C4942A',
      likes: 19,
    },
  ],
};

export const chatMessages: Record<string, ChatMessage[]> = {
  'msg-1': [
    { id: 'cm1', text: { ar: 'مرحباً لينا، كيف حالك؟', en: 'Hi Lina, how are you?' }, sender: 'me', time: '09:00', status: 'read' },
    { id: 'cm2', text: { ar: 'أهلاً! بخير الحمدلله. عندي تحديث بخصوص المشروع.', en: 'Hi! I\'m good. I have an update on the project.' }, sender: 'other', time: '09:05', status: 'read' },
    { id: 'cm3', text: { ar: 'ممتاز، تفضلي', en: 'Great, go ahead' }, sender: 'me', time: '09:08', status: 'read' },
    { id: 'cm4', text: { ar: 'أرسلت لك نطاق العمل المحدث وجدول التسليم. أرجو مراجعته وإعطائي ملاحظاتك.', en: 'Sent you the updated scope and delivery schedule. Please review and give me your feedback.' }, sender: 'other', time: '09:15', status: 'read' },
    { id: 'cm5', text: { ar: 'سأراجعه اليوم وأرد عليك', en: 'I\'ll review it today and get back to you' }, sender: 'me', time: '09:20', status: 'delivered' },
  ],
};

export const communities: Community[] = [
  {
    id: 'community-1',
    name: { ar: 'مؤسسو الشركات الناشئة', en: 'Startup Founders' },
    description: {
      ar: 'مجتمع للنمو، جمع التمويل، بناء الفرق، وتبادل الخبرات.',
      en: 'A community for growth, fundraising, team building, and sharing experiences.',
    },
    members: '12.8k',
    posts: '340',
    privacy: { ar: 'عام', en: 'Public' },
    accent: '#1B6B4A',
    icon: '🚀',
  },
  {
    id: 'community-2',
    name: { ar: 'خبراء الحوكمة والامتثال', en: 'Governance & Compliance' },
    description: {
      ar: 'نقاشات تنظيمية، قوالب سياسات، وأسئلة متخصصة.',
      en: 'Regulatory discussions, policy templates, and specialist Q&A.',
    },
    members: '4.6k',
    posts: '128',
    privacy: { ar: 'مميز', en: 'Premium' },
    accent: '#C4942A',
    icon: '🛡️',
  },
  {
    id: 'community-3',
    name: { ar: 'قادة التسويق الرقمي', en: 'Digital Marketing Leaders' },
    description: {
      ar: 'استراتيجيات اكتساب العملاء والعلامة التجارية.',
      en: 'Customer acquisition and brand positioning strategies.',
    },
    members: '8.1k',
    posts: '256',
    privacy: { ar: 'خاص', en: 'Private' },
    accent: '#3B82F6',
    icon: '📈',
  },
  {
    id: 'community-4',
    name: { ar: 'بناة SaaS', en: 'SaaS Builders' },
    description: {
      ar: 'تطوير المنتجات، الاشتراكات، ومقاييس النمو.',
      en: 'Product development, subscriptions, and growth metrics.',
    },
    members: '6.3k',
    posts: '189',
    privacy: { ar: 'عام', en: 'Public' },
    accent: '#8B5CF6',
    icon: '⚡',
  },
  {
    id: 'community-5',
    name: { ar: 'مجتمع المستثمرين', en: 'Investors Community' },
    description: {
      ar: 'فرص استثمارية، تقييم الشركات، وشبكات التمويل.',
      en: 'Investment opportunities, valuations, and funding networks.',
    },
    members: '3.2k',
    posts: '94',
    privacy: { ar: 'مميز', en: 'Premium' },
    accent: '#D44B63',
    icon: '💰',
  },
  {
    id: 'community-6',
    name: { ar: 'رواد التجارة الإلكترونية', en: 'Ecommerce Pioneers' },
    description: {
      ar: 'استراتيجيات البيع عبر الإنترنت، اللوجستيات، وتجربة العملاء.',
      en: 'Online selling strategies, logistics, and customer experience.',
    },
    members: '5.7k',
    posts: '215',
    privacy: { ar: 'عام', en: 'Public' },
    accent: '#059669',
    icon: '🛒',
  },
];

export const conversations: Conversation[] = [
  {
    id: 'msg-1',
    name: 'Lina Al Harbi',
    nameInitial: 'L',
    title: { ar: 'مناقشة مشروع استشاري', en: 'Consulting project discussion' },
    preview: {
      ar: 'أرسلت لك نطاق العمل المحدث وجدول التسليم.',
      en: 'Sent you the updated scope and delivery schedule.',
    },
    unread: 3,
    time: '09:20',
    avatarColor: '#1B6B4A',
    isGroup: false,
  },
  {
    id: 'msg-2',
    name: 'Investor Circle',
    nameInitial: 'IC',
    title: { ar: 'مجموعة المستثمرين', en: 'Investor Circle Group' },
    preview: {
      ar: 'جلسة مغلقة غدًا لمراجعة فرص التقنية المالية.',
      en: 'Closed session tomorrow to review fintech opportunities.',
    },
    unread: 0,
    time: 'أمس',
    avatarColor: '#C4942A',
    isGroup: true,
  },
  {
    id: 'msg-3',
    name: 'مها كريم',
    nameInitial: 'م',
    title: { ar: 'استفسار عن خدمة الحوكمة', en: 'Governance service inquiry' },
    preview: {
      ar: 'شكرًا لك، سأرسل التفاصيل الكاملة خلال ساعة.',
      en: 'Thank you, I will send full details within an hour.',
    },
    unread: 1,
    time: '14:35',
    avatarColor: '#D44B63',
    isGroup: false,
  },
  {
    id: 'msg-4',
    name: 'SaaS Builders',
    nameInitial: 'SB',
    title: { ar: 'مجموعة بناة SaaS', en: 'SaaS Builders Group' },
    preview: {
      ar: 'أحدكم جرّب نموذج التسعير المتدرج؟',
      en: 'Has anyone tried tiered pricing models?',
    },
    unread: 0,
    time: '11:00',
    avatarColor: '#8B5CF6',
    isGroup: true,
  },
];

export const services: ServiceListing[] = [
  {
    id: 'service-1',
    title: {
      ar: 'حزمة جاهزية الحوكمة للشركات سريعة النمو',
      en: 'Governance readiness for high-growth companies',
    },
    description: {
      ar: 'تقييم شامل لجاهزية الحوكمة مع خطة عمل مفصلة تشمل السياسات والإجراءات والتدريب اللازم.',
      en: 'Comprehensive governance readiness assessment with a detailed action plan covering policies, procedures, and required training.',
    },
    provider: 'Maha Kareem',
    providerInitial: 'M',
    price: { ar: 'من 4,500 ر.س', en: 'From SAR 4,500' },
    delivery: { ar: '7 أيام', en: '7 days' },
    rating: 4.9,
    reviews: 23,
    category: { ar: 'حوكمة', en: 'Governance' },
    avatarColor: '#1B6B4A',
    features: [
      { ar: 'تقييم الوضع الحالي', en: 'Current state assessment' },
      { ar: 'تحليل الفجوات', en: 'Gap analysis' },
      { ar: 'خطة عمل مفصلة', en: 'Detailed action plan' },
      { ar: 'قوالب سياسات جاهزة', en: 'Ready-made policy templates' },
    ],
  },
  {
    id: 'service-2',
    title: {
      ar: 'تصميم استراتيجية دخول سوق B2B',
      en: 'B2B go-to-market strategy design',
    },
    description: {
      ar: 'استراتيجية متكاملة لدخول السوق تشمل تحليل المنافسين وتحديد شرائح العملاء وقنوات التوزيع.',
      en: 'Complete go-to-market strategy including competitor analysis, customer segmentation, and distribution channels.',
    },
    provider: 'Yousef Nader',
    providerInitial: 'Y',
    price: { ar: 'من 6,200 ر.س', en: 'From SAR 6,200' },
    delivery: { ar: '10 أيام', en: '10 days' },
    rating: 4.8,
    reviews: 15,
    category: { ar: 'استشارات أعمال', en: 'Business consulting' },
    avatarColor: '#C4942A',
    features: [
      { ar: 'تحليل السوق والمنافسين', en: 'Market & competitor analysis' },
      { ar: 'تحديد الشريحة المستهدفة', en: 'Target segment identification' },
      { ar: 'استراتيجية التسعير', en: 'Pricing strategy' },
      { ar: 'خطة إطلاق تنفيذية', en: 'Go-to-market launch plan' },
    ],
  },
  {
    id: 'service-3',
    title: {
      ar: 'تدقيق الامتثال الأمني وتقرير الجاهزية',
      en: 'Security compliance audit & readiness report',
    },
    description: {
      ar: 'تدقيق أمني شامل يغطي متطلبات الامتثال المحلية والدولية مع تقرير مفصل وتوصيات.',
      en: 'Comprehensive security audit covering local and international compliance requirements with detailed report and recommendations.',
    },
    provider: 'Omar Haddad',
    providerInitial: 'O',
    price: { ar: 'من 8,000 ر.س', en: 'From SAR 8,000' },
    delivery: { ar: '14 يوم', en: '14 days' },
    rating: 5.0,
    reviews: 8,
    category: { ar: 'أمن سيبراني', en: 'Cybersecurity' },
    avatarColor: '#3B82F6',
    features: [
      { ar: 'تقييم الثغرات الأمنية', en: 'Vulnerability assessment' },
      { ar: 'مراجعة السياسات الأمنية', en: 'Security policy review' },
      { ar: 'تقرير الامتثال', en: 'Compliance report' },
      { ar: 'توصيات المعالجة', en: 'Remediation recommendations' },
    ],
  },
];

export const resources: ResourceItem[] = [
  {
    id: 'resource-1',
    title: { ar: 'قالب سياسة تعارض المصالح', en: 'Conflict of interest policy template' },
    type: { ar: 'قالب', en: 'Template' },
    category: { ar: 'امتثال', en: 'Compliance' },
    description: { ar: 'قالب شامل لسياسة تعارض المصالح قابل للتخصيص حسب احتياجات المنظمة.', en: 'Comprehensive conflict of interest policy template customizable to organizational needs.' },
    author: 'مها كريم',
    readTime: { ar: '5 دقائق قراءة', en: '5 min read' },
  },
  {
    id: 'resource-2',
    title: { ar: 'دليل بناء المجتمع المهني', en: 'Professional community building guide' },
    type: { ar: 'دليل', en: 'Guide' },
    category: { ar: 'مجتمعات', en: 'Communities' },
    description: { ar: 'دليل عملي خطوة بخطوة لبناء وإدارة مجتمعات مهنية ناجحة.', en: 'Step-by-step practical guide for building and managing successful professional communities.' },
    author: 'نورة البدر',
    readTime: { ar: '12 دقيقة قراءة', en: '12 min read' },
  },
  {
    id: 'resource-3',
    title: { ar: 'إطار إدارة المخاطر التشغيلية', en: 'Operational risk management framework' },
    type: { ar: 'إطار عمل', en: 'Framework' },
    category: { ar: 'حوكمة', en: 'Governance' },
    description: { ar: 'إطار عمل متكامل لتحديد وتقييم وإدارة المخاطر التشغيلية في المنظمات.', en: 'Integrated framework for identifying, assessing, and managing operational risks in organizations.' },
    author: 'Tariq Al Salem',
    readTime: { ar: '8 دقائق قراءة', en: '8 min read' },
  },
  {
    id: 'resource-4',
    title: { ar: 'دراسة حالة: توسع SaaS في الخليج', en: 'Case Study: SaaS Expansion in the Gulf' },
    type: { ar: 'دراسة حالة', en: 'Case Study' },
    category: { ar: 'أعمال', en: 'Business' },
    description: { ar: 'تحليل معمق لرحلة توسع شركة SaaS من السوق المحلي إلى السوق الخليجي.', en: 'In-depth analysis of a SaaS company\'s expansion from local to Gulf market.' },
    author: 'خالد المنصور',
    readTime: { ar: '15 دقيقة قراءة', en: '15 min read' },
  },
  {
    id: 'resource-5',
    title: { ar: 'قائمة مراجعة الامتثال للشركات الناشئة', en: 'Startup Compliance Checklist' },
    type: { ar: 'قائمة مراجعة', en: 'Checklist' },
    category: { ar: 'امتثال', en: 'Compliance' },
    description: { ar: 'قائمة شاملة بمتطلبات الامتثال الأساسية التي تحتاجها كل شركة ناشئة.', en: 'Comprehensive list of essential compliance requirements every startup needs.' },
    author: 'Omar Haddad',
    readTime: { ar: '6 دقائق قراءة', en: '6 min read' },
  },
];

export const events: EventItem[] = [
  {
    id: 'event-1',
    title: { ar: 'ورشة الحوكمة العملية للمؤسسين', en: 'Practical governance workshop for founders' },
    description: { ar: 'ورشة تفاعلية تغطي أساسيات الحوكمة التي يحتاجها كل مؤسس شركة ناشئة.', en: 'Interactive workshop covering governance fundamentals every startup founder needs.' },
    date: '24 Mar',
    day: '24',
    month: { ar: 'مارس', en: 'Mar' },
    host: 'Noura Al Bader',
    format: { ar: 'مباشر عبر الإنترنت', en: 'Live online' },
    attendees: 128,
    accent: '#1B6B4A',
  },
  {
    id: 'event-2',
    title: { ar: 'جلسة التوسع في السوق الخليجي', en: 'GCC market expansion session' },
    description: { ar: 'جلسة حوارية مع خبراء حول استراتيجيات التوسع الناجح في أسواق الخليج.', en: 'Panel discussion with experts on successful expansion strategies in Gulf markets.' },
    date: '29 Mar',
    day: '29',
    month: { ar: 'مارس', en: 'Mar' },
    host: 'Growth Circle',
    format: { ar: 'مجتمع مميز', en: 'Premium community' },
    attendees: 64,
    accent: '#C4942A',
  },
  {
    id: 'event-3',
    title: { ar: 'لقاء المستثمرين الشهري', en: 'Monthly investor meetup' },
    description: { ar: 'لقاء شهري للمستثمرين لاستعراض الفرص الاستثمارية ومناقشة اتجاهات السوق.', en: 'Monthly investor meetup to review investment opportunities and discuss market trends.' },
    date: '5 Apr',
    day: '5',
    month: { ar: 'أبريل', en: 'Apr' },
    host: 'Investor Circle',
    format: { ar: 'حضوري', en: 'In-person' },
    attendees: 45,
    accent: '#D44B63',
  },
  {
    id: 'event-4',
    title: { ar: 'ويبينار: مستقبل التقنية المالية', en: 'Webinar: Future of Fintech' },
    description: { ar: 'نظرة معمقة على مستقبل التقنية المالية في المنطقة والفرص المتاحة.', en: 'Deep dive into the future of fintech in the region and available opportunities.' },
    date: '12 Apr',
    day: '12',
    month: { ar: 'أبريل', en: 'Apr' },
    host: 'خالد المنصور',
    format: { ar: 'مباشر عبر الإنترنت', en: 'Live online' },
    attendees: 89,
    accent: '#8B5CF6',
  },
];

export const governanceCategories: GovernanceCategory[] = [
  {
    id: 'gov-1',
    name: { ar: 'حوكمة الشركات', en: 'Corporate Governance' },
    description: { ar: 'مبادئ وممارسات إدارة الشركات وفق أفضل المعايير', en: 'Corporate management principles and best practices' },
    icon: '🏛️',
    count: 47,
    accent: '#1B6B4A',
  },
  {
    id: 'gov-2',
    name: { ar: 'إدارة المخاطر', en: 'Risk Management' },
    description: { ar: 'أطر عمل تحديد وتقييم والتعامل مع المخاطر المؤسسية', en: 'Frameworks for identifying, assessing, and handling institutional risks' },
    icon: '⚠️',
    count: 32,
    accent: '#C4942A',
  },
  {
    id: 'gov-3',
    name: { ar: 'الامتثال التنظيمي', en: 'Regulatory Compliance' },
    description: { ar: 'متطلبات الامتثال للأنظمة واللوائح المحلية والدولية', en: 'Compliance requirements for local and international regulations' },
    icon: '📋',
    count: 56,
    accent: '#3B82F6',
  },
  {
    id: 'gov-4',
    name: { ar: 'التدقيق الداخلي', en: 'Internal Audit' },
    description: { ar: 'معايير وإجراءات التدقيق الداخلي وضمان الجودة', en: 'Internal audit standards and quality assurance procedures' },
    icon: '🔍',
    count: 28,
    accent: '#8B5CF6',
  },
  {
    id: 'gov-5',
    name: { ar: 'الأمن السيبراني', en: 'Cybersecurity Compliance' },
    description: { ar: 'معايير حماية البيانات والأمن السيبراني والخصوصية', en: 'Data protection, cybersecurity, and privacy standards' },
    icon: '🔒',
    count: 41,
    accent: '#D44B63',
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'like',
    title: { ar: 'إعجاب بمنشورك', en: 'Liked your post' },
    body: { ar: 'أعجب فهد العتيبي بمنشورك عن استراتيجيات النمو', en: 'Fahd Al-Otaibi liked your post about growth strategies' },
    time: { ar: 'منذ 5 دقائق', en: '5m ago' },
    avatarColor: '#3B82F6',
    initial: 'ف',
    read: false,
  },
  {
    id: 'n2',
    type: 'comment',
    title: { ar: 'تعليق جديد', en: 'New comment' },
    body: { ar: 'علقت ليلى حسن على منشورك: "نقطة ممتازة بخصوص المحتوى العربي"', en: 'Layla Hassan commented: "Excellent point about Arabic content"' },
    time: { ar: 'منذ 15 دقيقة', en: '15m ago' },
    avatarColor: '#D44B63',
    initial: 'ل',
    read: false,
  },
  {
    id: 'n3',
    type: 'follow',
    title: { ar: 'متابع جديد', en: 'New follower' },
    body: { ar: 'بدأ خالد المنصور بمتابعتك', en: 'Khaled Al Mansour started following you' },
    time: { ar: 'منذ ساعة', en: '1h ago' },
    avatarColor: '#8B5CF6',
    initial: 'خ',
    read: true,
  },
  {
    id: 'n4',
    type: 'service',
    title: { ar: 'طلب خدمة جديد', en: 'New service request' },
    body: { ar: 'تلقيت طلب خدمة جديد لحزمة جاهزية الحوكمة', en: 'You received a new service request for governance readiness package' },
    time: { ar: 'منذ 3 ساعات', en: '3h ago' },
    avatarColor: '#1B6B4A',
    initial: 'ط',
    read: true,
  },
  {
    id: 'n5',
    type: 'event',
    title: { ar: 'تذكير بفعالية', en: 'Event reminder' },
    body: { ar: 'ورشة الحوكمة العملية للمؤسسين تبدأ غداً', en: 'Practical governance workshop for founders starts tomorrow' },
    time: { ar: 'منذ 5 ساعات', en: '5h ago' },
    avatarColor: '#C4942A',
    initial: '📅',
    read: true,
  },
  {
    id: 'n6',
    type: 'group',
    title: { ar: 'نشاط في المجتمع', en: 'Community activity' },
    body: { ar: 'منشور جديد في مجتمع مؤسسو الشركات الناشئة', en: 'New post in Startup Founders community' },
    time: { ar: 'منذ يوم', en: '1d ago' },
    avatarColor: '#059669',
    initial: '🚀',
    read: true,
  },
];

export const profileStats: ProfileStat[] = [
  { label: { ar: 'السمعة', en: 'Reputation' }, value: '8,240' },
  { label: { ar: 'خدمات', en: 'Services' }, value: '37' },
  { label: { ar: 'موارد', en: 'Resources' }, value: '19' },
  { label: { ar: 'متابعين', en: 'Followers' }, value: '2.4k' },
];

export const trendingTopics: TrendingTopic[] = [
  { id: 't1', label: { ar: 'نمو B2B في الخليج', en: 'GCC B2B Growth' }, posts: '86', isHot: true },
  { id: 't2', label: { ar: 'لوائح الأمن السيبراني', en: 'Cybersecurity Regulations' }, posts: '54', isHot: false },
  { id: 't3', label: { ar: 'استراتيجيات التسعير', en: 'Pricing Strategies' }, posts: '43', isHot: true },
  { id: 't4', label: { ar: 'توظيف القيادات', en: 'Leadership Hiring' }, posts: '32', isHot: false },
];

export const expertSuggestions: ExpertSuggestion[] = [
  {
    id: 'exp-1',
    name: 'مها كريم',
    nameInitial: 'م',
    role: { ar: 'مستشارة حوكمة', en: 'Governance advisor' },
    reputation: '9.8k',
    avatarColor: '#1B6B4A',
  },
  {
    id: 'exp-2',
    name: 'Tariq Al Salem',
    nameInitial: 'T',
    role: { ar: 'شريك نمو', en: 'Growth partner' },
    reputation: '7.4k',
    avatarColor: '#C4942A',
  },
  {
    id: 'exp-3',
    name: 'لينا الحربي',
    nameInitial: 'ل',
    role: { ar: 'مستشارة تشغيل', en: 'Operations consultant' },
    reputation: '6.1k',
    avatarColor: '#3B82F6',
  },
];

export function getLocalizedText(value: LocalizedText, language: SupportedLanguage): string {
  const text = value[language];
  return text.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}
