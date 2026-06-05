import { create } from 'zustand';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  content: string;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (type: ToastItem['type'], content: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, content) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, type, content }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (content: string) => useToastStore.getState().addToast('success', content),
  error: (content: string) => useToastStore.getState().addToast('error', content),
  warning: (content: string) => useToastStore.getState().addToast('warning', content),
  info: (content: string) => useToastStore.getState().addToast('info', content),
};

const typeConfig: Record<ToastItem['type'], { color: string; background: string; icon: string }> = {
  success: { color: '#27ae60', background: '#f0fff4', icon: '✓' },
  error: { color: '#cb2634', background: '#fff1f0', icon: '✕' },
  warning: { color: '#ff7d00', background: '#fff8f0', icon: '!' },
  info: { color: '#3498db', background: '#f0f7ff', icon: 'i' },
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      {toasts.map((t) => {
        const cfg = typeConfig[t.type];
        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: cfg.background,
              border: `1px solid ${cfg.color}30`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              color: cfg.color,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              animation: 'toastIn 0.3s ease',
              minWidth: '200px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: cfg.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
              {cfg.icon}
            </span>
            <span>{t.content}</span>
          </div>
        );
      })}
    </div>
  );
}
