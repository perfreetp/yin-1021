import React, { useState, useRef, useEffect } from 'react';
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
import { MessageBubble } from '@/components/shared/MessageBubble';
import { useConversationStore } from '@/store/useConversationStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useNightMode } from '@/hooks/useNightMode';
import { useDeduplication } from '@/hooks/useDeduplication';
import type { Conversation, SpecialNeedType } from '@/types/conversation';
import { formatRelative } from '@/utils/date';
import { renderTemplate } from '@/utils/template';

const Conversations: React.FC = () => {
  const {
    conversations,
    selectedConversationId,
    setSelectedConversationId,
    sendMessage,
    sendAutoReply,
    toggleManualOverride,
    addSpecialNeed,
    removeSpecialNeed,
    markAsRead,
  } = useConversationStore();
  const { templates, getTemplatesByCategory } = useTemplateStore();
  const { getPropertyById } = usePropertyStore();
  const { isNightMode } = useNightMode();
  const { checkAndRecord, isDuplicate } = useDeduplication();

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showSpecialNeedModal, setShowSpecialNeedModal] = useState(false);
  const [specialNeedType, setSpecialNeedType] = useState<SpecialNeedType>('baby_crib');
  const [specialNeedDesc, setSpecialNeedDesc] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

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

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.guest.name.includes(searchQuery) ||
      c.messages.some(m => m.content.includes(searchQuery));
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter;
    return matchesSearch && matchesChannel;
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

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    markAsRead(conversation.id);
  };

  const handleSendMessage = () => {
    if (!selectedConversationId || !newMessage.trim()) return;

    const isRewritten = selectedTemplateId !== '';
    sendMessage(selectedConversationId, newMessage, isRewritten);
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
    if (selectedConversation.manualOverride) {
      alert('当前会话已被人工接管，无法发送自动回复');
      return;
    }

    const dedupKey = `${selectedConversation.id}-auto-reply`;
    if (isDuplicate(selectedConversation.id, 'auto-reply')) {
      alert('24小时内已发送过自动回复，避免重复打扰客人');
      return;
    }

    const template = isNightMode
      ? templates.find(t => t.category === 'inquiry' && t.name.includes('深夜'))
      : templates.find(t => t.category === 'inquiry');

    if (template) {
      const property = getPropertyById(selectedConversation.propertyId);
      const data: Record<string, any> = {
        客人姓名: selectedConversation.guest.name,
        房源名称: property?.name || '',
      };
      sendAutoReply(selectedConversation.id, template.id, data);
      checkAndRecord(selectedConversation.id, 'auto-reply');
    }
  };

  const handleAddSpecialNeed = () => {
    if (!selectedConversationId || !specialNeedDesc.trim()) return;
    addSpecialNeed(selectedConversationId, specialNeedType, specialNeedDesc);
    setShowSpecialNeedModal(false);
    setSpecialNeedDesc('');
  };

  const channelFilterOptions = [
    { value: 'all', label: '全部渠道' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'ctrip', label: '携程' },
    { value: 'meituan', label: '美团' },
    { value: 'xiaohongshu', label: '小红书' },
  ];

  const inquiryTemplates = getTemplatesByCategory('inquiry');
  const duringStayTemplates = getTemplatesByCategory('during_stay');

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">会话列表</h2>
              {isNightMode && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Moon className="w-3 h-3" />
                  深夜模式
                </Badge>
              )}
            </div>
            <Input
              placeholder="搜索客人或消息..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Dropdown
              options={channelFilterOptions}
              value={channelFilter}
              onChange={setChannelFilter}
              placeholder="选择渠道"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {sortedConversations.map(conversation => (
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
                    <div className="flex items-center gap-2 mt-1">
                      <Tag variant="info" size="sm">
                        {channelLabels[conversation.channel]}
                      </Tag>
                      {conversation.manualOverride && (
                        <Tag variant="warning" size="sm">
                          <Hand className="w-3 h-3 mr-1" />
                          人工接管
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
            ))}
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
                    <div className="font-medium text-gray-900">
                      {selectedConversation.guest.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Tag variant="info" size="sm">
                        {channelLabels[selectedConversation.channel]}
                      </Tag>
                      {getPropertyById(selectedConversation.propertyId)?.name}
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
                    当前会话已被人工接管，自动回复已暂停。关闭开关可恢复自动回复。
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
    </MainLayout>
  );
};

export default Conversations;
