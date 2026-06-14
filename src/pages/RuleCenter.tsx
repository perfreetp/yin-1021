import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  X,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  Send,
  CheckCircle2,
  Info,
  BarChart3,
  Eye,
  ArrowLeftRight,
  Gauge,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { useRuleStore } from '@/store/useRuleStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useTemplateStore } from '@/store/useTemplateStore';
import type { AutoReplyRule, RuleConditions, ObservationMetric } from '@/types/rule';
import type { StayStage } from '@/types/conversation';
import { formatDateTime } from '@/utils/date';

const stageOptions = [
  { value: 'inquiry', label: '咨询中' },
  { value: 'pre_checkin', label: '入住前' },
  { value: 'during_stay', label: '入住中' },
  { value: 'post_checkout', label: '退房后' },
];

const channelOptions = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'ctrip', label: '携程' },
  { value: 'meituan', label: '美团' },
  { value: 'xiaohongshu', label: '小红书' },
];

const nightTimeOptions = [
  { value: 'any', label: '不限' },
  { value: 'night', label: '仅深夜' },
  { value: 'day', label: '仅白天' },
];

const RuleCenter: React.FC = () => {
  const { rules, addRule, updateRule, deleteRule, toggleRule, getRuleComparison } = useRuleStore();
  const { properties } = usePropertyStore();
  const { templates } = useTemplateStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonRuleIds, setComparisonRuleIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 50,
    channels: [] as string[],
    propertyIds: [] as string[],
    stayStages: [] as StayStage[],
    isNightTime: null as boolean | null,
    templateId: '',
    templateName: '',
    hitExplanation: '',
    observationMetrics: [] as ObservationMetric[],
    comparisonRuleIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 50,
      channels: [],
      propertyIds: [],
      stayStages: [],
      isNightTime: null,
      templateId: '',
      templateName: '',
      hitExplanation: '',
      observationMetrics: ['deliveryRate', 'readRate'],
      comparisonRuleIds: [],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingRule(null);
    setShowCreateModal(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    const template = templates.find(t => t.id === rule.action.templateId);
    setFormData({
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      channels: [...rule.conditions.channels],
      propertyIds: [...rule.conditions.propertyIds],
      stayStages: [...rule.conditions.stayStages],
      isNightTime: rule.conditions.isNightTime,
      templateId: rule.action.templateId,
      templateName: template?.name || rule.action.templateName || '',
      hitExplanation: rule.hitExplanation,
      observationMetrics: rule.observationTarget?.metrics || ['deliveryRate', 'readRate'],
      comparisonRuleIds: rule.observationTarget?.comparisonRuleIds || [],
    });
    setShowCreateModal(true);
  };

  const metricOptions = [
    { value: 'deliveryRate', label: '送达率' },
    { value: 'readRate', label: '已读率' },
    { value: 'followUpRate', label: '追问率' },
    { value: 'responseTime', label: '平均响应' },
  ];

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setFormData(prev => ({
      ...prev,
      templateId,
      templateName: template?.name || '',
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.templateId) return;

    const conditions: RuleConditions = {
      channels: formData.channels,
      propertyIds: formData.propertyIds,
      stayStages: formData.stayStages,
      isNightTime: formData.isNightTime,
      hasUnreadMessages: null,
    };

    const action = {
      type: 'send_template' as const,
      templateId: formData.templateId,
      templateName: formData.templateName || templates.find(t => t.id === formData.templateId)?.name,
    };

    const observationTarget = {
      metrics: (formData.observationMetrics.length > 0 ? formData.observationMetrics : ['deliveryRate', 'readRate']) as ObservationMetric[],
      comparisonRuleIds: formData.comparisonRuleIds,
    };

    if (editingRule) {
      updateRule(editingRule.id, {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        conditions,
        action,
        hitExplanation: formData.hitExplanation,
        observationTarget,
      });
    } else {
      addRule({
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        enabled: true,
        conditions,
        action,
        hitExplanation: formData.hitExplanation,
        observationTarget,
        performance: [],
      });
    }

    setShowCreateModal(false);
    resetForm();
    setEditingRule(null);
  };

  const handleOpenComparison = (ruleId: string) => {
    const rule = getRuleById(ruleId);
    const compareIds = rule?.observationTarget?.comparisonRuleIds || [];
    setComparisonRuleIds([ruleId, ...compareIds].filter(Boolean));
    setShowComparisonModal(true);
  };

  const getRuleById = (id: string) => rules.find(r => r.id === id);

  const comparisonData = useMemo(() => {
    if (comparisonRuleIds.length === 0) return [];
    return getRuleComparison(comparisonRuleIds);
  }, [comparisonRuleIds, getRuleComparison]);

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  const priorityBadge = (priority: number) => {
    if (priority >= 90) return <Badge variant="danger">P{priority} 最高</Badge>;
    if (priority >= 80) return <Badge variant="warning">P{priority} 高</Badge>;
    if (priority >= 70) return <Badge variant="info">P{priority} 中</Badge>;
    return <Badge variant="default">P{priority} 低</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">规则中心</h1>
            <p className="text-gray-500 mt-1">配置智能回复规则，按优先级匹配最佳话术，支持效果对比</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              leftIcon={<ArrowLeftRight className="w-4 h-4" />}
              onClick={() => {
                setComparisonRuleIds(rules.slice(0, 2).map(r => r.id));
                setShowComparisonModal(true);
              }}
            >
              规则对比
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
              新建规则
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] text-white">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/70">总规则数</p>
                  <p className="text-2xl font-bold">{rules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已启用</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.filter(r => r.enabled).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">累计命中</p>
                  <p className="text-2xl font-bold text-gray-900">{rules.reduce((s, r) => s + r.hitCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-gray-400" />
              规则列表（按优先级从高到低排列）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {sortedRules.map(rule => {
                const isExpanded = expandedRuleId === rule.id;
                return (
                  <div key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <div className="p-4 flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-gray-300 cursor-grab" />
                      <div className="w-8 h-8 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4 text-[#1e3a5f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{rule.name}</span>
                          {priorityBadge(rule.priority)}
                          {!rule.enabled && <Tag variant="default" size="sm">已停用</Tag>}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{rule.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {rule.conditions.channels.length > 0 && (
                            <Tag variant="info" size="sm">
                              渠道: {rule.conditions.channels.map(c => {
                                const opt = channelOptions.find(o => o.value === c);
                                return opt?.label || c;
                              }).join('/')}
                            </Tag>
                          )}
                          {rule.conditions.propertyIds.length > 0 && (
                            <Tag variant="success" size="sm">
                              房源: {rule.conditions.propertyIds.map(id => {
                                const p = properties.find(pp => pp.id === id);
                                return p?.name || id;
                              }).slice(0, 2).join('/')}{rule.conditions.propertyIds.length > 2 ? `...(+${rule.conditions.propertyIds.length - 2})` : ''}
                            </Tag>
                          )}
                          {rule.conditions.stayStages.length > 0 && (
                            <Tag variant="warning" size="sm">
                              阶段: {rule.conditions.stayStages.map(s => {
                                const opt = stageOptions.find(o => o.value === s);
                                return opt?.label || s;
                              }).join('/')}
                            </Tag>
                          )}
                          {rule.conditions.isNightTime === true && (
                            <Tag variant="default" size="sm">仅深夜</Tag>
                          )}
                          {rule.conditions.isNightTime === false && (
                            <Tag variant="default" size="sm">仅白天</Tag>
                          )}
                          {rule.conditions.channels.length === 0 &&
                           rule.conditions.propertyIds.length === 0 &&
                           rule.conditions.stayStages.length === 0 &&
                           rule.conditions.isNightTime === null && (
                            <Tag variant="default" size="sm">通用规则</Tag>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-gray-400 mb-1">命中 {rule.hitCount} 次</div>
                        <div className="text-xs text-gray-400">{formatDateTime(rule.updatedAt)}</div>
                      </div>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {rule.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1e3a5f] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确定删除规则「${rule.name}」吗？`)) {
                              deleteRule(rule.id);
                            }
                          }}
                          className="p-2 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pl-20">
                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">命中说明</p>
                              <p className="text-sm text-gray-600">{rule.hitExplanation || '暂无说明'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Send className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">触发动作</p>
                              <p className="text-sm text-gray-600">
                                发送模板：
                                <span className="font-medium">
                                  {rule.action.templateName || templates.find(t => t.id === rule.action.templateId)?.name || rule.action.templateId}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Eye className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">观察目标</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<ArrowLeftRight className="w-3 h-3" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenComparison(rule.id);
                                  }}
                                >
                                  效果对比
                                </Button>
                              </div>
                              {rule.observationTarget?.metrics && rule.observationTarget.metrics.length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                  {rule.observationTarget.metrics.map(metric => {
                                    const latestPerf = rule.performance?.[rule.performance.length - 1];
                                    const metricLabels: Record<string, string> = {
                                      deliveryRate: '送达率',
                                      readRate: '已读率',
                                      followUpRate: '追问率',
                                      responseTime: '平均响应',
                                    };
                                    const value = latestPerf ? (
                                      metric === 'responseTime'
                                        ? `${latestPerf[metric]}s`
                                        : `${(latestPerf[metric] * 100).toFixed(1)}%`
                                    ) : '--';
                                    return (
                                      <div key={metric} className="bg-white p-2 rounded border border-gray-200">
                                        <div className="text-xs text-gray-500">{metricLabels[metric]}</div>
                                        <div className="text-base font-semibold text-[#1e3a5f]">{value}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">暂无观察目标</p>
                              )}
                              {rule.observationTarget?.comparisonRuleIds && rule.observationTarget.comparisonRuleIds.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-500 mb-1">对比规则</p>
                                  <div className="flex flex-wrap gap-1">
                                    {rule.observationTarget.comparisonRuleIds.map(rid => {
                                      const r = getRuleById(rid);
                                      return r ? (
                                        <Tag key={rid} size="sm" variant="default">
                                          {r.name}
                                        </Tag>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingRule(null);
            resetForm();
          }}
          title={editingRule ? '编辑规则' : '新建规则'}
          size="xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：Airbnb-外滩公寓-咨询阶段"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium text-[#1e3a5f]">
                    P{formData.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">数值越大优先级越高，冲突时高者胜出</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">深夜模式</label>
                <Dropdown
                  options={nightTimeOptions}
                  value={
                    formData.isNightTime === true ? 'night' :
                    formData.isNightTime === false ? 'day' : 'any'
                  }
                  onChange={(v) => {
                    setFormData(prev => ({
                      ...prev,
                      isNightTime: v === 'night' ? true : v === 'day' ? false : null,
                    }));
                  }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">规则描述</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="描述这条规则的用途"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-800 mb-3">匹配条件（留空表示不限）</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">适用渠道</label>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map(opt => {
                      const isActive = formData.channels.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            channels: toggleArrayItem(prev.channels, opt.value),
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            isActive
                              ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">适用房源</label>
                  <div className="flex flex-wrap gap-2">
                    {properties.map(p => {
                      const isActive = formData.propertyIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            propertyIds: toggleArrayItem(prev.propertyIds, p.id),
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">入住阶段</label>
                  <div className="flex flex-wrap gap-2">
                    {stageOptions.map(opt => {
                      const isActive = formData.stayStages.includes(opt.value as StayStage);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            stayStages: toggleArrayItem(prev.stayStages, opt.value as StayStage),
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            isActive
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <p className="text-sm font-medium text-emerald-800 mb-3">触发动作</p>
              <div>
                <label className="block text-sm text-gray-700 mb-2">发送模板 *</label>
                <Dropdown
                  options={templates.map(t => ({ value: t.id, label: t.name }))}
                  value={formData.templateId}
                  onChange={handleTemplateChange}
                  placeholder="选择要发送的消息模板"
                />
                {formData.templateName && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-500">已选模板：<span className="font-medium text-gray-700">{formData.templateName}</span></p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-800">观察目标</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">关注指标</label>
                  <div className="flex flex-wrap gap-2">
                    {metricOptions.map(opt => {
                      const isActive = formData.observationMetrics.includes(opt.value as ObservationMetric);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            observationMetrics: toggleArrayItem(prev.observationMetrics, opt.value as ObservationMetric),
                          }))}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            isActive
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">选择需要重点观察的效果指标</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">对比规则</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white rounded border border-gray-200">
                    {rules.filter(r => !editingRule || r.id !== editingRule.id).map(r => {
                      const isActive = formData.comparisonRuleIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            comparisonRuleIds: toggleArrayItem(prev.comparisonRuleIds, r.id),
                          }))}
                          className={`px-3 py-1 rounded-full text-xs border transition-all ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">选择需要对比效果的其他规则（最多3条）</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">命中说明</label>
              <Textarea
                value={formData.hitExplanation}
                onChange={(e) => setFormData(prev => ({ ...prev, hitExplanation: e.target.value }))}
                placeholder="例如：匹配：Airbnb渠道 + 外滩景观公寓 + 咨询阶段"
                rows={2}
              />
              <p className="text-xs text-gray-400 mt-1">命中规则时展示给用户看的说明文字</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingRule(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || !formData.templateId}>
              保存
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={showComparisonModal}
          onClose={() => {
            setShowComparisonModal(false);
            setComparisonRuleIds([]);
          }}
          title="规则效果对比"
          size="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">选择要对比的规则（2-4条）</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded-lg">
                {rules.map(r => {
                  const isActive = comparisonRuleIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (isActive) {
                          setComparisonRuleIds(prev => prev.filter(id => id !== r.id));
                        } else if (comparisonRuleIds.length < 4) {
                          setComparisonRuleIds(prev => [...prev, r.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        isActive
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {comparisonData.length >= 2 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-600">指标</th>
                      {comparisonData.map(d => (
                        <th key={d.ruleId} className="text-center p-3 font-medium text-gray-600">
                          {d.ruleName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="p-3 text-gray-700">命中次数</td>
                      {comparisonData.map(d => {
                        const max = Math.max(...comparisonData.map(x => x.hitCount));
                        return (
                          <td key={d.ruleId} className={`text-center p-3 font-medium ${d.hitCount === max ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {d.hitCount}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">送达率</td>
                      {comparisonData.map(d => {
                        const max = Math.max(...comparisonData.map(x => x.deliveryRate));
                        return (
                          <td key={d.ruleId} className={`text-center p-3 font-medium ${d.deliveryRate === max ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {(d.deliveryRate * 100).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">已读率</td>
                      {comparisonData.map(d => {
                        const max = Math.max(...comparisonData.map(x => x.readRate));
                        return (
                          <td key={d.ruleId} className={`text-center p-3 font-medium ${d.readRate === max ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {(d.readRate * 100).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">追问率</td>
                      {comparisonData.map(d => {
                        const max = Math.max(...comparisonData.map(x => x.followUpRate));
                        return (
                          <td key={d.ruleId} className={`text-center p-3 font-medium ${d.followUpRate === max ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {(d.followUpRate * 100).toFixed(1)}%
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 text-gray-700">平均响应</td>
                      {comparisonData.map(d => {
                        const min = Math.min(...comparisonData.map(x => x.avgResponseTime));
                        return (
                          <td key={d.ruleId} className={`text-center p-3 font-medium ${d.avgResponseTime === min ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {d.avgResponseTime}s
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {comparisonData.length < 2 && (
              <div className="p-8 text-center text-gray-500">
                <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>请至少选择2条规则进行对比</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setShowComparisonModal(false);
                setComparisonRuleIds([]);
              }}
            >
              关闭
            </Button>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default RuleCenter;
