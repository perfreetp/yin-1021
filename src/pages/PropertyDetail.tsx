import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  MessageSquare,
  Calendar,
  Filter,
  Baby,
  Bed,
  Clock,
  Sunrise,
  Ban,
  PawPrint,
  AlertCircle,
  ChevronRight,
  Tag,
  Zap,
  User,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tag as TagComponent } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dropdown } from '@/components/ui/Dropdown';
import { StatsCard } from '@/components/shared/StatsCard';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useConversationStore } from '@/store/useConversationStore';
import type { SpecialNeedType, StayStage, Conversation } from '@/types/conversation';
import { formatDateTime, formatRelative, isWithinDays } from '@/utils/date';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPropertyById } = usePropertyStore();
  const { getConversationsByProperty } = useConversationStore();

  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('conversations');

  const property = id ? getPropertyById(id) : undefined;
  const allConversations = id ? getConversationsByProperty(id) : [];

  const recentConversations = useMemo(() => {
    return allConversations.filter(c => isWithinDays(new Date(c.lastMessageAt), 30));
  }, [allConversations]);

  const filteredConversations = useMemo(() => {
    return recentConversations.filter(c => {
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (stageFilter !== 'all' && c.stayStage !== stageFilter) return false;
      return true;
    });
  }, [recentConversations, channelFilter, stageFilter]);

  const allSpecialNeeds = useMemo(() => {
    const needs: { type: SpecialNeedType; description: string; guestName: string; conversationId: string }[] = [];
    recentConversations.forEach(conv => {
      conv.specialNeeds.forEach(need => {
        needs.push({
          type: need.type,
          description: need.description,
          guestName: conv.guest.name,
          conversationId: conv.id,
        });
      });
    });
    return needs;
  }, [recentConversations]);

  const keyReminders = useMemo(() => {
    const reminders: { type: string; content: string; guestName: string }[] = [];
    recentConversations.forEach(conv => {
      if (conv.manualOverride) {
        reminders.push({
          type: '人工接管',
          content: '该会话已人工接管，自动回复暂停',
          guestName: conv.guest.name,
        });
      }
      if (conv.unreadCount > 0) {
        reminders.push({
          type: '未读消息',
          content: `${conv.unreadCount}条未读消息待回复`,
          guestName: conv.guest.name,
        });
      }
    });
    return reminders;
  }, [recentConversations]);

  const stats = useMemo(() => {
    const totalMessages = recentConversations.reduce((sum, c) => sum + c.messages.length, 0);
    const autoMessages = recentConversations.reduce((sum, c) => 
      sum + c.messages.filter(m => m.senderType === 'auto').length, 0
    );
    const autoReplyRate = totalMessages > 0 ? Math.round((autoMessages / totalMessages) * 100) / 100 : 0;
    
    return {
      conversationCount: recentConversations.length,
      messageCount: totalMessages,
      autoReplyRate,
      specialNeedCount: allSpecialNeeds.length,
    };
  }, [recentConversations, allSpecialNeeds]);

  const specialNeedIcons: Record<SpecialNeedType, React.ReactNode> = {
    baby_crib: <Baby className="w-4 h-4" />,
    extra_bed: <Bed className="w-4 h-4" />,
    late_checkout: <Clock className="w-4 h-4" />,
    early_checkin: <Sunrise className="w-4 h-4" />,
    no_smoking: <Ban className="w-4 h-4" />,
    pet_friendly: <PawPrint className="w-4 h-4" />,
    custom: <AlertCircle className="w-4 h-4" />,
  };

  const specialNeedLabels: Record<SpecialNeedType, string> = {
    baby_crib: '婴儿床',
    extra_bed: '加床',
    late_checkout: '延迟退房',
    early_checkin: '提前入住',
    no_smoking: '禁止吸烟',
    pet_friendly: '宠物友好',
    custom: '自定义',
  };

  const channelLabels: Record<string, string> = {
    airbnb: 'Airbnb',
    ctrip: '携程',
    meituan: '美团',
    xiaohongshu: '小红书',
  };

  const stageLabels: Record<StayStage | 'all', string> = {
    all: '全部阶段',
    inquiry: '咨询中',
    pre_checkin: '入住前',
    during_stay: '入住中',
    post_checkout: '退房后',
  };

  const channelOptions = [
    { value: 'all', label: '全部渠道' },
    { value: 'airbnb', label: 'Airbnb' },
    { value: 'ctrip', label: '携程' },
    { value: 'meituan', label: '美团' },
    { value: 'xiaohongshu', label: '小红书' },
  ];

  const stageOptions = [
    { value: 'all', label: '全部阶段' },
    { value: 'inquiry', label: '咨询中' },
    { value: 'pre_checkin', label: '入住前' },
    { value: 'during_stay', label: '入住中' },
    { value: 'post_checkout', label: '退房后' },
  ];

  const handleGoBack = () => {
    navigate('/analytics');
  };

  const handleViewConversation = (conversationId: string) => {
    navigate('/conversations', {
      state: {
        conversationId,
        channelFilter,
        stageFilter,
      },
    });
  };

  if (!property) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">房源不存在</p>
            <Button onClick={handleGoBack} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回统计页
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            返回统计
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
              <TagComponent variant={property.status === 'active' ? 'success' : 'default'} size="sm">
                {property.status === 'active' ? '运营中' : '已下架'}
              </TagComponent>
            </div>
            <p className="text-gray-500 mt-1">{property.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="近30天会话"
            value={stats.conversationCount}
            icon={<MessageSquare className="w-5 h-5" />}
            color="primary"
          />
          <StatsCard
            title="近30天消息"
            value={stats.messageCount}
            icon={<Zap className="w-5 h-5" />}
            color="success"
          />
          <StatsCard
            title="自动回复率"
            value={`${Math.round(stats.autoReplyRate * 100)}%`}
            icon={<Calendar className="w-5 h-5" />}
            color="info"
          />
          <StatsCard
            title="特殊需求"
            value={stats.specialNeedCount}
            icon={<AlertCircle className="w-5 h-5" />}
            color="warning"
          />
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              沟通记录
            </TabsTrigger>
            <TabsTrigger value="specialNeeds" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              特殊需求
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              关键提醒
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">近30天沟通记录</CardTitle>
                  <div className="flex gap-3">
                    <Dropdown
                      options={channelOptions}
                      value={channelFilter}
                      onChange={setChannelFilter}
                      className="w-36"
                    />
                    <Dropdown
                      options={stageOptions}
                      value={stageFilter}
                      onChange={setStageFilter}
                      className="w-36"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredConversations.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredConversations.map(conv => (
                      <div
                        key={conv.id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleViewConversation(conv.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#1e3a5f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">{conv.guest.name}</span>
                            <TagComponent variant="info" size="sm">
                              {channelLabels[conv.channel] || conv.channel}
                            </TagComponent>
                            <TagComponent variant="default" size="sm">
                              {stageLabels[conv.stayStage]}
                            </TagComponent>
                            {conv.manualOverride && (
                              <TagComponent variant="warning" size="sm">人工接管</TagComponent>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conv.messages[conv.messages.length - 1]?.content}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400">{formatRelative(conv.lastMessageAt)}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="danger" className="mt-1">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无符合条件的沟通记录</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specialNeeds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">近30天特殊需求汇总</CardTitle>
              </CardHeader>
              <CardContent>
                {allSpecialNeeds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allSpecialNeeds.map((need, idx) => (
                      <Card key={idx} className="border-amber-200 bg-amber-50/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                              {specialNeedIcons[need.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 mb-1">
                                {specialNeedLabels[need.type]}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{need.description}</p>
                              <p className="text-xs text-gray-400">客人：{need.guestName}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">近30天暂无特殊需求</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">关键提醒</CardTitle>
              </CardHeader>
              <CardContent>
                {keyReminders.length > 0 ? (
                  <div className="space-y-3">
                    {keyReminders.map((reminder, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-amber-800">{reminder.type}</div>
                          <p className="text-xs text-amber-600">{reminder.content}</p>
                        </div>
                        <Badge variant="warning">{reminder.guestName}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无关键提醒</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PropertyDetail;
