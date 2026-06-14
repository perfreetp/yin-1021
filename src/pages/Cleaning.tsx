import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Play,
  Plus,
  Phone,
  Star,
  Home,
  Calendar,
  Image,
  FileText,
  User,
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
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { useCleaningStore } from '@/store/useCleaningStore';
import { usePropertyStore } from '@/store/usePropertyStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { CleaningTask, Cleaner, CleaningTaskStatus } from '@/types/cleaning';
import { formatDate, formatDateTime, formatRelative } from '@/utils/date';

const Cleaning: React.FC = () => {
  const {
    tasks,
    cleaners,
    updateTaskStatus,
    assignCleaner,
    addCleaner,
    toggleCleanerStatus,
    getTasksByStatus,
  } = useCleaningStore();
  const { getPropertyById } = usePropertyStore();
  const { getBookingById } = useScheduleStore();

  const [activeTab, setActiveTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddCleanerModal, setShowAddCleanerModal] = useState(false);
  const [newCleanerName, setNewCleanerName] = useState('');
  const [newCleanerPhone, setNewCleanerPhone] = useState('');
  const [selectedCleanerId, setSelectedCleanerId] = useState('');

  const statusColors: Record<CleaningTaskStatus, string> = {
    pending: 'warning',
    assigned: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger',
  };

  const statusLabels: Record<CleaningTaskStatus, string> = {
    pending: '待分配',
    assigned: '已分配',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  const statusIcons: Record<CleaningTaskStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4" />,
    assigned: <UserCheck className="w-4 h-4" />,
    in_progress: <Play className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    cancelled: <AlertCircle className="w-4 h-4" />,
  };

  const pendingTasks = getTasksByStatus('pending');
  const assignedTasks = getTasksByStatus('assigned');
  const inProgressTasks = getTasksByStatus('in_progress');
  const completedTasks = getTasksByStatus('completed');

  const activeCleaners = cleaners.filter(c => c.active);
  const inactiveCleaners = cleaners.filter(c => !c.active);

  const getCleanerById = (id: string) => cleaners.find(c => c.id === id);

  const handleAssignCleaner = () => {
    if (!selectedTask || !selectedCleanerId) return;
    assignCleaner(selectedTask.id, selectedCleanerId);
    setShowAssignModal(false);
    setSelectedCleanerId('');
  };

  const handleAddCleaner = () => {
    if (!newCleanerName.trim() || !newCleanerPhone.trim()) return;
    addCleaner({
      name: newCleanerName,
      phone: newCleanerPhone,
      active: true,
    });
    setShowAddCleanerModal(false);
    setNewCleanerName('');
    setNewCleanerPhone('');
  };

  const handleStartTask = (taskId: string) => {
    updateTaskStatus(taskId, 'in_progress');
  };

  const handleCompleteTask = (taskId: string) => {
    updateTaskStatus(taskId, 'completed');
  };

  const cleanerOptions = activeCleaners.map(c => ({
    value: c.id,
    label: `${c.name} (评分: ${c.rating})`,
  }));

  const TaskCard: React.FC<{ task: CleaningTask }> = ({ task }) => {
    const property = getPropertyById(task.propertyId);
    const cleaner = task.cleanerId ? getCleanerById(task.cleanerId) : null;
    const booking = task.bookingId ? getBookingById(task.bookingId) : null;

    return (
      <Card
        className="mb-3 cursor-pointer hover:border-[#1e3a5f] transition-colors"
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {statusIcons[task.status]}
              <Tag variant={statusColors[task.status] as any} size="sm">
                {statusLabels[task.status]}
              </Tag>
            </div>
            <span className="text-xs text-gray-400">
              {formatRelative(task.scheduledAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-sm">{property?.name}</span>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatDate(task.scheduledAt)} 13:00
          </div>

          {task.specialRequirements.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.specialRequirements.map((req, idx) => (
                <Badge key={idx} variant="warning" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          )}

          {cleaner && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Avatar size="xs" fallback={<User className="w-3 h-3" />} />
              <span className="text-xs text-gray-600">{cleaner.name}</span>
            </div>
          )}

          {booking && (
            <div className="text-xs text-gray-400 mt-2">
              客人: {booking.guest.name}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn: React.FC<{
    title: string;
    tasks: CleaningTask[];
    status: CleaningTaskStatus;
    color: string;
  }> = ({ title, tasks, status, color }) => (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant={statusColors[status] as any}>{tasks.length}</Badge>
        </div>
        {status === 'pending' && (
          <Button size="sm" variant="ghost" leftIcon={<Plus className="w-4 h-4" />}>
            添加
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">保洁协同</h1>
            <p className="text-gray-500 mt-1">管理保洁任务分配和进度跟踪</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddCleanerModal(true)}
            >
              添加保洁人员
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />}>
              创建保洁任务
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="待分配任务"
            value={pendingTasks.length}
            icon={<Clock className="w-5 h-5" />}
            color="warning"
          />
          <StatsCard
            title="已分配任务"
            value={assignedTasks.length}
            icon={<UserCheck className="w-5 h-5" />}
            color="info"
          />
          <StatsCard
            title="进行中"
            value={inProgressTasks.length}
            icon={<Play className="w-5 h-5" />}
            color="primary"
          />
          <StatsCard
            title="今日完成"
            value={completedTasks.filter(t => {
              const today = new Date().toDateString();
              return t.completedAt?.toDateString() === today;
            }).length}
            icon={<CheckCircle className="w-5 h-5" />}
            color="success"
            trend={{ value: 15, isUp: true }}
          />
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              任务看板
            </TabsTrigger>
            <TabsTrigger value="cleaners" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              保洁人员
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <div className="flex gap-6 overflow-x-auto pb-4">
              <KanbanColumn
                title="待分配"
                tasks={pendingTasks}
                status="pending"
                color="amber"
              />
              <KanbanColumn
                title="已分配"
                tasks={assignedTasks}
                status="assigned"
                color="blue"
              />
              <KanbanColumn
                title="进行中"
                tasks={inProgressTasks}
                status="in_progress"
                color="indigo"
              />
              <KanbanColumn
                title="已完成"
                tasks={completedTasks.slice(0, 5)}
                status="completed"
                color="emerald"
              />
            </div>
          </TabsContent>

          <TabsContent value="cleaners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>在职保洁人员</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCleaners.map(cleaner => (
                  <Card key={cleaner.id} hoverable>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar size="lg" fallback={<User className="w-6 h-6" />} />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{cleaner.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cleaner.phone}
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{cleaner.rating}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              完成 {cleaner.taskCount} 单
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">在岗</span>
                              <Switch
                                checked={cleaner.active}
                                onChange={() => toggleCleanerStatus(cleaner.id)}
                              />
                            </div>
                            <Button size="sm" variant="outline">
                              查看详情
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {inactiveCleaners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-500">已离职/休假</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveCleaners.map(cleaner => (
                    <Card key={cleaner.id} className="opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar size="lg" fallback={<User className="w-6 h-6" />} />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{cleaner.name}</div>
                            <div className="text-sm text-gray-500">{cleaner.phone}</div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">在岗</span>
                                <Switch
                                  checked={cleaner.active}
                                  onChange={() => toggleCleanerStatus(cleaner.id)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="保洁任务详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcons[selectedTask.status]}
                <Tag variant={statusColors[selectedTask.status] as any}>
                  {statusLabels[selectedTask.status]}
                </Tag>
              </div>
              <span className="text-sm text-gray-500">
                {formatDateTime(selectedTask.scheduledAt)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">房源</div>
                <div className="font-medium">
                  {getPropertyById(selectedTask.propertyId)?.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">地址</div>
                <div className="font-medium">
                  {getPropertyById(selectedTask.propertyId)?.address}
                </div>
              </div>
            </div>

            {selectedTask.cleanerId && (
              <div>
                <div className="text-sm text-gray-500 mb-2">保洁人员</div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar size="md" fallback={<User className="w-5 h-5" />} />
                  <div>
                    <div className="font-medium">
                      {getCleanerById(selectedTask.cleanerId)?.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {getCleanerById(selectedTask.cleanerId)?.phone}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTask.specialRequirements.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">特殊要求</div>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.specialRequirements.map((req, idx) => (
                    <Badge key={idx} variant="warning">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedTask.notes && (
              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  备注
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {selectedTask.notes}
                </div>
              </div>
            )}

            {selectedTask.photos.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  保洁照片
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedTask.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`保洁照片${idx + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {selectedTask.status === 'pending' && (
                <Button
                  onClick={() => {
                    setShowAssignModal(true);
                  }}
                >
                  分配保洁人员
                </Button>
              )}
              {selectedTask.status === 'assigned' && (
                <Button onClick={() => handleStartTask(selectedTask.id)}>
                  开始保洁
                </Button>
              )}
              {selectedTask.status === 'in_progress' && (
                <Button onClick={() => handleCompleteTask(selectedTask.id)}>
                  完成保洁
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                关闭
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="分配保洁人员"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择保洁人员
            </label>
            <Dropdown
              options={cleanerOptions}
              value={selectedCleanerId}
              onChange={setSelectedCleanerId}
              placeholder="请选择保洁人员"
            />
          </div>
          {selectedTask && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">任务信息</div>
              <div className="font-medium">
                {getPropertyById(selectedTask.propertyId)?.name}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(selectedTask.scheduledAt)} 13:00
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleAssignCleaner}
              disabled={!selectedCleanerId}
            >
              确认分配
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddCleanerModal}
        onClose={() => setShowAddCleanerModal(false)}
        title="添加保洁人员"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="姓名"
            value={newCleanerName}
            onChange={(e) => setNewCleanerName(e.target.value)}
            placeholder="请输入保洁人员姓名"
          />
          <Input
            label="联系电话"
            value={newCleanerPhone}
            onChange={(e) => setNewCleanerPhone(e.target.value)}
            placeholder="请输入联系电话"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddCleanerModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleAddCleaner}
              disabled={!newCleanerName.trim() || !newCleanerPhone.trim()}
            >
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Cleaning;
