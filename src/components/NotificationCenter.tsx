import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  Tag,
  Button,
  Empty,
  Space,
} from '@arco-design/web-react';
import {
  IconImport,
  IconExport,
  IconPlus,
  IconInfoCircle,
  IconCheck,
  IconDelete,
} from '@arco-design/web-react/icon';
import { useAppStore } from '../store/appStore';
import type { TaskNotification, NotificationType } from '../types';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; label: string }> = {
  inbound: {
    icon: <IconImport />,
    color: 'orange',
    label: '入库',
  },
  outbound: {
    icon: <IconExport />,
    color: 'green',
    label: '出库',
  },
  stocktake: {
    icon: <IconPlus />,
    color: 'blue',
    label: '盘点',
  },
  system: {
    icon: <IconInfoCircle />,
    color: 'gray',
    label: '系统',
  },
};

export default function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
  } = useAppStore();

  const recentNotifications = notifications.slice(0, 10);

  const handleNotificationClick = (notification: TaskNotification) => {
    markNotificationAsRead(notification.id);
    onClose();

    if (notification.type === 'inbound') {
      navigate('/inbound');
    } else if (notification.type === 'outbound') {
      navigate('/outbound');
    } else if (notification.type === 'stocktake') {
      navigate('/stocktake');
    }
  };

  const handleMarkAllRead = (e: Event) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
  };

  const handleClearAll = (e: Event) => {
    e.stopPropagation();
    clearAllNotifications();
  };

  return (
    <Drawer
      width={400}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>任务通知中心</span>
          <Tag color="red" size="small">
            {notifications.filter((n) => !n.read).length} 条未读
          </Tag>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={<IconCheck />}
            onClick={handleMarkAllRead}
            disabled={notifications.length === 0}
          >
            全部已读
          </Button>
          <Button
            type="text"
            status="danger"
            icon={<IconDelete />}
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            一键清除
          </Button>
        </div>
      }
    >
      {recentNotifications.length === 0 ? (
        <Empty description="暂无通知" style={{ marginTop: '60px' }} />
      ) : (
        <List
          size="small"
          dataSource={recentNotifications}
          render={(item) => {
            const config = typeConfig[item.type];
            return (
              <List.Item
                key={item.id}
                style={{
                  cursor: 'pointer',
                  background: item.read ? 'transparent' : 'rgba(255, 125, 0, 0.05)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  padding: '12px',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleNotificationClick(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 125, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = item.read
                    ? 'transparent'
                    : 'rgba(255, 125, 0, 0.05)';
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: item.read ? '#f0f0f0' : 'rgba(255, 125, 0, 0.15)',
                        color: item.read ? '#999' : '#ff7d00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      {config.icon}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: item.read ? '400' : '600' }}>
                        {item.title}
                      </span>
                      {!item.read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ff7d00',
                          }}
                        />
                      )}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <Tag color={config.color} size="small">
                          {config.label}
                        </Tag>
                        <span style={{ color: '#333', fontFamily: 'monospace' }}>
                          {item.orderNo}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        {item.createTime}
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
}
