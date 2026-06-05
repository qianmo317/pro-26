export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
  avatar?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  description?: string;
}

export interface Location {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  shelf: string;
  level: number;
  status: 'empty' | 'normal' | 'full' | 'locked';
  capacity: number;
  current: number;
}

export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationCode: string;
  quantity: number;
  batchNo: string;
  productionDate: string;
  expirationDate?: string;
  updateTime: string;
}

export interface InboundOrder {
  id: string;
  orderNo: string;
  supplier: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  items: InboundItem[];
  createTime: string;
  updateTime: string;
  operator?: string;
  remark?: string;
}

export interface InboundItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  planQuantity: number;
  actualQuantity: number;
  locationId?: string;
  locationCode?: string;
  batchNo: string;
  productionDate: string;
  expirationDate?: string;
}

export interface OutboundOrder {
  id: string;
  orderNo: string;
  customer: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  items: OutboundItem[];
  createTime: string;
  updateTime: string;
  operator?: string;
  remark?: string;
}

export interface OutboundItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  planQuantity: number;
  actualQuantity: number;
  locationId?: string;
  locationCode?: string;
  batchNo?: string;
}

export interface StocktakePlan {
  id: string;
  planNo: string;
  name: string;
  type: 'full' | 'partial' | 'cycle';
  status: 'pending' | 'in_progress' | 'completed';
  locationIds: string[];
  items: StocktakeItem[];
  createTime: string;
  startTime?: string;
  endTime?: string;
  operator?: string;
  remark?: string;
}

export interface StocktakeItem {
  id: string;
  inventoryId: string;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationCode: string;
  systemQuantity: number;
  actualQuantity: number;
  diffQuantity: number;
  status: 'pending' | 'counted' | 'adjusted';
  batchNo: string;
}

export interface ReportData {
  inboundTrend: { date: string; count: number }[];
  outboundTrend: { date: string; count: number }[];
  categoryStats: { name: string; value: number }[];
  locationUtilization: { zone: string; utilization: number }[];
  topProducts: { name: string; quantity: number }[];
  totalInbound: number;
  totalOutbound: number;
  totalInventory: number;
  totalLocations: number;
  usedLocations: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}
