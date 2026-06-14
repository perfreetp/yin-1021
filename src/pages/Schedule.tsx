import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Settings,
  History,
  Plus,
  Check,
  AlertCircle,
  SkipForward,
  Users,
  Home,
  Baby,
  Bed,
  Ban,
  PawPrint,
  Sunrise,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/shared/StatsCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useScheduleStore } from '@/store/useScheduleStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import type { Booking, TriggerRule, EventType } from '@/types/schedule';
import type { SpecialNeedType } from '@/types/conversation';
import { formatDate, formatDateTime, formatRelative } from '@/utils/date';

const Schedule: React.FC = () => {
  const { bookings, triggerRules, scheduleLogs, updateTriggerRule, toggleTriggerRule, getUpcomingBookings } = useScheduleStore();
  const { getPropertyById } = usePropertyStore();
  const { getTemplateById } = useTemplateStore();

  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const statusColors: Record<string, string> = {
    confirmed: 'info',
    checked_in: 'success',
    checked_out: 'default',
    cancelled: 'danger',
  };

  const statusLabels: Record<string, string> = {
    confirmed: '已确认',
    checked_in: '已入住',
    checked_out: '已退房',
    cancelled: '已取消',
  };

  const logStatusColors: Record<string, string> = {
    pending: 'warning',
    sent: 'success',
    skipped: 'default',
    failed: 'danger',
  };

  const logStatusLabels: Record<string, string> = {
    pending: '待发送',
    sent: '已发送',
    skipped: '已跳过',
    failed: '发送失败',
  };

  const eventTypeLabels: Record<EventType, string> = {
    booking_created: '预订创建',
    pre_checkin: '入住前',
    checkin_day: '入住当天',
    mid_stay: '入住中',
    pre_checkout: '退房前',
    checkout_day: '退房当天',
    checkout_completed: '退房完成',
  };

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

  const upcomingBookings = getUpcomingBookings(7);
  const activeBookings = bookings.filter(b => b.status === 'checked_in');
  const pendingMessages = scheduleLogs.filter(l => l.status === 'pending').length;
  const sentToday = scheduleLogs.filter(l => {
    const today = new Date().toDateString();
    return l.status === 'sent' && l.actualSentAt?.toDateString() === today;
  }).length;

  const sortedLogs = [...scheduleLogs].sort(
    (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()
  );

  const getBookingById = (id: string) => bookings.find(b => b.id === id);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">日程触发</h1>
            <p className="text-gray-500 mt-1">管理预订信息、自动消息触发规则和发送日志</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="即将入住"
            value={upcomingBookings.length}
            icon={<Calendar className="w-5 h-5" />}
            trend={{ value: 12, isUp: true }}
            color="primary"
          />
          <StatsCard
            title="当前在住"
            value={activeBookings.length}
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 2, isUp: true }}
            color="success"
          />
          <StatsCard
            title="今日已发送"
            value={sentToday}
            icon={<Check className="w-5 h-5" />}
            trend={{ value: 8, isUp: true }}
            color="info"
          />
          <StatsCard
            title="待发送消息"
            value={pendingMessages}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              预订管理
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              触发规则
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              发送日志
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>所有预订</span>
                      <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                        添加预订
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>客人</TableHead>
                          <TableHead>房源</TableHead>
                          <TableHead>入住</TableHead>
                          <TableHead>退房</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>特殊需求</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map(booking => {
                          const property = getPropertyById(booking.propertyId);
                          return (
                            <TableRow
                              key={booking.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <TableCell>
                                <div className="font-medium">{booking.guest.name}</div>
                                <div className="text-xs text-gray-500">{booking.guest.phone}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Home className="w-4 h-4 text-gray-400" />
                                  {property?.name}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                              <TableCell>{formatDate(booking.checkOutDate)}</TableCell>
                              <TableCell>
                                <Tag variant={statusColors[booking.status] as any}>
                                  {statusLabels[booking.status]}
                                </Tag>
                              </TableCell>
                              <TableCell>
                                {booking.specialNeeds.length > 0 ? (
                                  <div className="flex gap-1">
                                    {booking.specialNeeds.map((need, idx) => (
                                      <Badge key={idx} variant="warning" title={need.description}>
                                        {specialNeedIcons[need.type as SpecialNeedType]}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>未来7天入住</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingBookings.length > 0 ? (
                      upcomingBookings.map(booking => {
                        const property = getPropertyById(booking.propertyId);
                        return (
                          <div
                            key={booking.id}
                            className="p-3 border border-gray-200 rounded-lg hover:border-[#1e3a5f] cursor-pointer transition-colors"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{booking.guest.name}</span>
                              <Tag variant="info">{formatRelative(booking.checkInDate)}</Tag>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Home className="w-3 h-3" />
                              {property?.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                            </div>
                            {booking.specialNeeds.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {booking.specialNeeds.map((need, idx) => (
                                  <Tag key={idx} variant="warning" size="sm">
                                    {specialNeedLabels[need.type as SpecialNeedType]}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        未来7天暂无入住
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedBooking && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>预订详情</span>
                        <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                          ×
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">客人信息</div>
                        <div className="font-medium">{selectedBooking.guest.name}</div>
                        <div className="text-sm text-gray-500">{selectedBooking.guest.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">房源</div>
                        <div className="font-medium">
                          {getPropertyById(selectedBooking.propertyId)?.name}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">入住日期</div>
                          <div className="font-medium">{formatDate(selectedBooking.checkInDate)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">退房日期</div>
                          <div className="font-medium">{formatDate(selectedBooking.checkOutDate)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-2">特殊需求</div>
                        {selectedBooking.specialNeeds.length > 0 ? (
                          <div className="space-y-2">
                            {selectedBooking.specialNeeds.map((need, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                                {specialNeedIcons[need.type as SpecialNeedType]}
                                <span className="text-sm">
                                  {specialNeedLabels[need.type as SpecialNeedType]}: {need.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">无特殊需求</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-2">消息发送记录</div>
                        <div className="space-y-2">
                          {scheduleLogs
                            .filter(l => l.bookingId === selectedBooking.id)
                            .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                            .map(log => {
                              const template = getTemplateById(log.templateId);
                              return (
                                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    {log.status === 'sent' && <Check className="w-4 h-4 text-green-500" />}
                                    {log.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                                    {log.status === 'skipped' && <SkipForward className="w-4 h-4 text-gray-400" />}
                                    {log.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                    <span className="text-sm">{template?.name || eventTypeLabels[log.triggerType as EventType]}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {log.actualSentAt ? formatRelative(log.actualSentAt) : formatRelative(log.scheduledAt)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>触发规则配置</span>
                  <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    新建规则
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {triggerRules.map(rule => {
                  const template = getTemplateById(rule.templateId);
                  return (
                    <div
                      key={rule.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#1e3a5f] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={rule.enabled}
                            onChange={() => toggleTriggerRule(rule.id)}
                          />
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-gray-500">
                              {eventTypeLabels[rule.eventType]} · {template?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag variant="info" size="sm">
                            {rule.offsetHours > 0
                              ? `${rule.offsetHours}小时后`
                              : rule.offsetHours < 0
                              ? `${Math.abs(rule.offsetHours)}小时前`
                              : '立即'}
                          </Tag>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
                        </div>
                      </div>
                      <div className="ml-11">
                        <div className="text-xs text-gray-400 mb-2">模板预览</div>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">
                          {template?.content}
                        </div>
                        {rule.propertyIds.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            适用房源：{rule.propertyIds.map(id => getPropertyById(id)?.name).join('、')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>消息发送日志</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>触发类型</TableHead>
                      <TableHead>客人</TableHead>
                      <TableHead>模板</TableHead>
                      <TableHead>计划发送时间</TableHead>
                      <TableHead>实际发送时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map(log => {
                      const booking = getBookingById(log.bookingId);
                      const template = getTemplateById(log.templateId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Tag variant="info" size="sm">
                              {eventTypeLabels[log.triggerType as EventType]}
                            </Tag>
                          </TableCell>
                          <TableCell>{booking?.guest.name}</TableCell>
                          <TableCell>{template?.name}</TableCell>
                          <TableCell>{formatDateTime(log.scheduledAt)}</TableCell>
                          <TableCell>
                            {log.actualSentAt ? formatDateTime(log.actualSentAt) : '-'}
                          </TableCell>
                          <TableCell>
                            <Tag variant={logStatusColors[log.status] as any}>
                              {logStatusLabels[log.status]}
                            </Tag>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {log.skipReason || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Schedule;
