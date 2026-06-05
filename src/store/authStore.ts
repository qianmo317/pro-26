import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { mockUser } from '../mock/data';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (username === 'admin' && password === 'admin123') {
          const token = 'mock-token-' + Date.now();
          set({
            user: mockUser,
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
