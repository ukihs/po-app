import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { subscribeAuthAndRole, setAuthCookie } from '../lib/auth';
import type { User } from 'firebase/auth';
import type { UserRole } from '../types';
import { STORAGE_KEYS } from '../lib/constants';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  unsubscribe: (() => void) | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => void;
  cleanup: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    unsubscribe: null,
    setUser: (user) => {
      set({ 
        user, 
        isAuthenticated: !!user 
      });
      
      if (user) {
        sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email || '');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      }
    },

    setRole: (role) => {
      set({ role });
      
      if (role) {
        sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      }
    },

    setLoading: (isLoading) => set({ isLoading }),

    initialize: () => {
      const { unsubscribe } = get();
      
      if (unsubscribe) {
        unsubscribe();
      }

      const savedRole = sessionStorage.getItem(STORAGE_KEYS.USER_ROLE);
      const savedUserData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (savedRole && savedUserData) {
        try {
          const user = JSON.parse(savedUserData);
          set({ 
            user, 
            role: savedRole as UserRole, 
            isLoading: false,
            isAuthenticated: true 
          });
        } catch (error) {
          console.error('Failed to parse saved user data:', error);
          sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
          sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }
      }

      const newUnsubscribe = subscribeAuthAndRole(async (authUser, userRole) => {
        try {
          set({
            user: authUser,
            role: userRole,
            isLoading: false,
            isAuthenticated: !!authUser
          });

          if (userRole && authUser) {
            await setAuthCookie();
            sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
            sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, authUser.email || '');
            sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authUser));
          } else {
            sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
            sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
          }

          if (!authUser && !['/login'].includes(window.location.pathname)) {
            // ใช้ Astro Transitions แทน window.location.href
            import('astro:transitions/client')
              .then(({ navigate }) => navigate('/login'))
              .catch(() => {
                window.location.href = '/login';
              });
          }
        } catch (error) {
          console.error('Auth state error:', error);
          set({ isLoading: false });
        }
      });

      set({ unsubscribe: newUnsubscribe });
    },

    logout: () => {
      set({ 
        user: null, 
        role: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      
      sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    },

    cleanup: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    }
  }))
);

export const useUser = () => useAuthStore((state) => state.user);
export const useRole = () => useAuthStore((state) => state.role);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

export const useHasRole = (requiredRoles: UserRole | UserRole[]): boolean => {
  const role = useRole();
  if (!role) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(role);
};

export const useIsBuyer = () => useHasRole('buyer');
export const useIsSupervisor = () => useHasRole('supervisor');
export const useIsProcurement = () => useHasRole('procurement');
export const useIsSuperadmin = () => useHasRole('superadmin');
export const useIsStaff = () => useHasRole(['supervisor', 'procurement', 'superadmin']);
export const useCanManageOrders = () => useHasRole(['supervisor', 'procurement', 'superadmin']);