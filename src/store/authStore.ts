import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { mockUser, mockManager, mockOperator } from '../mock/data';
import { useWarehouseStore } from './warehouseStore';

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
          
          useWarehouseStore.getState().addOperationLog({
            operatorId: user.id,
            operatorName: user.name,
            operationType: 'login',
            targetType: 'user',
            targetId: user.id,
            targetName: user.name,
            fieldChanges: [],
            remark: '用户登录系统',
          });
          
          return true;
        }
        return false;
      },
      logout: () => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useWarehouseStore.getState().addOperationLog({
            operatorId: currentUser.id,
            operatorName: currentUser.name,
            operationType: 'logout',
            targetType: 'user',
            targetId: currentUser.id,
            targetName: currentUser.name,
            fieldChanges: [],
            remark: '用户退出系统',
          });
        }
        
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
