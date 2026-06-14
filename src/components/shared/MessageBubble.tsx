import React from 'react';
import { Bot, User, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import type { Message } from '@/types/conversation';
import { formatRelative } from '@/utils/date';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showAvatar = true }) => {
  const isGuest = message.senderType === 'guest';
  const isAuto = message.senderType === 'auto';

  const StatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isGuest ? '' : 'flex-row-reverse'
    )}>
      {showAvatar && (
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isGuest ? 'bg-gray-200' : isAuto ? 'bg-blue-100' : 'bg-[#1e3a5f]'
        )}>
          {isGuest ? (
            <User className="w-4 h-4 text-gray-600" />
          ) : isAuto ? (
            <Bot className="w-4 h-4 text-blue-600" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
      )}

      <div className={cn(
        'max-w-[70%] flex flex-col',
        isGuest ? '' : 'items-end'
      )}>
        <div className={cn(
          'px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words',
          isGuest
            ? 'bg-white border border-gray-200 rounded-tl-none text-gray-700'
            : isAuto
            ? 'bg-blue-50 text-blue-800 rounded-tr-none border border-blue-100'
            : 'bg-[#1e3a5f] text-white rounded-tr-none'
        )}>
          {message.content}
        </div>

        <div className={cn(
          'flex items-center gap-1.5 mt-1 text-xs text-gray-400',
          isGuest ? '' : 'flex-row-reverse'
        )}>
          {isAuto && (
            <span className="text-blue-500 font-medium">自动回复</span>
          )}
          {message.isRewritten && (
            <span className="text-amber-500">已改写</span>
          )}
          <span>{formatRelative(message.sentAt)}</span>
          {!isGuest && <StatusIcon />}
        </div>
      </div>
    </div>
  );
};
