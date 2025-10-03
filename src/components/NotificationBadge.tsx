"use client";

import { useNotifications } from '../hooks/use-notifications';
import { Badge } from './ui/badge';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const { unreadCount, loading } = useNotifications();

  if (loading) {
    return (
      <Badge 
        variant="secondary" 
        size="sm" 
        shape="circle" 
        className={`animate-pulse ${className}`}
      >
        ...
      </Badge>
    );
  }

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      size="sm" 
      shape="circle" 
      className={className}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}