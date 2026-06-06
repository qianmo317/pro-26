export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'operator';
  avatar?: string;
}

export interface Supplier {
  id: string;
  code: string;
  companyName: string;
  contact: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  creditRating: 'A' | 'B' | 'C' | 'D';
  createTime: string;
  updateTime: string;
}

export interface Customer {
  id: string;
  code: string;
  companyName: string;
  shippingAddress: string;
  contact: string;
  phone: string;
  paymentTerms: number;
  status: 'active' | 'inactive';
  createTime: string;
  updateTime: string;
}

export interface CustomerStats {
  customerId: string;
  totalOutboundAmount: number;
  lastOutboundTime: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  safetyStockMin: number;
  safetyStockMax: number;
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

export interface LocationActivity {
  locationId: string;
  locationCode: string;
  zone: string;
  inboundCount: number;
  outboundCount: number;
  totalCount: number;
}

export type HeatmapMode = 'status' | 'heatmap';
export type HeatmapDimension = 'inbound' | 'outbound' | 'total';

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
  supplierId: string;
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
  customerId?: string;
  customer: string;
  shippingAddress?: string;
  contact?: string;
  phone?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'split';
  items: OutboundItem[];
  createTime: string;
  updateTime: string;
  operator?: string;
  remark?: string;
  parentId?: string;
  isParent?: boolean;
  childIds?: string[];
  splitTime?: string;
  splitRemark?: string;
}

export interface OutboundSplitItem {
  productId: string;
  productName: string;
  productSku: string;
  planQuantity: number;
  batchNo?: string;
}

export interface OutboundSplitSubOrder {
  id: string;
  items: OutboundSplitItem[];
  remark?: string;
}

export interface OutboundSplitData {
  parentOrderId: string;
  subOrders: OutboundSplitSubOrder[];
  splitRemark?: string;
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

export interface TransferItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  batchNo: string;
  sourceLocationId: string;
  sourceLocationCode: string;
  targetLocationId: string;
  targetLocationCode: string;
}

export interface TransferOrder {
  id: string;
  orderNo: string;
  sourceLocationId: string;
  sourceLocationCode: string;
  targetLocationId: string;
  targetLocationCode: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  items: TransferItem[];
  createTime: string;
  updateTime: string;
  operator?: string;
  remark?: string;
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

export interface BatchTraceEvent {
  type: 'inbound' | 'outbound' | 'transfer' | 'stocktake';
  time: string;
  description: string;
  orderNo?: string;
  locationCode?: string;
  quantity: number;
  operator?: string;
  remark?: string;
}

export interface BatchTraceData {
  batchNo: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  unit: string;
  productionDate: string;
  expirationDate?: string;
  inboundOrder: {
    orderNo: string;
    supplier: string;
    createTime: string;
    operator?: string;
    quantity: number;
  } | null;
  currentLocations: Array<{
    locationCode: string;
    quantity: number;
  }>;
  outboundRecords: Array<{
    orderNo: string;
    customer: string;
    createTime: string;
    locationCode: string;
    quantity: number;
    operator?: string;
  }>;
  transferRecords: Array<{
    orderNo: string;
    sourceLocation: string;
    targetLocation: string;
    createTime: string;
    quantity: number;
    operator?: string;
    status: string;
  }>;
  timeline: BatchTraceEvent[];
  totalInbound: number;
  totalOutbound: number;
  remainingQuantity: number;
}

export interface InventoryBatch {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  unit: string;
  batchNo: string;
  productionDate: string;
  expirationDate?: string;
  totalQuantity: number;
  locationCount: number;
  locations: Array<{
    locationCode: string;
    quantity: number;
  }>;
  stockStatus: 'normal' | 'low' | 'overstock' | 'expired' | 'expiring';
}

export type InventoryChangeType = 'inbound' | 'outbound' | 'transfer' | 'adjust';

export interface InventoryChangeRecord {
  id: string;
  type: InventoryChangeType;
  productId: string;
  productName: string;
  productSku: string;
  locationId: string;
  locationCode: string;
  batchNo: string;
  quantity: number;
  balanceAfter: number;
  orderNo: string;
  operator: string;
  operateTime: string;
  remark?: string;
}

export type CycleCountPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type CycleCountScope = 'zone' | 'category' | 'abc';
export type ABCClass = 'A' | 'B' | 'C';

export interface CycleCountConfig {
  id: string;
  name: string;
  period: CycleCountPeriod;
  scope: CycleCountScope;
  zoneValues?: string[];
  categoryValues?: string[];
  abcValues?: ABCClass[];
  enabled: boolean;
  lastGenerateTime?: string;
  nextGenerateTime?: string;
  autoGenerate: boolean;
  createTime: string;
  updateTime: string;
  operator?: string;
  remark?: string;
}

export interface CycleCountRecommendation {
  configId: string;
  configName: string;
  recommendedScope: string;
  recommendedItems: Array<{
    productId: string;
    productName: string;
    productSku: string;
    locationId: string;
    locationCode: string;
    lastStocktakeTime?: string;
    daysSinceLastStocktake: number;
    abcClass: ABCClass;
    category: string;
    zone: string;
  }>;
  reason: string;
}

export type StockAgeRange = '0-30' | '31-60' | '61-90' | '90+';

export interface StockAgeItem {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  zone: string;
  locationCode: string;
  batchNo: string;
  quantity: number;
  price: number;
  amount: number;
  productionDate: string;
  stockDays: number;
  ageRange: StockAgeRange;
}

export interface StockAgeStat {
  range: StockAgeRange;
  label: string;
  quantity: number;
  quantityRatio: number;
  amount: number;
  amountRatio: number;
}

export interface StockAgeData {
  stats: StockAgeStat[];
  items: StockAgeItem[];
  totalQuantity: number;
  totalAmount: number;
  overageQuantity: number;
  overageAmount: number;
  overageQuantityRatio: number;
  overageAmountRatio: number;
}

export interface StockAgeFilter {
  categories: string[];
  zones: string[];
}

export interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export interface LabelSize {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: 'mm' | 'px';
}

export interface LabelPrintData {
  sku: string;
  name: string;
  batchNo: string;
  quantity: number;
  inboundDate: string;
}

export interface InboundPrintData {
  orderNo: string;
  supplier: string;
  operator: string;
  createTime: string;
  items: Array<{
    productName: string;
    productSku: string;
    batchNo: string;
    planQuantity: number;
    actualQuantity: number;
    locationCode: string;
  }>;
}
