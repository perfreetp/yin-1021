import { create } from 'zustand';
import type {
  AutoReplyRule,
  RuleMatchResult,
  RuleConditions,
  RuleHitEvent,
  RuleHitEventType,
  ObservationMetric,
  RulePerformance,
} from '../types/rule';
import type { Conversation, StayStage } from '../types/conversation';
import { mockRules } from '../mock/rules';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { isNightTime } from '../utils/date';

interface RuleStoreState {
  rules: AutoReplyRule[];
  lastMatchResult: RuleMatchResult | null;
  ruleHitEvents: RuleHitEvent[];
  setRules: (rules: AutoReplyRule[]) => void;
  addRule: (rule: Omit<AutoReplyRule, 'id' | 'createdAt' | 'updatedAt' | 'hitCount'>) => string;
  updateRule: (id: string, updates: Partial<AutoReplyRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  incrementHitCount: (id: string) => void;
  getRuleById: (id: string) => AutoReplyRule | undefined;
  matchRule: (conversation: Conversation) => RuleMatchResult;
  setLastMatchResult: (result: RuleMatchResult | null) => void;
  recordRuleHitEvent: (event: Omit<RuleHitEvent, 'id' | 'timestamp'>) => void;
  getHitEventsByConversationId: (conversationId: string) => RuleHitEvent[];
  getHitEventsByGuestId: (guestId: string) => RuleHitEvent[];
  recordRuleHit: (ruleId: string, responseTime?: number) => void;
  recordRuleDelivery: (ruleId: string) => void;
  recordRuleRead: (ruleId: string) => void;
  recordRuleFollowUp: (ruleId: string) => void;
  getRulePerformanceStats: (ruleIds: string[], days?: number) => {
    ruleId: string;
    ruleName: string;
    hitCount: number;
    deliveryCount: number;
    readCount: number;
    followUpCount: number;
    totalResponseTime: number;
    deliveryRate: number;
    readRate: number;
    followUpRate: number;
    avgResponseTime: number;
  }[];
  getRuleComparison: (ruleIds: string[], days?: number) => {
    ruleId: string;
    ruleName: string;
    hitCount: number;
    deliveryRate: number;
    readRate: number;
    followUpRate: number;
    avgResponseTime: number;
  }[];
  clearHitEvents: () => void;
}

const STORAGE_KEY = 'auto_reply_rules';
const EVENTS_STORAGE_KEY = 'rule_hit_events';

function checkCondition(ruleConditions: RuleConditions, conversation: Conversation, night: boolean): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (ruleConditions.isNightTime !== null) {
    if (ruleConditions.isNightTime !== night) {
      return { pass: false, reasons: [`深夜条件不匹配：规则要求${ruleConditions.isNightTime ? '深夜' : '非深夜'}，当前${night ? '深夜' : '非深夜'}`] };
    }
    reasons.push(night ? '✓ 匹配深夜条件' : '✓ 匹配非深夜条件');
  }

  if (ruleConditions.channels.length > 0) {
    if (!ruleConditions.channels.includes(conversation.channel)) {
      return { pass: false, reasons: [`渠道不匹配：规则要求${ruleConditions.channels.join('/')}，当前${conversation.channel}`] };
    }
    reasons.push(`✓ 匹配渠道: ${conversation.channel}`);
  }

  if (ruleConditions.propertyIds.length > 0) {
    if (!ruleConditions.propertyIds.includes(conversation.propertyId)) {
      return { pass: false, reasons: [`房源不匹配：规则要求${ruleConditions.propertyIds.join('/')}，当前${conversation.propertyId}`] };
    }
    reasons.push(`✓ 匹配房源ID: ${conversation.propertyId}`);
  }

  if (ruleConditions.stayStages.length > 0) {
    if (!ruleConditions.stayStages.includes(conversation.stayStage)) {
      return { pass: false, reasons: [`入住阶段不匹配：规则要求${ruleConditions.stayStages.join('/')}，当前${conversation.stayStage}`] };
    }
    reasons.push(`✓ 匹配入住阶段: ${conversation.stayStage}`);
  }

  if (ruleConditions.hasUnreadMessages !== null) {
    const hasUnread = conversation.unreadCount > 0;
    if (ruleConditions.hasUnreadMessages !== hasUnread) {
      return { pass: false, reasons: [`未读消息条件不匹配：规则要求${ruleConditions.hasUnreadMessages ? '有未读' : '无未读'}`] };
    }
    reasons.push(hasUnread ? '✓ 有未读消息' : '✓ 无未读消息');
  }

