import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Inbound from '../pages/Inbound';
import Outbound from '../pages/Outbound';
import Location from '../pages/Location';
import Inventory from '../pages/Inventory';
import Stocktake from '../pages/Stocktake';
import Report from '../pages/Report';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
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
        path: 'location',
        element: <Location />,
      },
      {
        path: 'inventory',
        element: <Inventory />,
      },
      {
        path: 'stocktake',
        element: <Stocktake />,
      },
      {
        path: 'report',
        element: <Report />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
