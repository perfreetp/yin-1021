import { create } from 'zustand';
import type { Conversation, Message, SpecialNeed, SpecialNeedType, StayStage } from '../types/conversation';
import { mockConversations } from '../mock/conversations';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { renderTemplate } from '../utils/template';
import { useTemplateStore } from './useTemplateStore';
import { usePropertyStore } from './usePropertyStore';
import { useRuleStore } from './useRuleStore';
import { shouldSendMessage, recordSentMessage, clearGuestDeduplication, getDeduplicationStatus } from '../utils/deduplication';

export type ScenarioType = 'cross_channel' | 'delayed_followup' | 'manual_switch' | 'dedup_test';

export interface SmartAutoReplyResult {
  success: boolean;
  reason?: string;
  ruleId?: string;
  ruleName?: string;
  templateId?: string;
  priority?: number;
  hitExplanation?: string;
  matchReasons?: string[];
  competingRules?: { ruleId: string; ruleName: string; priority: number; hitExplanation: string }[];
}

interface ConversationState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  lastAutoReplyResult: SmartAutoReplyResult | null;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, isRewritten?: boolean, templateId?: string) => void;
  sendAutoReply: (conversationId: string, templateId: string, data: Record<string, any>) => void;
  smartAutoReply: (conversationId: string) => SmartAutoReplyResult;
  receiveMessage: (conversationId: string, content: string, simulateGuest?: boolean) => void;
  simulateNewInquiry: (channel: string, propertyId: string, guestName: string, content: string, stayStage: StayStage, existingGuestId?: string) => string;
  simulateFollowUpMessage: (conversationId: string, content: string) => void;
  simulateGuestReply: (conversationId: string, content: string) => void;
  toggleManualOverride: (conversationId: string) => void;
  restoreAutoReply: (conversationId: string) => void;
  addSpecialNeed: (conversationId: string, type: SpecialNeedType, description: string) => void;
  removeSpecialNeed: (conversationId: string, type: SpecialNeedType) => void;
  markAsRead: (conversationId: string) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  simulateMessageStatusFlow: (conversationId: string) => void;
  getConversationById: (id: string) => Conversation | undefined;
  getConversationsByProperty: (propertyId: string) => Conversation[];
  getConversationsByStayStage: (stayStage: StayStage) => Conversation[];
  getConversationsByGuestId: (guestId: string) => Conversation[];
  getUnreadCount: () => number;
  setLastAutoReplyResult: (result: SmartAutoReplyResult | null) => void;
  simulateScenario: (scenarioType: ScenarioType, options?: { guestName?: string; baseChannel?: string; propertyId?: string }) => string[];
  triggerStatusRefresh: () => void;
}

const STORAGE_KEY = 'conversations_data';