  return { pass: true, reasons };
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useRuleStore = create<RuleStoreState>((set, get) => ({
  rules: loadFromLocalStorage<AutoReplyRule[]>(STORAGE_KEY, mockRules),
  lastMatchResult: null,
  ruleHitEvents: loadFromLocalStorage<RuleHitEvent[]>(EVENTS_STORAGE_KEY, []),

  setRules: (rules) => {
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  addRule: (rule) => {
    const now = new Date();
    const newId = `rule_${Date.now()}`;
    const newRule: AutoReplyRule = {
      ...rule,
      id: newId,
      createdAt: now,
      updatedAt: now,
      hitCount: 0,
      observationTarget: rule.observationTarget || {
        metrics: ['deliveryRate', 'readRate'],
        comparisonRuleIds: [],
      },
      performance: rule.performance || [],
    };
    const rules = [...get().rules, newRule];
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
    return newId;
  },

  updateRule: (id, updates) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  deleteRule: (id) => {
    const rules = get().rules.filter(r => r.id !== id);
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  toggleRule: (id) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date() } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  incrementHitCount: (id) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, hitCount: r.hitCount + 1 } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  getRuleById: (id) => get().rules.find(r => r.id === id),

  matchRule: (conversation) => {
    const rules = get().rules.filter(r => r.enabled);
    const night = isNightTime();

    const allChecks = rules.map(rule => {
      const check = checkCondition(rule.conditions, conversation, night);
      return { rule, check };
    });

    const matchedRules = allChecks
      .filter(item => item.check.pass)
      .sort((a, b) => b.rule.priority - a.rule.priority);

    const competingRules = matchedRules.slice(0, 3).map(item => ({
      ruleId: item.rule.id,
      ruleName: item.rule.name,
      priority: item.rule.priority,
      hitExplanation: item.rule.hitExplanation,
    }));

    if (matchedRules.length === 0) {
      const failedRules = allChecks
        .filter(item => !item.check.pass)
        .slice(0, 3);

      const reasons: string[] = [];
      failedRules.forEach(item => {
        reasons.push(`【${item.rule.name}】${item.check.reasons[0]}`);
      });

      const result: RuleMatchResult = {
        matched: false,
        reasons: reasons.length > 0 ? reasons : ['没有匹配的规则'],
        competingRules: [],
      };

      get().recordRuleHitEvent({
        conversationId: conversation.id,
        guestId: conversation.guestId,
        eventType: 'no_match',
        reasons: result.reasons,
        channel: conversation.channel,
        propertyId: conversation.propertyId,
        stayStage: conversation.stayStage,
      });

      set({ lastMatchResult: result });
      return result;
    }

    const winner = matchedRules[0];
    get().incrementHitCount(winner.rule.id);

    const result: RuleMatchResult = {
      matched: true,
      ruleId: winner.rule.id,
      ruleName: winner.rule.name,
      templateId: winner.rule.action.templateId,
      priority: winner.rule.priority,
      hitExplanation: winner.rule.hitExplanation,
      reasons: winner.check.reasons,
      competingRules: competingRules.filter(r => r.ruleId !== winner.rule.id),
    };

    get().recordRuleHitEvent({
      conversationId: conversation.id,
      guestId: conversation.guestId,
      eventType: 'matched',
      ruleId: winner.rule.id,
      ruleName: winner.rule.name,
      priority: winner.rule.priority,
      hitExplanation: winner.rule.hitExplanation,
      reasons: winner.check.reasons,
      competingRules: result.competingRules,
      channel: conversation.channel,
      propertyId: conversation.propertyId,
      stayStage: conversation.stayStage,
    });

    matchedRules.slice(1).forEach(item => {
      get().recordRuleHitEvent({
        conversationId: conversation.id,
        guestId: conversation.guestId,
        eventType: 'skipped_priority',
        ruleId: item.rule.id,
        ruleName: item.rule.name,
        priority: item.rule.priority,
        hitExplanation: item.rule.hitExplanation,
        reasons: [`优先级低于已匹配规则「${winner.rule.name}」(P${winner.rule.priority})`],
        channel: conversation.channel,
        propertyId: conversation.propertyId,
        stayStage: conversation.stayStage,
      });
    });

    set({ lastMatchResult: result });
    return result;
  },

  setLastMatchResult: (result) => set({ lastMatchResult: result }),

  recordRuleHitEvent: (event) => {
    const newEvent: RuleHitEvent = {
      ...event,
      id: generateEventId(),
      timestamp: new Date(),
    };
    const ruleHitEvents = [...get().ruleHitEvents, newEvent];
    
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const filteredEvents = ruleHitEvents.filter(e => new Date(e.timestamp).getTime() > cutoffTime);
    
    set({ ruleHitEvents: filteredEvents });
    saveToLocalStorage(EVENTS_STORAGE_KEY, filteredEvents);
  },

  getHitEventsByConversationId: (conversationId) => {
    return get().ruleHitEvents
      .filter(e => e.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getHitEventsByGuestId: (guestId) => {
    return get().ruleHitEvents
      .filter(e => e.guestId === guestId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  recordRuleHit: (ruleId, responseTime) => {
    const rules = get().rules.map(r => {
      if (r.id !== ruleId) return r;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let todayPerf = r.performance.find(p => 
        new Date(p.periodStart).getTime() === today.getTime()
      );

      if (!todayPerf) {
        todayPerf = {
          ruleId,
          periodStart: today,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          hitCount: 0,
          deliveryCount: 0,
          readCount: 0,
          followUpCount: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      todayPerf.hitCount += 1;
      if (responseTime !== undefined) {
        todayPerf.totalResponseTime = (todayPerf.totalResponseTime || 0) + responseTime;
        todayPerf.avgResponseTime = Math.round(todayPerf.totalResponseTime / todayPerf.hitCount);
      }

      const otherPerf = r.performance.filter(p => 
        new Date(p.periodStart).getTime() !== today.getTime()
      );
      return { ...r, performance: [...otherPerf, todayPerf] };
    });
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  recordRuleDelivery: (ruleId) => {
    const rules = get().rules.map(r => {
      if (r.id !== ruleId) return r;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let todayPerf = r.performance.find(p => 
        new Date(p.periodStart).getTime() === today.getTime()
      );

      if (!todayPerf) {
        todayPerf = {
          ruleId,
          periodStart: today,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          hitCount: 0,
          deliveryCount: 0,
          readCount: 0,
          followUpCount: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      todayPerf.deliveryCount += 1;

      const otherPerf = r.performance.filter(p => 
        new Date(p.periodStart).getTime() !== today.getTime()
      );
      return { ...r, performance: [...otherPerf, todayPerf] };
    });
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  recordRuleRead: (ruleId) => {
    const rules = get().rules.map(r => {
      if (r.id !== ruleId) return r;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let todayPerf = r.performance.find(p => 
        new Date(p.periodStart).getTime() === today.getTime()
      );

      if (!todayPerf) {
        todayPerf = {
          ruleId,
          periodStart: today,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          hitCount: 0,
          deliveryCount: 0,
          readCount: 0,
          followUpCount: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      todayPerf.readCount += 1;

      const otherPerf = r.performance.filter(p => 
        new Date(p.periodStart).getTime() !== today.getTime()
      );
      return { ...r, performance: [...otherPerf, todayPerf] };
    });
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  recordRuleFollowUp: (ruleId) => {
    const rules = get().rules.map(r => {
      if (r.id !== ruleId) return r;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let todayPerf = r.performance.find(p => 
        new Date(p.periodStart).getTime() === today.getTime()
      );

      if (!todayPerf) {
        todayPerf = {
          ruleId,
          periodStart: today,
          periodEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          hitCount: 0,
          deliveryCount: 0,
          readCount: 0,
          followUpCount: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      todayPerf.followUpCount += 1;

      const otherPerf = r.performance.filter(p => 
        new Date(p.periodStart).getTime() !== today.getTime()
      );
      return { ...r, performance: [...otherPerf, todayPerf] };
    });
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  getRulePerformanceStats: (ruleIds, days = 7) => {
    return ruleIds.map(ruleId => {
      const rule = get().getRuleById(ruleId);
      if (!rule) {
        return {
          ruleId,
          ruleName: '未知规则',
          hitCount: 0,
          deliveryCount: 0,
          readCount: 0,
          followUpCount: 0,
          totalResponseTime: 0,
          deliveryRate: 0,
          readRate: 0,
          followUpRate: 0,
          avgResponseTime: 0,
        };
      }

      const now = new Date();
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const relevantPerf = rule.performance.filter(p => 
        new Date(p.periodStart) >= cutoffDate
      );

      const agg = {
        hitCount: 0,
        deliveryCount: 0,
        readCount: 0,
        followUpCount: 0,
        totalResponseTime: 0,
      };

      relevantPerf.forEach(p => {
        agg.hitCount += p.hitCount;
        agg.deliveryCount += p.deliveryCount;
        agg.readCount += p.readCount;
        agg.followUpCount += p.followUpCount;
        agg.totalResponseTime += p.totalResponseTime || 0;
      });

      return {
        ruleId,
        ruleName: rule.name,
        hitCount: agg.hitCount,
        deliveryCount: agg.deliveryCount,
        readCount: agg.readCount,
        followUpCount: agg.followUpCount,
        totalResponseTime: agg.totalResponseTime,
        deliveryRate: agg.hitCount > 0 ? agg.deliveryCount / agg.hitCount : 0,
        readRate: agg.hitCount > 0 ? agg.readCount / agg.hitCount : 0,
        followUpRate: agg.hitCount > 0 ? agg.followUpCount / agg.hitCount : 0,
        avgResponseTime: agg.hitCount > 0 ? Math.round(agg.totalResponseTime / agg.hitCount) : 0,
      };
    });
  },

  getRuleComparison: (ruleIds, days = 7) => {
    const stats = get().getRulePerformanceStats(ruleIds, days);
    return stats.map(s => ({
      ruleId: s.ruleId,
      ruleName: s.ruleName,
      hitCount: s.hitCount,
      deliveryRate: s.deliveryRate,
      readRate: s.readRate,
      followUpRate: s.followUpRate,
      avgResponseTime: s.avgResponseTime,
    }));
  },

  clearHitEvents: () => {
    set({ ruleHitEvents: [] });
    saveToLocalStorage(EVENTS_STORAGE_KEY, []);
  },
}));
