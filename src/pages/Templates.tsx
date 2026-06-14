import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Copy,
  Trash2,
  Clock,
  Edit3,
  Eye,
  FileText,
  Zap,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  List,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useTemplateStore } from '@/store/useTemplateStore';
import type { MessageTemplate, TemplateCategory, TemplateVersion } from '@/types/template';
import { renderTemplate, highlightVariables, extractVariables } from '@/utils/template';
import { formatDateTime, formatRelative } from '@/utils/date';

const Templates: React.FC = () => {
  const {
    templates,
    categoryFilter,
    setCategoryFilter,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    restoreVersion,
    getTemplateById,
  } = useTemplateStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'inquiry' as TemplateCategory,
    content: '',
  });

  const selectedTemplate = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;

  const categoryLabels: Record<TemplateCategory, string> = {
    all: '全部模板',
    inquiry: '咨询回复',
    booking_confirm: '预订确认',
    pre_checkin: '入住前提醒',
    checkin_day: '入住当天',
    during_stay: '入住中关怀',
    pre_checkout: '退房前提醒',
    checkout_day: '退房当天',
    cleaning: '保洁相关',
  };

  const categoryColors: Record<TemplateCategory, string> = {
    all: 'primary',
    inquiry: 'info',
    booking_confirm: 'success',
    pre_checkin: 'warning',
    checkin_day: 'success',
    during_stay: 'info',
    pre_checkout: 'warning',
    checkout_day: 'danger',
    cleaning: 'default',
  } as const;

  const filteredTemplates = categoryFilter === 'all'
    ? templates
    : templates.filter(t => t.category === categoryFilter);

  const previewData: Record<string, string> = {
    '客人姓名': '张先生',
    '房源名称': '外滩景观豪华公寓',
    '地址': '上海市黄浦区中山东一路18号',
    '入住日期': '2024年6月20日',
    '退房日期': '2024年6月25日',
    '门锁密码': '8888',
    '门锁设置说明': '请在门锁上按#号键，输入密码8888，再按#号键确认',
    '最近地铁站': '2号线南京东路站步行5分钟',
    'wifi密码': 'BundView2024',
    '保洁人员': '李阿姨',
    '退房时间': '中午12:00',
    '入住时间': '下午14:00',
  };

  const getPreviewContent = (template: MessageTemplate) => {
    const variables = extractVariables(template.content);
    const missingVars = variables.filter(v => !(v in previewData));
    
    const data: Record<string, string> = {};
    variables.forEach(v => {
      data[v] = previewData[v] || `【请设置：${v}】`;
    });

    return {
      content: renderTemplate(template.content, data),
      missingVars,
      allVars: variables,
    };
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'inquiry',
      content: '',
    });
    setIsDrawerOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, formData);
    } else {
      const newId = addTemplate(formData);
      if (newId) {
        setSelectedTemplateId(newId as string);
      }
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    if (selectedTemplateId === id) {
      setSelectedTemplateId(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    const newId = addTemplate({
      name: `${template.name} (副本)`,
      category: template.category,
      content: template.content,
    });
    if (newId) {
      setSelectedTemplateId(newId as string);
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    if (!selectedTemplateId) return;
    restoreVersion(selectedTemplateId, versionId);
    setShowRestoreConfirm(false);
    setRestoreVersionId(null);
  };

  const confirmRestore = (versionId: string) => {
    setRestoreVersionId(versionId);
    setShowRestoreConfirm(true);
  };

  const rewriteRate = (template: MessageTemplate) => {
    if (template.usageCount === 0) return 0;
    return (template.rewriteCount / template.usageCount) * 100;
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">消息模板</h1>
            <p className="text-gray-500 mt-1">运营工作台 - 管理自动回复模板，支持版本追溯和效果分析</p>
          </div>
          <Button onClick={handleAddTemplate} leftIcon={<Plus className="w-4 h-4" />}>
            新建模板
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as TemplateCategory[]).map(category => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                categoryFilter === category
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[category]}
              <span className="ml-2 text-xs opacity-70">
                ({category === 'all'
                  ? templates.length
                  : templates.filter(t => t.category === category).length})
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 260px)' }}>
          <div className="w-1/2 flex flex-col gap-3 overflow-y-auto pr-2">
            {filteredTemplates.map(template => {
              const { missingVars } = getPreviewContent(template);
              const isSelected = selectedTemplateId === template.id;

              return (
                <Card
                  key={template.id}
                  hoverable
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-[#1e3a5f] border-[#1e3a5f]' : ''
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base truncate">{template.name}</CardTitle>
                          <Tag variant={categoryColors[template.category] as any} size="sm" className="shrink-0">
                            {categoryLabels[template.category]}
                          </Tag>
                          {missingVars.length > 0 && (
                            <Badge variant="warning" className="shrink-0">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {missingVars.length}个变量待设
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            使用 {template.usageCount} 次
                          </span>
                          <span className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            改写 {template.rewriteCount} 次
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelative(template.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                        isSelected ? 'translate-x-1 text-[#1e3a5f]' : ''
                      }`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap line-clamp-2">
                      {highlightVariables(template.content)}
                    </div>
                    {template.variables.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.variables.slice(0, 5).map(v => (
                          <Badge
                            key={v}
                            variant={previewData[v] ? 'primary' : 'warning'}
                            className="text-xs"
                          >
                            {v}
                            {!previewData[v] && ' ⚠'}
                          </Badge>
                        ))}
                        {template.variables.length > 5 && (
                          <Badge variant="default" className="text-xs">
                            +{template.variables.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredTemplates.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">该分类下还没有模板</p>
                  <Button onClick={handleAddTemplate} leftIcon={<Plus className="w-4 h-4" />}>
                    创建第一个模板
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="w-1/2 flex flex-col">
            {selectedTemplate ? (
              <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                        <Tag variant={categoryColors[selectedTemplate.category] as any} size="sm">
                          {categoryLabels[selectedTemplate.category]}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>使用 {selectedTemplate.usageCount} 次</span>
                        <span>改写 {selectedTemplate.rewriteCount} 次</span>
                        <span>改写率 {rewriteRate(selectedTemplate).toFixed(1)}%</span>
                        <span>更新于 {formatRelative(selectedTemplate.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyTemplate(selectedTemplate)}
                        leftIcon={<Copy className="w-4 h-4" />}
                      >
                        复制
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditTemplate(selectedTemplate)}
                        leftIcon={<Edit3 className="w-4 h-4" />}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-200">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-[#1e3a5f]"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      预览
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50">
                      <FileText className="w-4 h-4 inline mr-1" />
                      版本历史 ({selectedTemplate.versions.length})
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50">
                      <List className="w-4 h-4 inline mr-1" />
                      变量列表 ({selectedTemplate.variables.length})
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="max-w-sm mx-auto mb-6">
                    <div className="bg-[#1e3a5f] text-white px-4 py-3 rounded-t-lg text-center text-sm font-medium flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      消息预览效果
                    </div>
                    <div className="bg-white border-x border-b border-gray-200 p-4 rounded-b-lg">
                      <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {highlightVariables(getPreviewContent(selectedTemplate).content)}
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-2">
                        自动回复 · {formatDateTime(new Date())}
                      </div>
                    </div>
                  </div>

                  {getPreviewContent(selectedTemplate).missingVars.length > 0 && (
                    <Card className="mb-6 border-amber-200 bg-amber-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          缺失变量提醒
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-amber-700 mb-2">
                          以下变量在预览数据中未设置，发送时请确保已传入对应值：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {getPreviewContent(selectedTemplate).missingVars.map(v => (
                            <Badge key={v} variant="warning">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">模板变量 ({selectedTemplate.variables.length}个)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {selectedTemplate.variables.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTemplate.variables.map(v => {
                            const hasDefault = v in previewData;
                            return (
                              <div
                                key={v}
                                className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                                  hasDefault ? 'bg-emerald-50' : 'bg-amber-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {hasDefault ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                  )}
                                  <code className="font-mono">{v}</code>
                                </div>
                                <span className={`text-xs ${
                                  hasDefault ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  {hasDefault ? `示例: ${previewData[v]}` : '未设置默认值'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">该模板暂无变量</p>
                      )}
                    </CardContent>
                  </Card>

                  {selectedTemplate.versions.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          历史版本 ({selectedTemplate.versions.length}个)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {[...selectedTemplate.versions].reverse().map((version, index) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <span className="text-sm font-medium">v{selectedTemplate.versions.length - index}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatDateTime(version.createdAt)} · {version.createdBy}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmRestore(version.id)}
                                leftIcon={<RotateCcw className="w-3 h-3" />}
                              >
                                恢复
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white border border-gray-200 rounded-xl">
                <div className="text-center">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">选择左侧模板查看详情</p>
                  <p className="text-sm text-gray-400 mt-1">
                    可查看预览效果、变量列表和历史版本
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingTemplate ? '编辑模板' : '新建模板'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || !formData.content.trim()}>
              {editingTemplate ? '保存修改' : '创建模板'}
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">编辑内容</TabsTrigger>
            <TabsTrigger value="preview">实时预览</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="模板名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：咨询自动回复"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模板分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as TemplateCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                >
                  {(Object.keys(categoryLabels) as TemplateCategory[])
                    .filter(c => c !== 'all')
                    .map(cat => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模板内容
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="使用 {{变量名}} 定义变量，例如：{{客人姓名}}、{{房源名称}}"
                rows={12}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">使用说明</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-gray-600 space-y-2">
                <p>• 使用 <code className="bg-gray-100 px-1 rounded">{'{{变量名}}'}</code> 格式定义变量</p>
                <p>• 变量将在发送时自动替换为实际数据</p>
                <p>• 常用变量：客人姓名、房源名称、地址、入住日期、退房日期、门锁密码、wifi密码</p>
                <p>• 支持换行和简单的emoji表情</p>
              </CardContent>
            </Card>

            {extractVariables(formData.content).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">检测到的变量 ({extractVariables(formData.content).length}个)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(formData.content).map(v => (
                      <Badge key={v} variant="primary">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preview">
            <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
              <div className="max-w-sm mx-auto">
                <div className="bg-[#1e3a5f] text-white px-4 py-3 rounded-t-lg text-center text-sm font-medium">
                  实时预览
                </div>
                <div className="bg-white border-x border-b border-gray-200 p-4 rounded-b-lg">
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {highlightVariables(renderTemplate(formData.content, previewData))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                变量将自动替换为示例数据
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Drawer>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="确认删除"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          确定要删除模板「<span className="font-medium">{selectedTemplate?.name}</span>」吗？
          此操作不可恢复。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => selectedTemplate && handleDelete(selectedTemplate.id)}
          >
            确认删除
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        title="恢复版本"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          确定要恢复此历史版本吗？当前版本将被保存为新版本记录。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowRestoreConfirm(false)}>
            取消
          </Button>
          <Button
            onClick={() => restoreVersionId && handleRestoreVersion(restoreVersionId)}
          >
            确认恢复
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Templates;
