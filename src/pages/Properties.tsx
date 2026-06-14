import React, { useState } from 'react';
import { Plus, Building2, Wifi, Key, Car, Calendar, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PropertyCard } from '@/components/shared/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Tag } from '@/components/ui/Tag';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { usePropertyStore } from '@/store/usePropertyStore';
import type { Property, Channel, HolidayRule } from '@/types/property';
import { formatDate } from '@/utils/date';

const Properties: React.FC = () => {
  const { properties, addProperty, updateProperty, togglePropertyStatus } = usePropertyStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    address: '',
    coverImage: '',
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    wifiPassword: '',
    status: 'active',
    channels: [
      { id: 'c1', platform: 'airbnb', enabled: false, nightModeEnabled: true },
      { id: 'c2', platform: 'ctrip', enabled: false, nightModeEnabled: true },
      { id: 'c3', platform: 'meituan', enabled: false, nightModeEnabled: true },
      { id: 'c4', platform: 'xiaohongshu', enabled: false, nightModeEnabled: true },
    ],
    doorLock: {
      type: 'smart',
      password: '',
      instructions: '',
    },
    transportInfo: {
      nearestSubway: '',
      airportTransfer: '',
      parkingInfo: '',
    },
    holidayRules: [],
  });

  const channelLabels: Record<string, string> = {
    airbnb: 'Airbnb',
    ctrip: '携程',
    meituan: '美团',
    xiaohongshu: '小红书',
  };

  const lockTypeLabels: Record<string, string> = {
    smart: '智能门锁',
    keybox: '密码盒',
    manual: '人工送钥匙',
  };

  const handleAddProperty = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      coverImage: '',
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      wifiPassword: '',
      status: 'active',
      channels: [
        { id: 'c1', platform: 'airbnb', enabled: false, nightModeEnabled: true },
        { id: 'c2', platform: 'ctrip', enabled: false, nightModeEnabled: true },
        { id: 'c3', platform: 'meituan', enabled: false, nightModeEnabled: true },
        { id: 'c4', platform: 'xiaohongshu', enabled: false, nightModeEnabled: true },
      ],
      doorLock: {
        type: 'smart',
        password: '',
        instructions: '',
      },
      transportInfo: {
        nearestSubway: '',
        airportTransfer: '',
        parkingInfo: '',
      },
      holidayRules: [],
    });
    setActiveTab('basic');
    setIsDrawerOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setFormData(property);
    setActiveTab('basic');
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (editingProperty) {
      updateProperty(editingProperty.id, formData);
    } else {
      addProperty(formData as Omit<Property, 'id'>);
    }
    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    togglePropertyStatus(id);
  };

  const updateChannel = (channelId: string, updates: Partial<Channel>) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels?.map(c =>
        c.id === channelId ? { ...c, ...updates } : c
      ),
    }));
  };

  const addHolidayRule = () => {
    const newRule: HolidayRule = {
      id: `h${Date.now()}`,
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      priority: 1,
      cleaningTimeAdjustment: 0,
    };
    setFormData(prev => ({
      ...prev,
      holidayRules: [...(prev.holidayRules || []), newRule],
    }));
  };

  const updateHolidayRule = (ruleId: string, updates: Partial<HolidayRule>) => {
    setFormData(prev => ({
      ...prev,
      holidayRules: prev.holidayRules?.map(r =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    }));
  };

  const deleteHolidayRule = (ruleId: string) => {
    setFormData(prev => ({
      ...prev,
      holidayRules: prev.holidayRules?.filter(r => r.id !== ruleId),
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">房源规则</h1>
            <p className="text-gray-500 mt-1">管理您的房源信息、渠道配置和节假日规则</p>
          </div>
          <Button onClick={handleAddProperty} leftIcon={<Plus className="w-4 h-4" />}>
            添加房源
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => handleEditProperty(property)}
              onToggleStatus={() => handleToggleStatus(property.id)}
            />
          ))}
        </div>

        {properties.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">还没有添加任何房源</p>
              <Button onClick={handleAddProperty} leftIcon={<Plus className="w-4 h-4" />}>
                添加第一个房源
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingProperty ? '编辑房源' : '添加房源'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingProperty ? '保存修改' : '添加房源'}
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="channels">渠道配置</TabsTrigger>
            <TabsTrigger value="lock">门锁信息</TabsTrigger>
            <TabsTrigger value="transport">交通信息</TabsTrigger>
            <TabsTrigger value="holidays">节假日规则</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="房源名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：外滩景观豪华公寓"
              />
              <Input
                label="可住人数"
                type="number"
                value={formData.maxGuests}
                onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: parseInt(e.target.value) }))}
              />
            </div>
            <Input
              label="详细地址"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="例如：上海市黄浦区中山东一路18号"
            />
            <Input
              label="封面图片URL"
              value={formData.coverImage}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
              placeholder="输入图片链接"
            />
            {formData.coverImage && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={formData.coverImage}
                  alt="预览"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="卧室数量"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
              />
              <Input
                label="卫生间数量"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) }))}
              />
              <Input
                label="WiFi密码"
                leftIcon={<Wifi className="w-4 h-4" />}
                value={formData.wifiPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, wifiPassword: e.target.value }))}
                placeholder="WiFi密码"
              />
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>渠道配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.channels?.map(channel => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Tag variant="info">{channelLabels[channel.platform]}</Tag>
                      <span className="text-gray-600">开启后将自动接收该渠道的咨询消息</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">深夜模式</span>
                        <Switch
                          checked={channel.nightModeEnabled}
                          onChange={(e) => updateChannel(channel.id, { nightModeEnabled: e.target.checked })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">启用</span>
                        <Switch
                          checked={channel.enabled}
                          onChange={(e) => updateChannel(channel.id, { enabled: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  门锁信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {(['smart', 'keybox', 'manual'] as const).map(type => (
                    <div
                      key={type}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.doorLock?.type === type
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        doorLock: { ...prev.doorLock!, type },
                      }))}
                    >
                      <div className="font-medium text-gray-900">{lockTypeLabels[type]}</div>
                    </div>
                  ))}
                </div>
                <Input
                  label="门锁密码"
                  value={formData.doorLock?.password}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    doorLock: { ...prev.doorLock!, password: e.target.value },
                  }))}
                  placeholder="例如：8888"
                />
                <Textarea
                  label="开门说明"
                  value={formData.doorLock?.instructions}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    doorLock: { ...prev.doorLock!, instructions: e.target.value },
                  }))}
                  placeholder="详细的开门步骤说明，将自动发送给入住客人"
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  交通信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="最近地铁站"
                  value={formData.transportInfo?.nearestSubway}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    transportInfo: { ...prev.transportInfo!, nearestSubway: e.target.value },
                  }))}
                  placeholder="例如：距离2号线南京东路站步行5分钟"
                />
                <Input
                  label="机场交通"
                  value={formData.transportInfo?.airportTransfer}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    transportInfo: { ...prev.transportInfo!, airportTransfer: e.target.value },
                  }))}
                  placeholder="例如：浦东机场打车约45分钟"
                />
                <Input
                  label="停车信息"
                  value={formData.transportInfo?.parkingInfo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    transportInfo: { ...prev.transportInfo!, parkingInfo: e.target.value },
                  }))}
                  placeholder="例如：小区地下车库，车位号B1-088"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                节假日规则
              </h3>
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addHolidayRule}>
                添加规则
              </Button>
            </div>

            {formData.holidayRules && formData.holidayRules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>节假日名称</TableHead>
                    <TableHead>开始日期</TableHead>
                    <TableHead>结束日期</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>保洁时间调整(小时)</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.holidayRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateHolidayRule(rule.id, { name: e.target.value })}
                          placeholder="例如：春节特别规则"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={formatDate(rule.startDate)}
                          onChange={(e) => updateHolidayRule(rule.id, { startDate: new Date(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={formatDate(rule.endDate)}
                          onChange={(e) => updateHolidayRule(rule.id, { endDate: new Date(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={rule.priority}
                          onChange={(e) => updateHolidayRule(rule.id, { priority: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={rule.cleaningTimeAdjustment}
                          onChange={(e) => updateHolidayRule(rule.id, { cleaningTimeAdjustment: parseInt(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHolidayRule(rule.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">还没有添加节假日规则</p>
                  <p className="text-sm text-gray-400 mt-1">节假日期间可设置特殊的消息模板和保洁时间</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Drawer>
    </MainLayout>
  );
};

export default Properties;