function generateMessageId() {
  return `m${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: loadFromLocalStorage<Conversation[]>(STORAGE_KEY, mockConversations),
  selectedConversationId: null,
  lastAutoReplyResult: null,
  
  setConversations: (conversations) => {
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),

  setLastAutoReplyResult: (result) => set({ lastAutoReplyResult: result }),
  
  sendMessage: (conversationId, content, isRewritten = false, templateId?) => {
    const now = new Date();
    const newMessage: Message = {
      id: generateMessageId(),
      conversationId,
      senderType: 'manual',
      content,
      status: 'sending',
      sentAt: now,
      isRewritten,
      templateId,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
        manualOverride: true,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
    
    if (templateId && isRewritten) {
      useTemplateStore.getState().incrementRewrite(templateId);
    }

    get().simulateMessageStatusFlow(conversationId);
  },
  
  sendAutoReply: (conversationId, templateId, data) => {
    const template = useTemplateStore.getState().getTemplateById(templateId);
    if (!template) return;
    
    const content = renderTemplate(template.content, data);
    const now = new Date();
    const newMessage: Message = {
      id: generateMessageId(),
      conversationId,
      senderType: 'auto',
      content,
      templateId,
      status: 'sending',
      sentAt: now,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
    useTemplateStore.getState().incrementUsage(templateId);

    setTimeout(() => {
      get().simulateMessageStatusFlow(conversationId);
    }, 200);
  },

  simulateMessageStatusFlow: (conversationId) => {
    const conversations = get().conversations;
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    const sendingMessages = conv.messages.filter(
      m => m.status === 'sending' && (m.senderType === 'manual' || m.senderType === 'auto')
    );

    sendingMessages.forEach(msg => {
      setTimeout(() => {
        const random = Math.random();
        const status: Message['status'] = random < 0.05 ? 'failed' : 'delivered';
        get().updateMessageStatus(msg.id, status);

        if (status === 'delivered' && Math.random() < 0.7) {
          setTimeout(() => {
            get().updateMessageStatus(msg.id, 'read');
          }, 1500 + Math.random() * 3000);
        }
      }, 300 + Math.random() * 500);
    });
  },

  updateMessageStatus: (messageId, status) => {
    const conversations = get().conversations.map(c => ({
      ...c,
      messages: c.messages.map(m => {
        if (m.id !== messageId) return m;
        const now = new Date();
        return {
          ...m,
          status,
          deliveredAt: (status === 'delivered' || status === 'read') ? now : m.deliveredAt,
          readAt: status === 'read' ? now : m.readAt,
          failedAt: status === 'failed' ? now : m.failedAt,
        };
      }),
    }));
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },

  smartAutoReply: (conversationId) => {
    const conversation = get().getConversationById(conversationId);
    if (!conversation) {
      const result: SmartAutoReplyResult = { success: false, reason: '会话不存在' };
      set({ lastAutoReplyResult: result });
      return result;
    }

    if (conversation.manualOverride) {
      useRuleStore.getState().recordRuleHitEvent({
        conversationId: conversation.id,
        guestId: conversation.guestId,
        eventType: 'skipped_manual',
        reasons: ['人工接管中，已暂停自动回复'],
      });
      const result: SmartAutoReplyResult = { success: false, reason: '人工接管中，已暂停自动回复。请关闭人工接管开关恢复自动。' };
      set({ lastAutoReplyResult: result });
      return result;
    }

    const dedupKey = `${conversation.id}-${conversation.stayStage}`;
    const dedupStatus = getDeduplicationStatus(conversation.guestId, dedupKey);
    if (!shouldSendMessage(conversation.guestId, dedupKey)) {
      const timeRemaining = dedupStatus.timeRemaining || 0;
      const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      useRuleStore.getState().recordRuleHitEvent({
        conversationId: conversation.id,
        guestId: conversation.guestId,
        eventType: 'skipped_dedup',
        reasons: [`24小时去重拦截：该场景已于${dedupStatus.lastSent?.toLocaleString()}发送过，还剩${hours}小时${minutes}分钟解除`],
        dedupKey,
      });
      const result: SmartAutoReplyResult = { success: false, reason: '24小时内已发送过该类型消息，避免重复打扰' };
      set({ lastAutoReplyResult: result });
      return result;
    }

    const matchResult = useRuleStore.getState().matchRule(conversation);

    if (!matchResult.matched || !matchResult.templateId) {
      const result: SmartAutoReplyResult = {
        success: false,
        reason: '未命中任何规则：' + (matchResult.reasons.join('；') || '请检查规则中心配置'),
        competingRules: matchResult.competingRules,
      };
      set({ lastAutoReplyResult: result });
      return result;
    }

    const template = useTemplateStore.getState().getTemplateById(matchResult.templateId);
    if (!template) {
      const result: SmartAutoReplyResult = {
        success: false,
        reason: `命中规则「${matchResult.ruleName}」，但对应模板不存在`,
        ruleId: matchResult.ruleId,
        ruleName: matchResult.ruleName,
        competingRules: matchResult.competingRules,
      };
      set({ lastAutoReplyResult: result });
      return result;
    }

    const property = usePropertyStore.getState().getPropertyById(conversation.propertyId);
    const data: Record<string, any> = {
      客人姓名: conversation.guest.name,
      房源名称: property?.name || '',
      地址: property?.address || '',
      入住日期: '2024-06-20',
      退房日期: '2024-06-25',
      门锁密码: property?.doorLock.password || '',
      门锁设置说明: property?.doorLock.instructions || '',
      最近地铁站: property?.transportInfo.nearestSubway || '',
      wifi密码: property?.wifiPassword || '',
      可预订状态: '目前可预订',
      接机服务链接: property?.transportInfo.airportTransfer || '暂无接机服务',
      停车信息: property?.transportInfo.parkingInfo || '小区内有收费停车位',
      钥匙归还说明: '请放在门口密码盒内，密码0000',
      保洁时间: now => new Date().toLocaleString(),
      特殊清洁要求: '无特殊要求',
      折扣力度: '9折',
      延迟时间: '18:00',
      密码激活时间: '14:00',
      延迟退房时间: '14:00',
    };

    get().sendAutoReply(conversationId, matchResult.templateId, data);
    recordSentMessage(conversation.guestId, dedupKey);

    const result: SmartAutoReplyResult = {
      success: true,
      ruleId: matchResult.ruleId,
      ruleName: matchResult.ruleName,
      templateId: matchResult.templateId,
      priority: matchResult.priority,
      hitExplanation: matchResult.hitExplanation,
      matchReasons: matchResult.reasons,
      competingRules: matchResult.competingRules,
    };
    set({ lastAutoReplyResult: result });
    return result;
  },
  
  receiveMessage: (conversationId, content, simulateGuest = false) => {
    const now = new Date();
    const newMessage: Message = {
      id: generateMessageId(),
      conversationId,
      senderType: simulateGuest ? 'guest' : 'guest',
      content,
      status: 'read',
      sentAt: now,
      readAt: now,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
        unreadCount: c.unreadCount + 1,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },

  simulateFollowUpMessage: (conversationId, content) => {
    get().receiveMessage(conversationId, content, true);

    setTimeout(() => {
      const conv = get().getConversationById(conversationId);
      if (conv && !conv.manualOverride) {
        get().smartAutoReply(conversationId);
      }
    }, 600);
  },

  simulateGuestReply: (conversationId, content) => {
    get().receiveMessage(conversationId, content, true);
  },
  
  toggleManualOverride: (conversationId) => {
    const conv = get().getConversationById(conversationId);
    const newOverride = !conv?.manualOverride;
    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, manualOverride: newOverride } : c
    );
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },

  restoreAutoReply: (conversationId) => {
    const conv = get().getConversationById(conversationId);
    if (!conv) return;

    clearGuestDeduplication(conv.guestId);

    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, manualOverride: false } : c
    );
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);

    useRuleStore.getState().recordRuleHitEvent({
      conversationId,
      guestId: conv.guestId,
      eventType: 'restored_auto',
      reasons: ['已解除人工接管，清除该客人所有去重记录，恢复自动回复'],
    });

    setTimeout(() => {
      const result = get().smartAutoReply(conversationId);
      console.log('恢复自动后触发回复:', result);
    }, 300);
  },
  
  addSpecialNeed: (conversationId, type, description) => {
    const now = new Date();
    const specialNeed: SpecialNeed = { type, description, markedAt: now };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      const existingIndex = c.specialNeeds.findIndex(s => s.type === type);
      let specialNeeds = existingIndex >= 0
        ? c.specialNeeds.map((s, i) => i === existingIndex ? specialNeed : s)
        : [...c.specialNeeds, specialNeed];
      return { ...c, specialNeeds };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  removeSpecialNeed: (conversationId, type) => {
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, specialNeeds: c.specialNeeds.filter(s => s.type !== type) };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  markAsRead: (conversationId) => {
    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  getConversationById: (id) => get().conversations.find(c => c.id === id),

  getConversationsByProperty: (propertyId) => get().conversations.filter(c => c.propertyId === propertyId),

  getConversationsByStayStage: (stayStage) => get().conversations.filter(c => c.stayStage === stayStage),

  getConversationsByGuestId: (guestId) => get().conversations.filter(c => c.guestId === guestId),

  simulateNewInquiry: (channel, propertyId, guestName, content, stayStage, existingGuestId) => {
    const now = new Date();
    const guestId = existingGuestId || `g${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newId = `conv${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const guestMessage: Message = {
      id: generateMessageId(),
      conversationId: newId,
      senderType: 'guest',
      content,
      status: 'delivered',
      sentAt: now,
    };

    const newConversation: Conversation = {
      id: newId,
      guestId,
      propertyId,
      channel,
      manualOverride: false,
      lastMessageAt: now,
      unreadCount: 1,
      stayStage,
      guest: {
        id: guestId,
        name: guestName,
        phone: '',
        platform: channel,
      },
      messages: [guestMessage],
      specialNeeds: [],
    };

    const conversations = [newConversation, ...get().conversations];
    set({ conversations, selectedConversationId: newId });
    saveToLocalStorage(STORAGE_KEY, conversations);

    setTimeout(() => {
      const result = get().smartAutoReply(newId);
      console.log('智能回复结果:', result);
    }, 500);

    return newId;
  },

  getUnreadCount: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),

  triggerStatusRefresh: () => {
    const conversations = get().conversations;
    conversations.forEach(conv => {
      const sendingMessages = conv.messages.filter(m => m.status === 'sending');
      if (sendingMessages.length > 0) {
        get().simulateMessageStatusFlow(conv.id);
      }
    });
  },

  simulateScenario: (scenarioType, options = {}) => {
    const {
      guestName = '测试客人',
      baseChannel = 'airbnb',
      propertyId = 'p1',
    } = options;

    const createdIds: string[] = [];
    const guestId = `g_scenario_${Date.now()}`;
    const channels = ['airbnb', 'ctrip', 'meituan', 'xiaohongshu'];

    switch (scenarioType) {
      case 'cross_channel': {
        const otherChannels = channels.filter(c => c !== baseChannel).slice(0, 2);
        const firstConvId = get().simulateNewInquiry(
          baseChannel,
          propertyId,
          guestName,
          '你好，请问这套房子还空着吗？',
          'inquiry',
          guestId
        );
        createdIds.push(firstConvId);

        setTimeout(() => {
          otherChannels.forEach((channel, idx) => {
            setTimeout(() => {
              const convId = get().simulateNewInquiry(
                channel,
                propertyId,
                guestName,
                idx === 0 ? '请问能优惠点吗？我在其他平台也看到了' : '可以留到明天吗？我再确认一下行程',
                'inquiry',
                guestId
              );
              createdIds.push(convId);
            }, idx * 1500);
          });
        }, 2000);
        break;
      }

      case 'delayed_followup': {
        const firstConvId = get().simulateNewInquiry(
          baseChannel,
          propertyId,
          guestName,
          '你好，想咨询一下房源',
          'inquiry',
          guestId
        );
        createdIds.push(firstConvId);

        setTimeout(() => {
          get().simulateFollowUpMessage(
            firstConvId,
            '还在吗？我想了解一下具体的入住流程'
          );
        }, 3000);
        break;
      }

      case 'manual_switch': {
        const convId = get().simulateNewInquiry(
          baseChannel,
          propertyId,
          guestName,
          '你好，请问可以带宠物吗？',
          'inquiry',
          guestId
        );
        createdIds.push(convId);

        setTimeout(() => {
          get().toggleManualOverride(convId);
          get().sendMessage(convId, '您好，可以带宠物的，我们家是宠物友好房源~', false);
        }, 2000);

        setTimeout(() => {
          get().simulateGuestReply(convId, '太好了！那我预定了哈');
        }, 4000);

        setTimeout(() => {
          get().restoreAutoReply(convId);
        }, 6000);
        break;
      }

      case 'dedup_test': {
        const convId = get().simulateNewInquiry(
          baseChannel,
          propertyId,
          guestName,
          '第一次咨询，想了解一下房源',
          'inquiry',
          guestId
        );
        createdIds.push(convId);

        setTimeout(() => {
          get().simulateFollowUpMessage(
            convId,
            '第二次咨询，去重应该拦住了吧？'
          );
        }, 3000);

        setTimeout(() => {
          get().simulateGuestReply(convId, '客人自己说句话');
        }, 5000);

        setTimeout(() => {
          get().restoreAutoReply(convId);
        }, 7000);

        setTimeout(() => {
          get().simulateFollowUpMessage(
            convId,
            '恢复自动后再发一条，去重已经清掉了吧？'
          );
        }, 9000);
        break;
      }
    }

    return createdIds;
  },
}));
