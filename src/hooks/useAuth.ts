import { useState, useEffect } from 'react';
import { subscribeAuthAndRole } from '../lib/auth';
import type { User } from 'firebase/auth';
import type { UserRole } from '../types';
import { STORAGE_KEYS } from '../lib/constants';

export interface UseAuthReturn {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRole = sessionStorage.getItem(STORAGE_KEYS.USER_ROLE);
    const savedUserData = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (savedRole && savedUserData) {
      try {
        setUser(JSON.parse(savedUserData));
        setRole(savedRole as UserRole);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
      }
    }

    const unsubscribe = subscribeAuthAndRole((authUser, userRole) => {
      try {
        setUser(authUser);
        setRole(userRole);
        setIsLoading(false);

        if (userRole && authUser) {
          sessionStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole);
          sessionStorage.setItem(STORAGE_KEYS.USER_EMAIL, authUser.email || '');
          sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authUser));
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.USER_ROLE);
          sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
          sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
        }

        if (!authUser && !['/login'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth state error:', error);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    user,
    role,
    isLoading,
    isAuthenticated: !!user
  };
}

export function useHasRole(requiredRoles: UserRole | UserRole[]): boolean {
  const { role } = useAuth();
  
  if (!role) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(role);
}

export function useIsBuyer(): boolean {
  return useHasRole('buyer');
}

export function useIsSupervisor(): boolean {
  return useHasRole('supervisor');
}

export function useIsProcurement(): boolean {
  return useHasRole('procurement');
}

export function useIsSuperadmin(): boolean {
  return useHasRole('superadmin');
}

export function useIsStaff(): boolean {
  return useHasRole(['supervisor', 'procurement', 'superadmin']);
}

export function useCanManageOrders(): boolean {
  return useHasRole(['supervisor', 'procurement', 'superadmin']);
}