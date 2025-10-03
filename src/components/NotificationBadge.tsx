"use client";

import { useNotifications } from '../hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const { unreadCount, loading } = useNotifications();

  if (loading) {
    return (
      <Skeleton 
        className={`h-5 w-5 rounded-full ${className}`}
      />
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