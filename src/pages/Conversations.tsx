import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Search,
  Filter,
  Baby,
  Bed,
  Clock,
  Sunrise,
  Ban,
  PawPrint,
  Plus,
  X,
  Hand,
  Zap,
  Moon,
  RefreshCw,
  MessageCircle,
  Target,
  Award,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { MessageBubble } from '@/components/shared/MessageBubble';
import { useConversationStore, SmartAutoReplyResult } from '@/store/useConversationStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useNightMode } from '@/hooks/useNightMode';
import { useDeduplication } from '@/hooks/useDeduplication';
import type { Conversation, SpecialNeedType, StayStage } from '@/types/conversation';
import { formatRelative } from '@/utils/date';
import { renderTemplate } from '@/utils/template';

const Conversations: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    sendMessage,
    smartAutoReply,
    toggleManualOverride,
    restoreAutoReply,
    addSpecialNeed,
    removeSpecialNeed,
    markAsRead,
    simulateNewInquiry,
    simulateFollowUpMessage,
    simulateGuestReply,
    getConversationsByGuestId,
    lastAutoReplyResult,
  } = useConversationStore();
  const { templates, getTemplatesByCategory } = useTemplateStore();
  const { properties, getPropertyById } = usePropertyStore();
  const { isNightMode } = useNightMode();
  const { checkAndRecord, isDuplicate } = useDeduplication();

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSpecialNeedModal, setShowSpecialNeedModal] = useState(false);
  const [specialNeedType, setSpecialNeedType] = useState<SpecialNeedType>('baby_crib');
  const [specialNeedDesc, setSpecialNeedDesc] = useState('');
  const [showNewInquiryModal, setShowNewInquiryModal] = useState(false);
  const [showRuleResultModal, setShowRuleResultModal] = useState(false);
  const [ruleResultToShow, setRuleResultToShow] = useState<SmartAutoReplyResult | null>(null);
  const [newInquiryData, setNewInquiryData] = useState({
    channel: 'airbnb' as string,
    propertyId: 'p1' as string,
    guestName: '',
    content: '',
    stayStage: 'inquiry' as StayStage,
    useExistingGuest: false,
    existingGuestId: '' as string,
  });
  const [followUpData, setFollowUpData] = useState({
    show: false,
    conversationId: '',
    content: '',
    asGuest: false,
  });
  const [autoReplyToast, setAutoReplyToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'info'; result?: SmartAutoReplyResult }>({ show: false, message: '', type: 'success' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.conversationId) {
        setSelectedConversationId(state.conversationId);
        markAsRead(state.conversationId);
      }
      if (state.channelFilter) {
        setChannelFilter(state.channelFilter);
      }
      if (state.stageFilter) {
        setStageFilter(state.stageFilter);
      }
      if (state.propertyFilter) {
        setPropertyFilter(state.propertyFilter);
      }
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (lastAutoReplyResult && (lastAutoReplyResult.ruleId || lastAutoReplyResult.reason)) {
      setAutoReplyToast({
        show: true,
        message: lastAutoReplyResult.success
          ? `已命中「${lastAutoReplyResult.ruleName}」规则`
          : lastAutoReplyResult.reason || '操作失败',
        type: lastAutoReplyResult.success ? 'success' : 'warning',
        result: lastAutoReplyResult,
      });
      setTimeout(() => {
        setAutoReplyToast(prev => ({ ...prev, show: false }));
      }, 4500);
    }
  }, [lastAutoReplyResult]);

  const channelLabels: Record<string, string> = {
    airbnb: 'Airbnb',
    ctrip: '携程',
    meituan: '美团',
    xiaohongshu: '小红书',
  };

  const specialNeedOptions: { type: SpecialNeedType; label: string; icon: React.ReactNode }[] = [
    { type: 'baby_crib', label: '婴儿床', icon: <Baby className="w-4 h-4" /> },
    { type: 'extra_bed', label: '加床', icon: <Bed className="w-4 h-4" /> },
    { type: 'late_checkout', label: '延迟退房', icon: <Clock className="w-4 h-4" /> },
    { type: 'early_checkin', label: '提前入住', icon: <Sunrise className="w-4 h-4" /> },
    { type: 'no_smoking', label: '禁止吸烟', icon: <Ban className="w-4 h-4" /> },
    { type: 'pet_friendly', label: '宠物友好', icon: <PawPrint className="w-4 h-4" /> },
  ];

  const stageLabels: Record<string, string> = {
    all: '全部阶段',
    inquiry: '咨询中',
    pre_checkin: '入住前',
    during_stay: '入住中',
    post_checkout: '退房后',
  };

  const stageColors: Record<string, string> = {
    inquiry: 'info',
    pre_checkin: 'warning',
    during_stay: 'success',
    post_checkout: 'default',
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.guest.name.includes(searchQuery) ||
      c.messages.some(m => m.content.includes(searchQuery));
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    const matchesStage = stageFilter === 'all' || c.stayStage === stageFilter;
    const matchesProperty = propertyFilter === 'all' || c.propertyId === propertyFilter;
    return matchesSearch && matchesChannel && matchesStage && matchesProperty;
  });

  const sortedConversations = [...filteredConversations].sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId]);

  const existingGuestOptions = React.useMemo(() => {
    const guestMap = new Map<string, string>();
    conversations.forEach(c => {
      if (!guestMap.has(c.guestId)) {
        guestMap.set(c.guestId, `${c.guest.name} (${channelLabels[c.channel] || c.channel})`);
      }
    });
    return Array.from(guestMap.entries()).map(([id, label]) => ({ value: id, label }));
  }, [conversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    markAsRead(conversation.id);
  };

  const handleSendMessage = () => {
    if (!selectedConversationId || !newMessage.trim()) return;

    const isRewritten = selectedTemplateId !== '';
    sendMessage(selectedConversationId, newMessage, isRewritten, selectedTemplateId || undefined);
    setNewMessage('');
    setSelectedTemplateId('');
  };

  const handleUseTemplate = (templateId: string) => {
    if (!selectedConversation) return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const property = getPropertyById(selectedConversation.propertyId);
    const data: Record<string, any> = {
      客人姓名: selectedConversation.guest.name,
      房源名称: property?.name || '',
      地址: property?.address || '',
      入住日期: '2024-06-20',
      退房日期: '2024-06-25',
      门锁密码: property?.doorLock.password || '',
      门锁设置说明: property?.doorLock.instructions || '',
      最近地铁站: property?.transportInfo.nearestSubway || '',
      wifi密码: property?.wifiPassword || '',
    };

    const rendered = renderTemplate(template.content, data);
    setNewMessage(rendered);
    setSelectedTemplateId(templateId);
  };

  const handleSendAutoReply = () => {
    if (!selectedConversation) return;
    
    const result = smartAutoReply(selectedConversation.id);
    
    if (result) {
      setRuleResultToShow(result);
      if (!result.success || result.competingRules?.length || result.matchReasons?.length) {
        setShowRuleResultModal(true);
      }
    }
  };

  const handleSimulateNewInquiry = () => {
    if (!newInquiryData.guestName.trim() || !newInquiryData.content.trim()) {
      alert('请填写客人姓名和咨询内容');
      return;
    }

    const guestId = newInquiryData.useExistingGuest ? newInquiryData.existingGuestId : undefined;
    const newId = simulateNewInquiry(
      newInquiryData.channel,
      newInquiryData.propertyId,
      newInquiryData.guestName,
      newInquiryData.content,
      newInquiryData.stayStage,
      guestId
    );

    setSelectedConversationId(newId);
    setShowNewInquiryModal(false);
    setNewInquiryData({
      channel: 'airbnb',
      propertyId: 'p1',
      guestName: '',
      content: '',
      stayStage: 'inquiry',
      useExistingGuest: false,
      existingGuestId: '',
    });
  };

  const handleSendFollowUp = () => {
    if (!followUpData.conversationId || !followUpData.content.trim()) return;
    
    if (followUpData.asGuest) {
      simulateGuestReply(followUpData.conversationId, followUpData.content);
    } else {
      simulateFollowUpMessage(followUpData.conversationId, followUpData.content);
    }
    
    setFollowUpData({ show: false, conversationId: '', content: '', asGuest: false });
  };

  const handleAddSpecialNeed = () => {
    if (!selectedConversationId || !specialNeedDesc.trim()) return;
    addSpecialNeed(selectedConversationId, specialNeedType, specialNeedDesc);
    setShowSpecialNeedModal(false);
    setSpecialNeedDesc('');
  };

  const handleRestoreAuto = () => {
    if (!selectedConversationId) return;
    restoreAutoReply(selectedConversationId);
  };

  const stageFilterOptions = [
    { value: 'all', label: '全部阶段' },
    { value: 'inquiry', label: '咨询中' },
    { value: 'pre_checkin', label: '入住前' },
    { value: 'during_stay', label: '入住中' },
    { value: 'post_checkout', label: '退房后' },
  ];

  const channelFilterOptions = [
    { value: 'all', label: '全部渠道' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'ctrip', label: '携程' },
    { value: 'meituan', label: '美团' },
    { value: 'xiaohongshu', label: '小红书' },
  ];

  const propertyFilterOptions = [
    { value: 'all', label: '全部房源' },
    ...properties.map(p => ({ value: p.id, label: p.name })),
  ];

  const inquiryTemplates = getTemplatesByCategory('inquiry');
  const duringStayTemplates = getTemplatesByCategory('during_stay');

  const navigateToRuleCenter = () => {
    navigate('/rules');
  };

  return (
    <MainLayout>
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">会话中台</h1>
            <p className="text-gray-500 mt-1">多渠道消息聚合，智能自动回复</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToRuleCenter}
            leftIcon={<Target className="w-4 h-4" />}
          >
            规则中心
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-220px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">会话列表</h2>
              <div className="flex items-center gap-2">
                {isNightMode && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Moon className="w-3 h-3" />
                    深夜
                  </Badge>
                )}
                <Button
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowNewInquiryModal(true)}
                >
                  模拟咨询
                </Button>
              </div>
            </div>
            <Input
              placeholder="搜索客人或消息..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <Dropdown
                options={channelFilterOptions}
                value={channelFilter}
                onChange={setChannelFilter}
                placeholder="渠道筛选"
              />
              <Dropdown
                options={stageFilterOptions}
                value={stageFilter}
                onChange={setStageFilter}
                placeholder="阶段筛选"
              />
              <Dropdown
                options={propertyFilterOptions}
                value={propertyFilter}
                onChange={setPropertyFilter}
                placeholder="房源筛选"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">暂无会话</p>
              </div>
            ) : (
              sortedConversations.map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedConversationId === conversation.id
                      ? 'bg-[#1e3a5f]/5'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar size="md" fallback={
                      <User className="w-5 h-5 text-gray-500" />
                    } />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 truncate">
                          {conversation.guest.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatRelative(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Tag variant="info" size="sm">
                          {channelLabels[conversation.channel]}
                        </Tag>
                        <Tag variant={stageColors[conversation.stayStage] as any} size="sm">
                          {stageLabels[conversation.stayStage]}
                        </Tag>
                        {conversation.manualOverride && (
                          <Tag variant="warning" size="sm">
                            <Hand className="w-3 h-3 mr-1" />
                            人工
                          </Tag>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.messages[conversation.messages.length - 1]?.content}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="danger">{conversation.unreadCount}</Badge>
                    )}
                  </div>
                  {conversation.specialNeeds.length > 0 && (
                    <div className="flex gap-1 mt-2 ml-11">
                      {conversation.specialNeeds.slice(0, 3).map((need, idx) => {
                        const option = specialNeedOptions.find(o => o.type === need.type);
                        return (
                          <Tag key={idx} variant="warning" size="sm">
                            {option?.icon}
                            <span className="ml-1">{option?.label}</span>
                          </Tag>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar size="md" fallback={
                    <User className="w-5 h-5 text-gray-500" />
                  } />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {selectedConversation.guest.name}
                      </span>
                      {getConversationsByGuestId(selectedConversation.guestId).length > 1 && (
                        <Badge variant="info">
                          <Layers className="w-3 h-3 mr-1" />
                          {getConversationsByGuestId(selectedConversation.guestId).length}个会话
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Tag variant="info" size="sm">
                        {channelLabels[selectedConversation.channel]}
                      </Tag>
                      {getPropertyById(selectedConversation.propertyId)?.name}
                      <Tag variant={stageColors[selectedConversation.stayStage] as any} size="sm">
                        {stageLabels[selectedConversation.stayStage]}
                      </Tag>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">人工接管</span>
                    <Switch
                      checked={selectedConversation.manualOverride}
                      onChange={() => toggleManualOverride(selectedConversation.id)}
                    />
                  </div>
                  {selectedConversation.manualOverride && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      onClick={handleRestoreAuto}
                    >
                      恢复自动
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                      onClick={() => {
                        setFollowUpData({
                          show: true,
                          conversationId: selectedConversation.id,
                          content: '',
                          asGuest: true,
                        });
                      }}
                    >
                      模拟客人回复
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => setShowSpecialNeedModal(true)}
                    >
                      标记需求
                    </Button>
                  </div>
                </div>
              </div>

              {selectedConversation.specialNeeds.length > 0 && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-amber-700 font-medium">特殊需求：</span>
                    {selectedConversation.specialNeeds.map((need, idx) => {
                      const option = specialNeedOptions.find(o => o.type === need.type);
                      return (
                        <Tag key={idx} variant="warning" className="flex items-center gap-1">
                          {option?.icon}
                          {option?.label}: {need.description}
                          <button
                            onClick={() => removeSpecialNeed(selectedConversation.id, need.type)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedConversation.manualOverride && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                  <Hand className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    当前会话已被人工接管，自动回复已暂停。可点击「恢复自动」重新启用。
                  </span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {selectedConversation.messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Zap className="w-4 h-4" />}
                    onClick={handleSendAutoReply}
                    disabled={selectedConversation.manualOverride}
                  >
                    智能回复
                  </Button>
                  {inquiryTemplates.slice(0, 3).map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      {template.name}
                    </Button>
                  ))}
                  {duringStayTemplates.slice(0, 2).map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      {template.name}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => {
                      setFollowUpData({
                        show: true,
                        conversationId: selectedConversation.id,
                        content: '',
                        asGuest: false,
                      });
                    }}
                  >
                    模拟追问
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息... 使用 {{变量名}} 插入变量"
                    rows={2}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="self-end"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {selectedTemplateId && (
                  <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    已使用模板，发送后将标记为"已改写"
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="text-center py-12 w-96">
                <CardContent>
                  <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">选择一个会话开始沟通</p>
                  <p className="text-sm text-gray-400 mt-1">
                    系统将自动回复常见问题，减少您的重复劳动
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowNewInquiryModal(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    创建模拟咨询
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className={`fixed inset-0 z-50 flex items-center justify-center ${showSpecialNeedModal ? '' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowSpecialNeedModal(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold mb-4">标记特殊需求</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">需求类型</label>
              <div className="grid grid-cols-2 gap-2">
                {specialNeedOptions.map(option => (
                  <button
                    key={option.type}
                    onClick={() => setSpecialNeedType(option.type)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      specialNeedType === option.type
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {option.icon}
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">详细说明</label>
              <Input
                value={specialNeedDesc}
                onChange={(e) => setSpecialNeedDesc(e.target.value)}
                placeholder="例如：需要婴儿床一张，2岁儿童使用"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowSpecialNeedModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddSpecialNeed} disabled={!specialNeedDesc.trim()}>
              添加标记
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showNewInquiryModal}
        onClose={() => setShowNewInquiryModal(false)}
        title="模拟新咨询"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">选择不同的渠道、房源和入住阶段，测试智能回复效果</p>
          
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newInquiryData.useExistingGuest}
                onChange={(e) => setNewInquiryData(prev => ({ ...prev, useExistingGuest: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-amber-700">
                使用已有客人ID（模拟跨渠道咨询、多次咨询场景）
              </span>
            </label>
            {newInquiryData.useExistingGuest && existingGuestOptions.length > 0 && (
              <Dropdown
                options={existingGuestOptions}
                value={newInquiryData.existingGuestId}
                onChange={(v) => setNewInquiryData(prev => ({ ...prev, existingGuestId: v }))}
                className="mt-2 w-full"
                placeholder="选择已有客人"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">渠道</label>
              <Dropdown
                options={channelFilterOptions.filter(o => o.value !== 'all')}
                value={newInquiryData.channel}
                onChange={(v) => setNewInquiryData(prev => ({ ...prev, channel: v }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">入住阶段</label>
              <Dropdown
                options={stageFilterOptions.filter(o => o.value !== 'all')}
                value={newInquiryData.stayStage}
                onChange={(v) => setNewInquiryData(prev => ({ ...prev, stayStage: v as StayStage }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">房源</label>
            <Dropdown
              options={properties.map(p => ({ value: p.id, label: p.name }))}
              value={newInquiryData.propertyId}
              onChange={(v) => setNewInquiryData(prev => ({ ...prev, propertyId: v }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客人姓名</label>
            <Input
              value={newInquiryData.guestName}
              onChange={(e) => setNewInquiryData(prev => ({ ...prev, guestName: e.target.value }))}
              placeholder="请输入客人姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">咨询内容</label>
            <Textarea
              value={newInquiryData.content}
              onChange={(e) => setNewInquiryData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入客人的咨询内容"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { text: '请问还有房吗？', stage: 'inquiry' },
              { text: '明天入住，地址在哪里？', stage: 'pre_checkin' },
              { text: '空调遥控器在哪？', stage: 'during_stay' },
            ].map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => setNewInquiryData(prev => ({
                  ...prev,
                  content: preset.text,
                  stayStage: preset.stage as StayStage,
                }))}
              >
                {preset.text}
              </Button>
            ))}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">提示：</span>
              提交后系统将自动触发智能回复，可查看规则命中结果。
              {isNightMode && <span className="ml-1 text-amber-600">（当前为深夜模式）</span>}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setShowNewInquiryModal(false)}>
            取消
          </Button>
          <Button
            onClick={handleSimulateNewInquiry}
            disabled={!newInquiryData.guestName.trim() || !newInquiryData.content.trim()}
          >
            发送咨询
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={followUpData.show}
        onClose={() => setFollowUpData({ show: false, conversationId: '', content: '', asGuest: false })}
        title={followUpData.asGuest ? '模拟客人回复' : '模拟客人追问'}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followUpData.asGuest}
                onChange={(e) => setFollowUpData(prev => ({ ...prev, asGuest: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-amber-700">
                仅作为客人发送消息（不触发自动回复，用于测试人工接管）
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消息内容</label>
            <Textarea
              value={followUpData.content}
              onChange={(e) => setFollowUpData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入模拟的客人消息"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['好的，谢谢！', '有停车位吗？', '想延迟到2点退房', '请问押金多少？'].map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => setFollowUpData(prev => ({ ...prev, content: preset }))}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setFollowUpData({ show: false, conversationId: '', content: '', asGuest: false })}>
            取消
          </Button>
          <Button onClick={handleSendFollowUp} disabled={!followUpData.content.trim()}>
            {followUpData.asGuest ? '仅发送客人消息' : '发送并触发自动回复'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showRuleResultModal}
        onClose={() => setShowRuleResultModal(false)}
        title="规则匹配结果"
        size="lg"
      >
        {ruleResultToShow && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${ruleResultToShow.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {ruleResultToShow.success ? (
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${ruleResultToShow.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {ruleResultToShow.success
                      ? `已命中规则：${ruleResultToShow.ruleName}`
                      : '未命中任何规则'}
                  </p>
                  {ruleResultToShow.hitExplanation && (
                    <p className={`text-sm mt-1 ${ruleResultToShow.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {ruleResultToShow.hitExplanation}
                    </p>
                  )}
                  {ruleResultToShow.reason && !ruleResultToShow.success && (
                    <p className="text-sm mt-1 text-red-700">
                      原因：{ruleResultToShow.reason}
                    </p>
                  )}
                  {ruleResultToShow.priority !== undefined && (
                    <Badge variant="info" className="mt-2">
                      优先级 P{ruleResultToShow.priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {ruleResultToShow.matchReasons && ruleResultToShow.matchReasons.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">匹配条件：</p>
                <div className="space-y-1">
                  {ruleResultToShow.matchReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ruleResultToShow.competingRules && ruleResultToShow.competingRules.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">其他竞争规则（未生效）：</p>
                <div className="space-y-2">
                  {ruleResultToShow.competingRules.map((rule, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{rule.ruleName}</span>
                        <Badge variant="default">优先级 P{rule.priority}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{rule.hitExplanation}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  * 同时命中多条规则时，优先级最高的规则生效
                </p>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToRuleCenter}
            leftIcon={<Target className="w-4 h-4" />}
          >
            打开规则中心
          </Button>
          <Button onClick={() => setShowRuleResultModal(false)}>
            确定
          </Button>
        </div>
      </Modal>

      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        autoReplyToast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          autoReplyToast.type === 'success' ? 'bg-emerald-500 text-white' :
          autoReplyToast.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">{autoReplyToast.message}</span>
          {autoReplyToast.result && (autoReplyToast.result.matchReasons || autoReplyToast.result.competingRules?.length) && (
            <button
              onClick={() => {
                setRuleResultToShow(autoReplyToast.result || null);
                setShowRuleResultModal(true);
              }}
              className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-xs"
            >
              详情
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Conversations;
