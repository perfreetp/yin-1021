import React from 'react';
import { Search, Bell, Settings, User, Moon } from 'lucide-react';
import { useNightMode } from '@/hooks/useNightMode';
import { Tag } from '@/components/ui/Tag';

export const Header: React.FC = () => {
  const { isNightTime } = useNightMode();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索房源、客人、消息..."
            className="pl-10 pr-4 py-2 w-80 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] transition-all"
          />
        </div>
        {isNightTime && (
          <Tag variant="warning" size="sm" className="animate-pulse">
            <Moon className="w-3 h-3 mr-1" />
            深夜模式
          </Tag>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">房东管理员</p>
            <p className="text-xs text-gray-500">admin@zhizhu.com</p>
          </div>
          <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
