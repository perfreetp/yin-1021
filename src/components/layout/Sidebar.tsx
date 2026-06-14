import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MessageSquareText,
  MessageCircle,
  Calendar,
  Sparkles,
  BarChart3,
  MessageSquare,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversationStore } from '@/store/useConversationStore';
import { useRuleStore } from '@/store/useRuleStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const unreadCount = useConversationStore(state => state.getUnreadCount());
  const activeRuleCount = useRuleStore(state => state.rules.filter(r => r.enabled).length);

  const navItems: NavItem[] = [
    { path: '/dashboard', label: '控制台', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/properties', label: '房源规则', icon: <Building2 className="w-5 h-5" /> },
    { path: '/templates', label: '消息模板', icon: <MessageSquareText className="w-5 h-5" /> },
    { path: '/rules', label: '规则中心', icon: <Target className="w-5 h-5" />, badge: activeRuleCount },
    { path: '/conversations', label: '会话汇总', icon: <MessageCircle className="w-5 h-5" />, badge: unreadCount },
    { path: '/schedule', label: '日程触发', icon: <Calendar className="w-5 h-5" /> },
    { path: '/cleaning', label: '保洁协同', icon: <Sparkles className="w-5 h-5" /> },
    { path: '/analytics', label: '效果统计', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#1e3a5f] text-white flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">智住管家</h1>
            <p className="text-xs text-white/60">短租消息自动化</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-white/60 mb-2">今日效率</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">82%</span>
            <span className="text-xs text-emerald-400">+5%</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
