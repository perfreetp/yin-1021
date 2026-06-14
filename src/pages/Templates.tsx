import React, { useState } from 'react';
import { Plus, MessageSquare, Copy, Trash2, Clock, Edit3, Eye, FileText, Zap } from 'lucide-react';
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
import { formatDateTime } from '@/utils/date';

const Templates: React.FC = () => {
  const {
    templates,
    categoryFilter,
    setCategoryFilter,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplateStore();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'inquiry' as TemplateCategory,
    content: '',
  });

  const categoryLabels: Record<TemplateCategory | 'all', string> = {
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

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'inquiry',
      content: '',
    });
    setActiveTab('edit');
    setIsDrawerOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setActiveTab('edit');
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, formData);
    } else {
      addTemplate(formData);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      deleteTemplate(id);
    }
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    addTemplate({
      name: `${template.name} (副本)`,
      category: template.category,
      content: template.content,
    });
  };

  const handlePreview = () => {
    setIsPreviewModalOpen(true);
  };

  const getPreviewData = (): Record<string, string> => {
    const variables = extractVariables(formData.content);
    const data: Record<string, string> = {};
    variables.forEach(v => {
      data[v] = `[${v}]`;
    });
    return data;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">消息模板</h1>
            <p className="text-gray-500 mt-1">管理自动回复模板，支持变量替换和版本追溯</p>
          </div>
          <Button onClick={handleAddTemplate} leftIcon={<Plus className="w-4 h-4" />}>
            新建模板
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as Array<TemplateCategory | 'all'>).map(category => (
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
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.id} hoverable>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Tag variant={categoryColors[template.category] as any} size="sm">
                        {categoryLabels[template.category]}
                      </Tag>
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
                        {formatDateTime(template.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview()}
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      title="复制"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-500 hover:text-red-700"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                  {highlightVariables(template.content)}
                </div>
                {template.variables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {template.variables.map(v => (
                      <Badge key={v} variant="primary" className="text-xs">
                        {v}
                      </Badge>
                    ))}
                  </div>
                )}
                {template.versions.length > 0 && (
                  <button
                    onClick={() => setIsVersionModalOpen(true)}
                    className="mt-3 text-xs text-[#1e3a5f] hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    查看 {template.versions.length} 个历史版本
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

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
            <Button onClick={handleSave}>
              {editingTemplate ? '保存修改' : '创建模板'}
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
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
                  {(Object.keys(categoryLabels) as TemplateCategory[]).filter(c => c !== ('all' as TemplateCategory)).map(cat => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  模板内容
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  预览
                </Button>
              </div>
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
                  <CardTitle className="text-sm">检测到的变量</CardTitle>
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
                  消息预览
                </div>
                <div className="bg-white border-x border-b border-gray-200 p-4 rounded-b-lg">
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {highlightVariables(renderTemplate(formData.content, getPreviewData()))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Drawer>

      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="模板预览"
        size="lg"
      >
        <div className="max-w-md mx-auto">
          <div className="bg-[#1e3a5f] text-white px-4 py-3 rounded-t-lg text-center text-sm font-medium">
            {formData.name || '模板预览'}
          </div>
          <div className="bg-white border-x border-b border-gray-200 p-4 rounded-b-lg">
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {highlightVariables(renderTemplate(formData.content, getPreviewData()))}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          方括号中的内容 [变量名] 将在发送时自动替换为实际数据
        </div>
      </Modal>

      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title="版本历史"
        size="lg"
      >
        {editingTemplate && editingTemplate.versions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本</TableHead>
                <TableHead>修改时间</TableHead>
                <TableHead>修改人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingTemplate.versions.map((version: TemplateVersion, index: number) => (
                <TableRow key={version.id}>
                  <TableCell>v{editingTemplate!.versions.length - index}</TableCell>
                  <TableCell>{formatDateTime(version.createdAt)}</TableCell>
                  <TableCell>{version.createdBy}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, content: version.content }));
                        setIsVersionModalOpen(false);
                        setActiveTab('edit');
                      }}
                    >
                      恢复此版本
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            暂无历史版本
          </div>
        )}
      </Modal>
    </MainLayout>
  );
};

export default Templates;
