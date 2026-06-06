import { useState, useEffect, useRef } from 'react';
import { Layout as ArcoLayout, Menu, Avatar, Button, Badge, Notification } from '@arco-design/web-react';
import {
  IconHome,
  IconImport,
  IconExport,
  IconStorage,
  IconSearch,
  IconFile,
  IconMenuFold,
  IconMenuUnfold,
  IconUser,
  IconEdit,
  IconPoweroff,
  IconApps,
  IconPlus,
  IconUserGroup,
  IconUserAdd,
  IconList,
  IconSwap,
  IconSchedule,
  IconNotification,
  IconCamera,
} from '@arco-design/web-react/icon';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import NotificationCenter from './NotificationCenter';
import type { NotificationType } from '../types';

const Sider = ArcoLayout.Sider;
const Header = ArcoLayout.Header;
const Content = ArcoLayout.Content;
const Footer = ArcoLayout.Footer;

const menuItems = [
  { key: 'dashboard', icon: <IconHome />, text: '数据总览' },
  { key: 'inbound', icon: <IconImport />, text: '入库管理' },
  { key: 'outbound', icon: <IconExport />, text: '出库管理' },
  { key: 'transfer', icon: <IconSwap />, text: '库存调拨' },
  { key: 'location', icon: <IconStorage />, text: '库位总览' },
  { key: 'inventory', icon: <IconSearch />, text: '库存查询' },
  { key: 'inventory-snapshot', icon: <IconCamera />, text: '库存快照' },
  { key: 'stocktake', icon: <IconPlus />, text: '盘点管理' },
  { key: 'cycle-count', icon: <IconSchedule />, text: '周期盘点' },
  { key: 'product', icon: <IconList />, text: '商品管理' },
  { key: 'supplier', icon: <IconUserGroup />, text: '供应商管理' },
  { key: 'customer', icon: <IconUserAdd />, text: '客户管理' },
  { key: 'report', icon: <IconFile />, text: '报表分析' },
];

const notificationTypeConfig: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  inbound: {
    icon: <IconImport style={{ fontSize: '20px' }} />,
    color: '#ff7d00',
  },
  outbound: {
    icon: <IconExport style={{ fontSize: '20px' }} />,
    color: '#27ae60',
  },
  stocktake: {
    icon: <IconPlus style={{ fontSize: '20px' }} />,
    color: '#3498db',
  },
  system: {
    icon: <IconNotification style={{ fontSize: '20px' }} />,
    color: '#95a5a6',
  },
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { sidebarCollapsed, toggleSidebar, currentPage, setCurrentPage, notifications, getUnreadCount } = useAppStore();
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(false);
  const lastNotificationIdRef = useRef<string | null>(null);
  const unreadCount = getUnreadCount();

  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    if (latestNotification.id !== lastNotificationIdRef.current) {
      lastNotificationIdRef.current = latestNotification.id;

      const config = notificationTypeConfig[latestNotification.type];
      Notification[latestNotification.type === 'inbound' || latestNotification.type === 'outbound' ? 'info' : 'success']({
        title: latestNotification.title,
        content: (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: config.color }}>{config.icon}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                {latestNotification.orderNo}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {latestNotification.message}
            </div>
          </div>
        ),
        duration: 4000,
        showIcon: false,
      });
    }
  }, [notifications]);

  const getPageTitle = () => {
    const item = menuItems.find((m) => m.key === currentPage);
    return item?.text || '数据总览';
  };

  useEffect(() => {
    const path = location.pathname.replace('/', '');
    if (path) {
      setCurrentPage(path);
    }
  }, [location.pathname, setCurrentPage]);

  useEffect(() => {
    const pageTitle = getPageTitle();
    document.title = `${pageTitle} - WMS 仓库管理系统`;
  }, [currentPage]);

  const handleMenuClick = (key: string) => {
    setCurrentPage(key);
    navigate(`/${key}`);
  };

  const handleLogout = () => {
    setUserMenuVisible(false);
    logout();
    navigate('/login');
  };

  return (
    <ArcoLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        trigger={null}
        width={240}
        className="sidebar"
        style={{ position: 'fixed', height: '100vh', zIndex: 100 }}
      >
        <div>
          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {sidebarCollapsed ? (
              <IconApps style={{ fontSize: '32px', color: '#ff7d00' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconApps style={{ fontSize: '28px', color: '#ff7d00', marginRight: '12px' }} />
                <span style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>WMS 仓库</span>
              </div>
            )}
          </div>
          <Menu
            style={{ width: '100%', marginTop: '16px' }}
            selectedKeys={[currentPage]}
            onClickMenuItem={handleMenuClick}
            theme="dark"
          >
            {menuItems.map((item) => (
              <Menu.Item key={item.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </div>
      </Sider>
      <ArcoLayout style={{ marginLeft: sidebarCollapsed ? '48px' : '240px', transition: 'all 0.2s' }}>
        <Header
          style={{
            background: 'white',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={sidebarCollapsed ? <IconMenuUnfold /> : <IconMenuFold />}
              onClick={toggleSidebar}
              style={{ marginRight: '16px' }}
            />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{getPageTitle()}</h2>
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}
            onMouseLeave={() => setUserMenuVisible(false)}
          >
            <Button
              type="text"
              icon={
                <Badge count={unreadCount} dot={unreadCount > 0} maxCount={99}>
                  <IconNotification style={{ fontSize: '20px', color: '#666' }} />
                </Badge>
              }
              onClick={() => setNotificationCenterVisible(true)}
              style={{ marginRight: '8px' }}
            />
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
              onClick={() => setUserMenuVisible(!userMenuVisible)}
            >
              <Avatar size={36} style={{ background: '#ff7d00' }}>
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '经理' : '操作员'}
                </div>
              </div>
            </div>
            {userMenuVisible && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  paddingTop: '8px',
                  background: 'transparent',
                  minWidth: '160px',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    padding: '4px 0',
                  }}
                >
                <div
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#333', fontSize: '14px' }}
                  onClick={() => setUserMenuVisible(false)}
                >
                  <IconUser />
                  <span>个人中心</span>
                </div>
                <div
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#333', fontSize: '14px' }}
                  onClick={() => setUserMenuVisible(false)}
                >
                  <IconEdit />
                  <span>系统设置</span>
                </div>
                <div style={{ height: '1px', background: '#e5e6eb', margin: '4px 0' }} />
                <div
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cb2634', fontSize: '14px' }}
                  onClick={handleLogout}
                >
                  <IconPoweroff />
                  <span>退出登录</span>
                </div>
                </div>
              </div>
            )}
          </div>
        </Header>
        <Content style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '16px', background: 'white', color: '#999' }}>
          WMS 仓库管理系统 © 2024 - Industrial Warehouse Management System
        </Footer>
      </ArcoLayout>
      <NotificationCenter
        visible={notificationCenterVisible}
        onClose={() => setNotificationCenterVisible(false)}
      />
    </ArcoLayout>
  );
}
