import type { TemplateStats, MessageStats, PropertyConversationHistory, DailyMessageTrend, ResponseEfficiency } from '../types/analytics';
import { mockTemplates } from './templates';

export const mockTemplateStats: TemplateStats[] = mockTemplates.map(t => ({
  templateId: t.id,
  templateName: t.name,
  category: t.category,
  usageCount: t.usageCount,
  rewriteCount: t.rewriteCount,
  rewriteRate: t.usageCount > 0 ? Math.round((t.rewriteCount / t.usageCount) * 100) / 100 : 0,
})).sort((a, b) => b.rewriteRate - a.rewriteRate);

export const mockMessageStats: MessageStats = {
  totalSent: 892,
  sending: 12,
  delivered: 64,
  read: 812,
  failed: 4,
  autoReplied: 724,
  manualReplied: 168,
};

const now = new Date();
export const mockDailyTrend: DailyMessageTrend[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
  const auto = Math.floor(Math.random() * 15) + 20;
  const manual = Math.floor(Math.random() * 8) + 3;
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    count: auto + manual,
    auto,
    manual,
  };
});

export const mockResponseEfficiency: ResponseEfficiency[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    avgResponseTime: Math.floor(Math.random() * 180) + 60,
  };
});

export const mockPropertyHistory: PropertyConversationHistory[] = [
  {
    propertyId: 'p1',
    propertyName: '外滩景观豪华公寓',
    date: now,
    conversationCount: 45,
    messageCount: 189,
    autoReplyRate: 0.78,
  },
  {
    propertyId: 'p2',
    propertyName: '西湖边精致小院',
    date: now,
    conversationCount: 28,
    messageCount: 112,
    autoReplyRate: 0.82,
  },
  {
    propertyId: 'p3',
    propertyName: '国贸高层商务套房',
    date: now,
    conversationCount: 18,
    messageCount: 68,
    autoReplyRate: 0.75,
  },
  {
    propertyId: 'p4',
    propertyName: '鼓浪屿文艺民宿',
    date: now,
    conversationCount: 8,
    messageCount: 32,
    autoReplyRate: 0.88,
  },
  {
    propertyId: 'p5',
    propertyName: '三亚海景别墅',
    date: now,
    conversationCount: 35,
    messageCount: 156,
    autoReplyRate: 0.71,
  },
];
