import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { useOrdersStore } from './ordersStore';
import { useNotificationsStore } from './notificationsStore';

interface StoreInitializerProps {
  children: React.ReactNode;
}

export function StoreInitializer({ children }: StoreInitializerProps) {
  const { user, role, isLoading, initialize: initAuth, cleanup: cleanupAuth } = useAuthStore();
  const { fetchOrders, cleanup: cleanupOrders } = useOrdersStore();
  const { fetchNotifications, cleanup: cleanupNotifications } = useNotificationsStore();

  useEffect(() => {
    initAuth();
    
    return () => {
      cleanupAuth();
    };
  }, [initAuth, cleanupAuth]);

  useEffect(() => {
    if (!user || !role || isLoading) {
      cleanupOrders();
      return;
    }

    fetchOrders(user.uid, role);
    
    return () => {
      cleanupOrders();
    };
  }, [user, role, isLoading, fetchOrders, cleanupOrders]);

  useEffect(() => {
    if (!user || !role || isLoading) {
      cleanupNotifications();
      return;
    }

    fetchNotifications(user.uid, role);
    
    return () => {
      cleanupNotifications();
    };
  }, [user, role, isLoading, fetchNotifications, cleanupNotifications]);

  return <>{children}</>;
}

export function useInitializeStores() {
  const { user, role, isLoading, initialize: initAuth } = useAuthStore();
  const { fetchOrders } = useOrdersStore();
  const { fetchNotifications } = useNotificationsStore();

  const initialize = () => {
    initAuth();
  };

  const initializeData = () => {
    if (user && role && !isLoading) {
      fetchOrders(user.uid, role);
      fetchNotifications(user.uid, role);
    }
  };

  return {
    initialize,
    initializeData,
    isReady: !isLoading && !!user && !!role
  };
}