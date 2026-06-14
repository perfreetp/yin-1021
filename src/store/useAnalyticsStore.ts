import { create } from 'zustand';
import type { TemplateStats, MessageStats, PropertyConversationHistory, DailyMessageTrend, ResponseEfficiency } from '../types/analytics';
import { mockTemplateStats, mockMessageStats, mockDailyTrend, mockResponseEfficiency, mockPropertyHistory } from '../mock/analytics';
import { mockTemplates } from '../mock/templates';
import { mockConversations } from '../mock/conversations';

interface AnalyticsState {
  templateStats: TemplateStats[];
  messageStats: MessageStats;
  dailyTrend: DailyMessageTrend[];
  responseEfficiency: ResponseEfficiency[];
  propertyHistory: PropertyConversationHistory[];
  dateRange: { start: Date; end: Date } | null;
  propertyFilter: string | null;
  setDateRange: (range: { start: Date; end: Date } | null) => void;
  setPropertyFilter: (propertyId: string | null) => void;
  refreshTemplateStats: () => void;
  getTopRewrittenTemplates: (limit?: number) => TemplateStats[];
  getMostUsedTemplates: (limit?: number) => TemplateStats[];
  getAutoReplyRate: () => number;
  getAverageResponseTime: () => number;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  templateStats: mockTemplateStats,
  messageStats: mockMessageStats,
  dailyTrend: mockDailyTrend,
  responseEfficiency: mockResponseEfficiency,
  propertyHistory: mockPropertyHistory,
  dateRange: null,
  propertyFilter: null,
  
  setDateRange: (range) => set({ dateRange: range }),
  
  setPropertyFilter: (propertyId) => set({ propertyFilter: propertyId }),
  
  refreshTemplateStats: () => {
    const stats = mockTemplates.map(t => ({
      templateId: t.id,
      templateName: t.name,
      category: t.category,
      usageCount: t.usageCount,
      rewriteCount: t.rewriteCount,
      rewriteRate: t.usageCount > 0 ? Math.round((t.rewriteCount / t.usageCount) * 100) / 100 : 0,
    })).sort((a, b) => b.rewriteRate - a.rewriteRate);
    set({ templateStats: stats });
  },
  
  getTopRewrittenTemplates: (limit = 5) => {
    return get().templateStats
      .sort((a, b) => b.rewriteRate - a.rewriteRate)
      .slice(0, limit);
  },
  
  getMostUsedTemplates: (limit = 5) => {
    return get().templateStats
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  },
  
  getAutoReplyRate: () => {
    const { autoReplied, manualReplied } = get().messageStats;
    const total = autoReplied + manualReplied;
    return total > 0 ? Math.round((autoReplied / total) * 100) / 100 : 0;
  },
  
  getAverageResponseTime: () => {
    const efficiency = get().responseEfficiency;
    if (efficiency.length === 0) return 0;
    const sum = efficiency.reduce((acc, e) => acc + e.avgResponseTime, 0);
    return Math.round(sum / efficiency.length);
  },
}));
