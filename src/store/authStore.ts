import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { mockUser, mockManager, mockOperator } from '../mock/data';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        let user = null;
        if (username === 'admin' && password === 'admin123') {
          user = mockUser;
        } else if (username === 'manager' && password === 'manager123') {
          user = mockManager;
        } else if (username === 'operator' && password === 'operator123') {
          user = mockOperator;
        }
        
        if (user) {
          const token = 'mock-token-' + Date.now();
          set({
            user,
            token,
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
