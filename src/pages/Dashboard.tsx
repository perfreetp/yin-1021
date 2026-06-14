import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  MessageSquare,
  Users,
  Sparkles,
  Zap,
  Building2,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Home,
  Baby,
  Bed,
  Ban,
  PawPrint,
  Sunrise,
  ArrowRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/shared/StatsCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useConversationStore } from '@/store/useConversationStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useCleaningStore } from '@/store/useCleaningStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import { useNightMode } from '@/hooks/useNightMode';
import type { SpecialNeedType } from '@/types/conversation';
import { formatRelative } from '@/utils/date';

const Dashboard: React.FC = () => {
  const { conversations, getUnreadCount } = useConversationStore();
  const { bookings, getUpcomingBookings, scheduleLogs } = useScheduleStore();
  const { tasks, getTasksByStatus } = useCleaningStore();
  const { getTopRewrittenTemplates, getAutoReplyRate, getAverageResponseTime, dailyTrend } = useAnalyticsStore();
  const { properties } = usePropertyStore();
  const { templates } = useTemplateStore();
  const { isNightMode } = useNightMode();

  const unreadCount = getUnreadCount();
  const upcomingBookings = getUpcomingBookings(7);
  const autoReplyRate = getAutoReplyRate();
  const avgResponseTime = getAverageResponseTime();
  const topRewritten = getTopRewrittenTemplates(3);

  const pendingTasks = getTasksByStatus('pending');
  const inProgressTasks = getTasksByStatus('in_progress');
  const activeBookings = bookings.filter(b => b.status === 'checked_in');
  const pendingMessages = scheduleLogs.filter(l => l.status === 'pending').length;

  const recentConversations = [...conversations]
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
    .slice(0, 5);

  const specialNeedIcons: Record<SpecialNeedType, React.ReactNode> = {
    baby_crib: <Baby className="w-3 h-3" />,
    extra_bed: <Bed className="w-3 h-3" />,
    late_checkout: <Clock className="w-3 h-3" />,
    early_checkin: <Sunrise className="w-3 h-3" />,
    no_smoking: <Ban className="w-3 h-3" />,
    pet_friendly: <PawPrint className="w-3 h-3" />,
    custom: <AlertCircle className="w-3 h-3" />,
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

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`;
  };

  const quickActions = [
    { icon: <Building2 className="w-5 h-5" />, label: '房源管理', path: '/properties', color: 'primary' },
    { icon: <FileText className="w-5 h-5" />, label: '消息模板', path: '/templates', color: 'success' },
    { icon: <MessageSquare className="w-5 h-5" />, label: '回复咨询', path: '/conversations', color: 'info' },
    { icon: <Calendar className="w-5 h-5" />, label: '日程安排', path: '/schedule', color: 'warning' },
    { icon: <Sparkles className="w-5 h-5" />, label: '保洁任务', path: '/cleaning', color: 'primary' },
    { icon: <BarChart className="w-5 h-5" />, label: '数据统计', path: '/analytics', color: 'success' },
  ];

  const getPropertyById = (id: string) => properties.find(p => p.id === id);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
            <p className="text-gray-500 mt-1">欢迎回来！这是您今日的业务概览</p>
          </div>
          {isNightMode && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">深夜模式已开启，系统将自动发送简版回复</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="未读消息"
            value={unreadCount}
            icon={<MessageSquare className="w-5 h-5" />}
            color="warning"
            description={`共 ${conversations.length} 个会话`}
          />
          <StatsCard
            title="当前在住"
            value={activeBookings.length}
            icon={<Users className="w-5 h-5" />}
            color="success"
            description={`即将入住 ${upcomingBookings.length} 单`}
          />
          <StatsCard
            title="自动回复率"
            value={`${Math.round(autoReplyRate * 100)}%`}
            icon={<Zap className="w-5 h-5" />}
            color="primary"
            trend={{ value: 5, isUp: true }}
          />
          <StatsCard
            title="平均响应"
            value={formatResponseTime(avgResponseTime)}
            icon={<Clock className="w-5 h-5" />}
            color="info"
            trend={{ value: 15, isUp: false }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>近7天消息趋势</CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                查看详情
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrend.slice(-7)}>
                    <defs>
                      <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="auto"
                      name="自动回复"
                      stroke="#1e3a5f"
                      fillOpacity={1}
                      fill="url(#colorAuto)"
                    />
                    <Area
                      type="monotone"
                      dataKey="manual"
                      name="人工回复"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorManual)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-all group"
                  >
                    <div className={`p-2 rounded-lg ${
                      action.color === 'primary' ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' :
                      action.color === 'success' ? 'bg-emerald-50 text-emerald-600' :
                      action.color === 'warning' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#1e3a5f]">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>待处理事项</CardTitle>
              <Badge variant="danger">{pendingTasks.length + pendingMessages}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingTasks.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-medium text-sm">待分配保洁任务</div>
                      <div className="text-xs text-gray-500">{pendingTasks.length} 个任务等待分配</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )}
              {inProgressTasks.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">进行中保洁</div>
                      <div className="text-xs text-gray-500">{inProgressTasks.length} 个任务进行中</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )}
              {pendingMessages > 0 && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="font-medium text-sm">待发送消息</div>
                      <div className="text-xs text-gray-500">{pendingMessages} 条定时消息待发送</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )}
              {unreadCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-sm">未读消息</div>
                      <div className="text-xs text-gray-500">{unreadCount} 条消息待回复</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              )}
              {pendingTasks.length === 0 && inProgressTasks.length === 0 && pendingMessages === 0 && unreadCount === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p>暂无待处理事项</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近会话</CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                全部
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentConversations.map(conv => {
                const property = getPropertyById(conv.propertyId);
                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Avatar size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conv.guest.name}</span>
                        <span className="text-xs text-gray-400">{formatRelative(conv.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag variant="info" size="sm">
                          {conv.channel === 'airbnb' ? 'Airbnb' :
                           conv.channel === 'ctrip' ? '携程' :
                           conv.channel === 'meituan' ? '美团' : '小红书'}
                        </Tag>
                        <span className="text-xs text-gray-500 truncate">{property?.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conv.messages[conv.messages.length - 1]?.content}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge variant="danger">{conv.unreadCount}</Badge>
                    )}
                    {conv.manualOverride && (
                      <Tag variant="warning" size="sm">人工</Tag>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>即将入住</CardTitle>
              <Badge variant="info">{upcomingBookings.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map(booking => {
                  const property = getPropertyById(booking.propertyId);
                  return (
                    <div
                      key={booking.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-[#1e3a5f] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{booking.guest.name}</span>
                        <Tag variant="info">{formatRelative(booking.checkInDate)}</Tag>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Home className="w-3 h-3" />
                        {property?.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                      </div>
                      {booking.specialNeeds.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {booking.specialNeeds.map((need, idx) => (
                            <Badge key={idx} variant="warning" title={need.description}>
                              {specialNeedIcons[need.type as SpecialNeedType]}
                              <span className="ml-1">{specialNeedLabels[need.type as SpecialNeedType]}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2" />
                  <p>暂无即将入住的订单</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>需要优化的模板</CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                全部模板
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRewritten.map(stat => {
                const template = templates.find(t => t.id === stat.templateId);
                return (
                  <div key={stat.templateId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{stat.templateName}</span>
                        <Tag variant="info" size="sm">
                          {stat.category === 'inquiry' ? '咨询回复' :
                           stat.category === 'during_stay' ? '入住中' :
                           stat.category === 'pre_checkin' ? '入住前' :
                           stat.category === 'cleaning' ? '保洁' : '其他'}
                        </Tag>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {template?.content}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-amber-600">
                        {(stat.rewriteRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-400">改写率</div>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full mt-2" rightIcon={<ArrowRight className="w-4 h-4" />}>
                优化模板
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>房源概览</CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                管理
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {properties.slice(0, 4).map(property => (
                <div
                  key={property.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <img
                    src={property.coverImage}
                    alt={property.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{property.name}</span>
                      <Tag variant={property.status === 'active' ? 'success' : 'default'} size="sm">
                        {property.status === 'active' ? '运营中' : '已下架'}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {property.channels.filter(c => c.enabled).map(channel => (
                        <Tag key={channel.id} variant="info" size="sm">
                          {channel.platform === 'airbnb' ? 'Airbnb' :
                           channel.platform === 'ctrip' ? '携程' :
                           channel.platform === 'meituan' ? '美团' : '小红书'}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
