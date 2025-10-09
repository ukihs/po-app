export {
  useAuthStore,
  useUser,
  useRole,
  useIsLoading,
  useIsAuthenticated,
  useHasRole,
  useIsEmployee,
  useIsSupervisor,
  useIsProcurement,
  useIsAdmin,
  useHasMinRole,
  useIsStaff,
  useCanManageOrders
} from './authStore';

export {
  useOrdersStore,
  useOrders,
  useOrdersLoading,
  useOrdersError,
  useOrdersByStatus,
  useOrdersByUser,
  useOrderById,
  useOrdersStats
} from './ordersStore';

export {
  useNotificationsStore,
  useNotifications,
  useUnreadCount,
  useNotificationsLoading,
  useNotificationsError,
  useNotificationsByKind,
  useUnreadNotifications,
  useNotificationStats
} from './notificationsStore';

export {
  StoreInitializer,
  useInitializeStores
} from './store-initializer';
