import { create } from 'zustand';
import type { TemplateStats, MessageStats, PropertyConversationHistory, DailyMessageTrend, ResponseEfficiency } from '../types/analytics';
import { useTemplateStore } from './useTemplateStore';
import { useConversationStore } from './useConversationStore';
import { usePropertyStore } from './usePropertyStore';
import { formatDate, isWithinDays } from '../utils/date';

interface AnalyticsState {
  dateRange: { start: Date; end: Date } | null;
  propertyFilter: string | null;
  setDateRange: (range: { start: Date; end: Date } | null) => void;
  setPropertyFilter: (propertyId: string | null) => void;
  getTemplateStats: () => TemplateStats[];
  getMessageStats: () => MessageStats;
  getDailyTrend: (days?: number) => DailyMessageTrend[];
  getResponseEfficiency: (days?: number) => ResponseEfficiency[];
  getPropertyHistory: (days?: number) => PropertyConversationHistory[];
  getTopRewrittenTemplates: (limit?: number) => TemplateStats[];
  getMostUsedTemplates: (limit?: number) => TemplateStats[];
  getAutoReplyRate: () => number;
  getAverageResponseTime: () => number;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  dateRange: null,
  propertyFilter: null,
  
  setDateRange: (range) => set({ dateRange: range }),
  
  setPropertyFilter: (propertyId) => set({ propertyFilter: propertyId }),
  
  getTemplateStats: () => {
    const templates = useTemplateStore.getState().templates;
    return templates.map(t => ({
      templateId: t.id,
      templateName: t.name,
      category: t.category,
      usageCount: t.usageCount,
      rewriteCount: t.rewriteCount,
      rewriteRate: t.usageCount > 0 ? Math.round((t.rewriteCount / t.usageCount) * 100) / 100 : 0,
    })).sort((a, b) => b.rewriteRate - a.rewriteRate);
  },
  
  getMessageStats: () => {
    const conversations = useConversationStore.getState().conversations;
    const { propertyFilter } = get();
    
    const filteredConversations = propertyFilter 
      ? conversations.filter(c => c.propertyId === propertyFilter)
      : conversations;
    
    let totalSent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;
    let autoReplied = 0;
    let manualReplied = 0;
    
    filteredConversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.senderType === 'guest') return;
        totalSent++;
        if (msg.status === 'delivered' || msg.status === 'read') delivered++;
        if (msg.status === 'read') read++;
        if (msg.status === 'failed') failed++;
        if (msg.senderType === 'auto') autoReplied++;
        if (msg.senderType === 'manual') manualReplied++;
      });
    });
    
    return { totalSent, delivered, read, failed, autoReplied, manualReplied };
  },
  
  getDailyTrend: (days = 30) => {
    const conversations = useConversationStore.getState().conversations;
    const { propertyFilter } = get();
    
    const filteredConversations = propertyFilter 
      ? conversations.filter(c => c.propertyId === propertyFilter)
      : conversations;
    
    const trendMap = new Map<string, { auto: number; manual: number; count: number }>();
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      trendMap.set(dateStr, { auto: 0, manual: 0, count: 0 });
    }
    
    filteredConversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.senderType === 'guest') return;
        const msgDate = new Date(msg.sentAt);
        if (!isWithinDays(msgDate, days)) return;
        const dateStr = formatDate(msgDate);
        const existing = trendMap.get(dateStr);
        if (existing) {
          existing.count++;
          if (msg.senderType === 'auto') existing.auto++;
          if (msg.senderType === 'manual') existing.manual++;
        }
      });
    });
    
    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  },
  
  getResponseEfficiency: (days = 30) => {
    const conversations = useConversationStore.getState().conversations;
    const { propertyFilter } = get();
    
    const filteredConversations = propertyFilter 
      ? conversations.filter(c => c.propertyId === propertyFilter)
      : conversations;
    
    const efficiencyMap = new Map<string, { totalTime: number; count: number }>();
    
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      efficiencyMap.set(dateStr, { totalTime: 0, count: 0 });
    }
    
    filteredConversations.forEach(conv => {
      const guestMessages = conv.messages.filter(m => m.senderType === 'guest');
      const replyMessages = conv.messages.filter(m => m.senderType !== 'guest');
      
      guestMessages.forEach(guestMsg => {
        const nextReply = replyMessages.find(r => 
          new Date(r.sentAt).getTime() > new Date(guestMsg.sentAt).getTime()
        );
        if (nextReply) {
          const responseTime = Math.round(
            (new Date(nextReply.sentAt).getTime() - new Date(guestMsg.sentAt).getTime()) / 1000
          );
          const dateStr = formatDate(new Date(guestMsg.sentAt));
          const existing = efficiencyMap.get(dateStr);
          if (existing) {
            existing.totalTime += responseTime;
            existing.count++;
          }
        }
      });
    });
    
    return Array.from(efficiencyMap.entries()).map(([date, data]) => ({
      date,
      avgResponseTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
    }));
  },
  
  getPropertyHistory: (days = 30) => {
    const properties = usePropertyStore.getState().properties;
    const conversations = useConversationStore.getState().conversations;
    
    return properties.map(property => {
      const propertyConversations = conversations.filter(c => c.propertyId === property.id);
      
      let messageCount = 0;
      let autoCount = 0;
      
      propertyConversations.forEach(conv => {
        conv.messages.forEach(msg => {
          if (msg.senderType === 'guest') return;
          if (!isWithinDays(new Date(msg.sentAt), days)) return;
          messageCount++;
          if (msg.senderType === 'auto') autoCount++;
        });
      });
      
      const conversationCount = propertyConversations.filter(c => 
        isWithinDays(new Date(c.lastMessageAt), days)
      ).length;
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        date: new Date(),
        conversationCount,
        messageCount,
        autoReplyRate: messageCount > 0 ? Math.round((autoCount / messageCount) * 100) / 100 : 0,
      };
    });
  },
  
  getTopRewrittenTemplates: (limit = 5) => {
    return get().getTemplateStats()
      .sort((a, b) => b.rewriteRate - a.rewriteRate)
      .slice(0, limit);
  },
  
  getMostUsedTemplates: (limit = 5) => {
    return get().getTemplateStats()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  },
  
  getAutoReplyRate: () => {
    const stats = get().getMessageStats();
    const total = stats.autoReplied + stats.manualReplied;
    return total > 0 ? Math.round((stats.autoReplied / total) * 100) / 100 : 0;
  },
  
  getAverageResponseTime: () => {
    const efficiency = get().getResponseEfficiency(7);
    const validData = efficiency.filter(e => e.avgResponseTime > 0);
    if (validData.length === 0) return 0;
    const sum = validData.reduce((acc, e) => acc + e.avgResponseTime, 0);
    return Math.round(sum / validData.length);
  },
}));
