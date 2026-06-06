import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Inbound from '../pages/Inbound';
import Outbound from '../pages/Outbound';
import Transfer from '../pages/Transfer';
import Location from '../pages/Location';
import Inventory from '../pages/Inventory';
import Stocktake from '../pages/Stocktake';
import CycleCount from '../pages/CycleCount';
import Report from '../pages/Report';
import Supplier from '../pages/Supplier';
import Customer from '../pages/Customer';
import Product from '../pages/Product';
import InventorySnapshot from '../pages/InventorySnapshot';
import TaskBoard from '../pages/TaskBoard';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'inbound',
        element: <Inbound />,
      },
      {
        path: 'outbound',
        element: <Outbound />,
      },
      {
        path: 'transfer',
        element: <Transfer />,
      },
      {
        path: 'location',
        element: <Location />,
      },
      {
        path: 'inventory',
        element: <Inventory />,
      },
      {
        path: 'inventory-snapshot',
        element: <InventorySnapshot />,
      },
      {
        path: 'stocktake',
        element: <Stocktake />,
      },
      {
        path: 'cycle-count',
        element: <CycleCount />,
      },
      {
        path: 'report',
        element: <Report />,
      },
      {
        path: 'supplier',
        element: <Supplier />,
      },
      {
        path: 'customer',
        element: <Customer />,
      },
      {
        path: 'product',
        element: <Product />,
      },
      {
        path: 'task-board',
        element: <TaskBoard />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
