import type { Project, LogEntry, ChatSession, Note, Settings, AIConfig } from '../types';
import { db } from './schema';
import { DEFAULT_CONFIGS } from './aiConfigs';

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Auth Service',
    description: 'Authentication microservice logs',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-25'),
    color: '#3b82f6',
    icon: '🔐',
  },
  {
    id: 'p2',
    name: 'Payment Gateway',
    description: 'Payment processing pipeline errors',
    createdAt: new Date('2026-06-10'),
    updatedAt: new Date('2026-06-26'),
    color: '#ef4444',
    icon: '💳',
  },
  {
    id: 'p3',
    name: 'Frontend App',
    description: 'React client-side errors',
    createdAt: new Date('2026-06-15'),
    updatedAt: new Date('2026-06-24'),
    color: '#22c55e',
    icon: '⚛️',
  },
];

export const mockLogs: LogEntry[] = [
  {
    id: 'l1',
    projectId: 'p1',
    fileName: 'jwt-verify-error-001.log',
    originalFileName: 'auth_errors_20260601.log',
    content: 'ERROR [2026-06-25T10:30:00Z] JWT verification failed: token expired at "2026-06-25T09:00:00Z". User ID: 42. Issued at: "2026-06-24T09:00:00Z". Key ID: "rsa-key-01".',
    size: 2048,
    createdAt: new Date('2026-06-25T10:30:00'),
    updatedAt: new Date('2026-06-25T10:30:00'),
    status: 'in_progress',
    tags: ['jwt', 'auth', 'expired-token'],
    hash: 'a1b2c3d4',
  },
  {
    id: 'l2',
    projectId: 'p1',
    fileName: 'rate-limit-warning.log',
    originalFileName: 'rate_limit_warn.log',
    content: 'WARN [2026-06-25T11:00:00Z] Rate limit exceeded for IP 192.168.1.100. Endpoint: /api/v1/login. Requests: 101/100 per minute. Resets in 45s.',
    size: 1024,
    createdAt: new Date('2026-06-25T11:00:00'),
    updatedAt: new Date('2026-06-25T11:00:00'),
    status: 'new',
    tags: ['rate-limit', 'security'],
    hash: 'e5f6g7h8',
  },
  {
    id: 'l3',
    projectId: 'p2',
    fileName: 'payment-timeout-error.log',
    originalFileName: 'payment_errors.log',
    content: 'FATAL [2026-06-26T08:15:00Z] Payment processor timeout after 30s. Transaction ID: "tx-9876". Gateway: "stripe". Amount: $299.99. Retry attempt: 3/3.',
    size: 4096,
    createdAt: new Date('2026-06-26T08:15:00'),
    updatedAt: new Date('2026-06-26T09:00:00'),
    status: 'resolved',
    tags: ['payment', 'timeout', 'stripe', 'critical'],
    hash: 'i9j0k1l2',
  },
  {
    id: 'l4',
    projectId: 'p3',
    fileName: 'react-render-error.log',
    originalFileName: 'frontend_errors.log',
    content: 'ERROR [2026-06-24T14:22:00Z] React uncaught error: TypeError: Cannot read properties of undefined (reading \'name\'). Component: UserProfile. Stack: at UserProfile (UserProfile.tsx:45) at renderWithHooks (react-dom.development.js:12345).',
    size: 1536,
    createdAt: new Date('2026-06-24T14:22:00'),
    updatedAt: new Date('2026-06-24T14:22:00'),
    status: 'new',
    tags: ['react', 'typeerror', 'undefined'],
    hash: 'm3n4o5p6',
  },
  {
    id: 'l5',
    projectId: 'p2',
    fileName: 'refund-failed.log',
    originalFileName: 'refund_errors.log',
    content: 'ERROR [2026-06-23T19:45:00Z] Refund failed: transaction already refunded. Refund ID: "rf-4567". Original transaction: "tx-8765". Amount: $149.50.',
    size: 800,
    createdAt: new Date('2026-06-23T19:45:00'),
    updatedAt: new Date('2026-06-23T19:45:00'),
    status: 'archived',
    tags: ['refund', 'duplicate'],
    hash: 'q7r8s9t0',
  },
];

export const mockChats: ChatSession[] = [
  {
    id: 'c1',
    logId: 'l1',
    title: 'JWT token expired analysis',
    messages: [
      { role: 'user', content: 'What caused the JWT verification failure?', timestamp: new Date('2026-06-25T10:31:00') },
      { role: 'assistant', content: 'The token expired 1.5 hours before verification. The token was issued at 2026-06-24T09:00:00Z with a 24-hour expiry, but the verification occurred at 2026-06-25T10:30:00Z — 25.5 hours after issuance. The fix is to either rotate tokens more frequently or increase the TTL.', timestamp: new Date('2026-06-25T10:31:05') },
    ],
    aiAnalysis: [],
    notes: 'Need to check the token issuance policy',
    createdAt: new Date('2026-06-25T10:31:00'),
  },
  {
    id: 'c2',
    logId: 'l3',
    title: 'Stripe timeout root cause',
    messages: [
      { role: 'user', content: 'Why did the payment timeout after 30s?', timestamp: new Date('2026-06-26T08:16:00') },
      { role: 'assistant', content: 'The Stripe API gateway was unresponsive. Three retry attempts were made with exponential backoff, all timing out. Network trace suggests a regional outage in us-east-1.', timestamp: new Date('2026-06-26T08:16:10') },
    ],
    aiAnalysis: [],
    notes: 'Stripe status page confirmed outage from 08:00-09:30 UTC',
    createdAt: new Date('2026-06-26T08:16:00'),
  },
];

export const mockNotes: Note[] = [
  {
    id: 'n1',
    logId: 'l1',
    projectId: 'p1',
    stackTraceHash: 'a1b2c3d4',
    fuzzyHash: 'JWT.token.expired',
    errorSnippet: 'JWT verification failed: token expired',
    cause: 'Истёк срок действия JWT токена',
    solution: 'Implement automatic token refresh using refresh tokens stored in httpOnly cookies',
    tags: ['jwt', 'auth'],
    isGlobal: false,
    createdAt: new Date('2026-06-25T12:00:00'),
    updatedAt: new Date('2026-06-25T12:00:00'),
  },
];

export const mockSettings: Settings = {
  id: 'global',
  theme: 'dark',
  lastProjectId: 'p1',
  sidebarWidth: 320,
  sidebarCollapsed: false,
  notesPanelWidth: 320,
  notesPanelCollapsed: true,
};

export async function seedMockData(): Promise<void> {
  const count = await db.projects.count();
  if (count > 0) return;

  await db.projects.bulkAdd(mockProjects);
  await db.logs.bulkAdd(mockLogs);
  await db.chats.bulkAdd(mockChats);
  await db.notes.bulkAdd(mockNotes);
  await db.settings.put(mockSettings);

  const aiConfigCount = await db.aiConfigs.count();
  if (aiConfigCount === 0) {
    for (const cfg of DEFAULT_CONFIGS) {
      await db.aiConfigs.add({
        ...cfg,
        lastUsedAt: cfg.provider === 'openai' ? new Date() : undefined,
        createdAt: new Date(),
      } as AIConfig);
    }
  }
}
