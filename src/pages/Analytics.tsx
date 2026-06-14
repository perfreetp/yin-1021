import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  MessageSquare,
  CheckCircle,
  Clock,
  Zap,
  Edit3,
  Home,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  ChevronRight,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/shared/StatsCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { usePropertyStore } from '@/store/usePropertyStore';

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const {
    getTemplateStats,
    getMessageStats,
    getDailyTrend,
    getResponseEfficiency,
    getPropertyHistory,
    getTopRewrittenTemplates,
    getMostUsedTemplates,
    getAutoReplyRate,
    getAverageResponseTime,
    propertyFilter,
    setPropertyFilter,
  } = useAnalyticsStore();
  const { properties } = usePropertyStore();

  const [activeTab, setActiveTab] = React.useState('overview');

  const templateStats = useMemo(() => getTemplateStats(), [getTemplateStats, propertyFilter]);
  const messageStats = useMemo(() => getMessageStats(), [getMessageStats, propertyFilter]);
  const dailyTrend = useMemo(() => getDailyTrend(30), [getDailyTrend, propertyFilter]);
  const responseEfficiency = useMemo(() => getResponseEfficiency(30), [getResponseEfficiency, propertyFilter]);
  const propertyHistory = useMemo(() => getPropertyHistory(30), [getPropertyHistory]);
  const topRewritten = useMemo(() => getTopRewrittenTemplates(10), [getTopRewrittenTemplates]);
  const mostUsed = useMemo(() => getMostUsedTemplates(5), [getMostUsedTemplates]);
  const autoReplyRate = useMemo(() => getAutoReplyRate(), [getAutoReplyRate, propertyFilter]);
  const avgResponseTime = useMemo(() => getAverageResponseTime(), [getAverageResponseTime, propertyFilter]);

  const propertyOptions = [
    { value: 'all', label: '全部房源' },
    ...properties.map(p => ({ value: p.id, label: p.name })),
  ];

  const categoryLabels: Record<string, string> = {
    inquiry: '咨询回复',
    booking_confirm: '预订确认',
    pre_checkin: '入住前提醒',
    checkin_day: '入住当天',
    during_stay: '入住中关怀',
    pre_checkout: '退房前提醒',
    checkout_day: '退房当天',
    cleaning: '保洁相关',
  };

  const COLORS = ['#1e3a5f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const messageDistributionData = [
    { name: '自动回复', value: messageStats.autoReplied, color: '#1e3a5f' },
    { name: '人工回复', value: messageStats.manualReplied, color: '#10b981' },
  ];

  const statusDistributionData = [
    { name: '已送达', value: messageStats.delivered, color: '#10b981' },
    { name: '已读', value: messageStats.read, color: '#1e3a5f' },
    { name: '发送失败', value: messageStats.failed, color: '#ef4444' },
  ];

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    return `${Math.floor(seconds / 60)}分钟${seconds % 60}秒`;
  };

  const handleViewPropertyDetail = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">效果统计</h1>
            <p className="text-gray-500 mt-1">分析沟通数据，优化模板和回复效率</p>
          </div>
          <div className="flex gap-3">
            <Dropdown
              options={propertyOptions}
              value={propertyFilter || 'all'}
              onChange={(v) => setPropertyFilter(v === 'all' ? null : v)}
              className="w-48"
            />
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              导出报告
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="总发送消息"
            value={messageStats.totalSent}
            icon={<MessageSquare className="w-5 h-5" />}
            trend={{ value: 12, isUp: true }}
            color="primary"
          />
          <StatsCard
            title="自动回复率"
            value={`${Math.round(autoReplyRate * 100)}%`}
            icon={<Zap className="w-5 h-5" />}
            trend={{ value: 5, isUp: true }}
            color="success"
          />
          <StatsCard
            title="平均响应时间"
            value={formatResponseTime(avgResponseTime)}
            icon={<Clock className="w-5 h-5" />}
            trend={{ value: 15, isUp: false }}
            color="info"
          />
          <StatsCard
            title="已读率"
            value={`${messageStats.totalSent > 0 ? Math.round((messageStats.read / messageStats.totalSent) * 100) : 0}%`}
            icon={<CheckCircle className="w-5 h-5" />}
            color="warning"
          />
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              数据概览
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              模板分析
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              房源统计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    近30天消息发送趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="auto" name="自动回复" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="manual" name="人工回复" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      回复类型分布
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={messageDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {messageDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                      {messageDistributionData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-gray-600">
                            {item.name}: {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      平均响应时间
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={responseEfficiency}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number) => [formatResponseTime(value), '响应时间']}
                          />
                          <Line
                            type="monotone"
                            dataKey="avgResponseTime"
                            name="响应时间(秒)"
                            stroke="#1e3a5f"
                            strokeWidth={2}
                            dot={{ fill: '#1e3a5f' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  消息状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="w-96 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    模板改写率排行
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topRewritten.slice(0, 10)}
                        layout="vertical"
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          dataKey="templateName"
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '改写率']}
                        />
                        <Bar
                          dataKey="rewriteRate"
                          name="改写率"
                          fill="#f59e0b"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    模板使用量排行
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mostUsed}
                        layout="vertical"
                        margin={{ left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          dataKey="templateName"
                          type="category"
                          tick={{ fontSize: 12 }}
                          width={120}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="usageCount"
                          name="使用次数"
                          fill="#1e3a5f"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>模板详细统计</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>模板名称</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>使用次数</TableHead>
                      <TableHead>改写次数</TableHead>
                      <TableHead>改写率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateStats.map(stat => (
                      <TableRow key={stat.templateId}>
                        <TableCell className="font-medium">
                          {stat.templateName}
                        </TableCell>
                        <TableCell>
                          <Tag variant="info" size="sm">
                            {categoryLabels[stat.category] || stat.category}
                          </Tag>
                        </TableCell>
                        <TableCell>{stat.usageCount}</TableCell>
                        <TableCell>{stat.rewriteCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${stat.rewriteRate * 100}%`,
                                  backgroundColor: stat.rewriteRate > 0.3 ? '#ef4444' : stat.rewriteRate > 0.1 ? '#f59e0b' : '#10b981',
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {(stat.rewriteRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  各房源近30天沟通统计
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>房源</TableHead>
                      <TableHead>会话数</TableHead>
                      <TableHead>消息数</TableHead>
                      <TableHead>自动回复率</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyHistory.map(history => (
                      <TableRow key={history.propertyId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{history.propertyName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{history.conversationCount}</TableCell>
                        <TableCell>{history.messageCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1e3a5f] rounded-full"
                                style={{ width: `${history.autoReplyRate * 100}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {(history.autoReplyRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPropertyDetail(history.propertyId)}
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                          >
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  各房源会话数对比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="propertyName"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="conversationCount"
                        name="会话数"
                        fill="#1e3a5f"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="messageCount"
                        name="消息数"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  各房源自动回复率对比
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyHistory} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        domain={[0, 1]}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      />
                      <YAxis
                        dataKey="propertyName"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '自动回复率']}
                      />
                      <Bar
                        dataKey="autoReplyRate"
                        name="自动回复率"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Analytics;
