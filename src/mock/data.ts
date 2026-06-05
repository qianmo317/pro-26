import type {
  User,
  Product,
  Location,
  Inventory,
  InboundOrder,
  OutboundOrder,
  StocktakePlan,
  ReportData,
} from '../types';

export const mockUser: User = {
  id: '1',
  username: 'admin',
  name: '系统管理员',
  role: 'admin',
  avatar: '',
};

export const mockProducts: Product[] = [
  { id: '1', sku: 'SKU001', name: '机械轴承', category: '机械零件', unit: '个', price: 150 },
  { id: '2', sku: 'SKU002', name: '螺丝套装', category: '紧固件', unit: '套', price: 25 },
  { id: '3', sku: 'SKU003', name: '电机马达', category: '电气设备', unit: '台', price: 800 },
  { id: '4', sku: 'SKU004', name: '齿轮箱', category: '机械零件', unit: '个', price: 1200 },
  { id: '5', sku: 'SKU005', name: '液压油管', category: '液压配件', unit: '米', price: 85 },
  { id: '6', sku: 'SKU006', name: '密封圈', category: '密封件', unit: '个', price: 12 },
  { id: '7', sku: 'SKU007', name: 'PLC控制器', category: '电气设备', unit: '台', price: 2500 },
  { id: '8', sku: 'SKU008', name: '传感器', category: '电气设备', unit: '个', price: 350 },
];

const zones = ['A区', 'B区', 'C区', 'D区'];
const aisles = ['01', '02', '03'];
const shelves = ['01', '02', '03', '04'];
const levels = [1, 2, 3, 4];

let locId = 1;
export const mockLocations: Location[] = [];
zones.forEach((zone) => {
  aisles.forEach((aisle) => {
    shelves.forEach((shelf) => {
      levels.forEach((level) => {
        const code = `${zone[0]}${aisle}-${shelf}-${level}`;
        mockLocations.push({
          id: String(locId++),
          code,
          zone,
          aisle,
          shelf,
          level,
          status: 'empty',
          capacity: 100,
          current: 0,
        });
      });
    });
  });
});

const getLocationById = (id: string) => mockLocations.find((l) => l.id === id);
const getProductById = (id: string) => mockProducts.find((p) => p.id === id);

export const mockInventory: Inventory[] = [];
let inventoryId = 1;

const addInventory = (
  productId: string,
  locationId: string,
  quantity: number,
  batchNo: string,
  productionDate: string
) => {
  const product = getProductById(productId);
  const location = getLocationById(locationId);
  if (!product || !location) return;

  const existing = mockInventory.find(
    (inv) => inv.productId === productId && inv.locationId === locationId && inv.batchNo === batchNo
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    mockInventory.push({
      id: String(inventoryId++),
      productId,
      productName: product.name,
      productSku: product.sku,
      locationId,
      locationCode: location.code,
      quantity,
      batchNo,
      productionDate,
      updateTime: new Date().toISOString(),
    });
  }

  location.current += quantity;
  location.status = location.current === 0 ? 'empty' : location.current >= location.capacity ? 'full' : 'normal';
};

const removeInventory = (productId: string, locationId: string, quantity: number, batchNo: string) => {
  const location = getLocationById(locationId);
  if (!location) return false;

  const existing = mockInventory.find(
    (inv) => inv.productId === productId && inv.locationId === locationId && inv.batchNo === batchNo
  );

  if (!existing || existing.quantity < quantity) return false;

  existing.quantity -= quantity;
  location.current -= quantity;
  location.status = location.current === 0 ? 'empty' : location.current >= location.capacity ? 'full' : 'normal';

  if (existing.quantity <= 0) {
    const idx = mockInventory.indexOf(existing);
    if (idx > -1) mockInventory.splice(idx, 1);
  }

  return true;
};

const generateOrderNo = () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const mockInboundOrders: InboundOrder[] = [];

const createInboundOrder = (
  supplier: string,
  status: 'pending' | 'in_progress' | 'completed',
  items: Array<{
    productId: string;
    planQuantity: number;
    actualQuantity: number;
    locationId?: string;
    batchNo: string;
    productionDate: string;
  }>,
  createTime: string,
  updateTime: string,
  operator?: string
) => {
  const order: InboundOrder = {
    id: String(mockInboundOrders.length + 1),
    orderNo: generateOrderNo(),
    supplier,
    status,
    items: items.map((item, idx) => {
      const product = getProductById(item.productId);
      return {
        id: `${mockInboundOrders.length + 1}-${idx + 1}`,
        productId: item.productId,
        productName: product?.name || '',
        productSku: product?.sku || '',
        planQuantity: item.planQuantity,
        actualQuantity: item.actualQuantity,
        locationId: item.locationId,
        locationCode: item.locationId ? getLocationById(item.locationId)?.code : undefined,
        batchNo: item.batchNo,
        productionDate: item.productionDate,
      };
    }),
    createTime,
    updateTime,
    operator,
  };

  mockInboundOrders.push(order);

  if (status === 'completed') {
    order.items.forEach((item) => {
      if (item.locationId && item.actualQuantity > 0) {
        addInventory(item.productId, item.locationId, item.actualQuantity, item.batchNo, item.productionDate);
      }
    });
  }

  return order;
};

createInboundOrder(
  '供应商A',
  'pending',
  [
    { productId: '1', planQuantity: 100, actualQuantity: 0, batchNo: 'BATCH20240601', productionDate: '2024-06-01' },
  ],
  '2024-06-01 09:00:00',
  '2024-06-01 09:00:00'
);

createInboundOrder(
  '供应商B',
  'in_progress',
  [
    { productId: '3', planQuantity: 20, actualQuantity: 15, batchNo: 'BATCH20240602', productionDate: '2024-06-02' },
    { productId: '7', planQuantity: 10, actualQuantity: 10, batchNo: 'BATCH20240602', productionDate: '2024-06-02' },
  ],
  '2024-06-02 10:30:00',
  '2024-06-02 14:00:00',
  '张三'
);

createInboundOrder(
  '供应商C',
  'completed',
  [
    {
      productId: '5',
      planQuantity: 50,
      actualQuantity: 50,
      locationId: '10',
      batchNo: 'BATCH20240520',
      productionDate: '2024-05-20',
    },
  ],
  '2024-05-20 08:00:00',
  '2024-05-20 16:00:00',
  '李四'
);

createInboundOrder(
  '供应商D',
  'completed',
  [
    {
      productId: '1',
      planQuantity: 80,
      actualQuantity: 80,
      locationId: '1',
      batchNo: 'BATCH20240515',
      productionDate: '2024-05-15',
    },
    {
      productId: '2',
      planQuantity: 200,
      actualQuantity: 200,
      locationId: '5',
      batchNo: 'BATCH20240516',
      productionDate: '2024-05-16',
    },
  ],
  '2024-05-16 09:00:00',
  '2024-05-16 17:00:00',
  '李四'
);

createInboundOrder(
  '供应商E',
  'completed',
  [
    {
      productId: '4',
      planQuantity: 25,
      actualQuantity: 25,
      locationId: '15',
      batchNo: 'BATCH20240510',
      productionDate: '2024-05-10',
    },
    {
      productId: '6',
      planQuantity: 300,
      actualQuantity: 300,
      locationId: '20',
      batchNo: 'BATCH20240512',
      productionDate: '2024-05-12',
    },
    {
      productId: '8',
      planQuantity: 60,
      actualQuantity: 60,
      locationId: '25',
      batchNo: 'BATCH20240514',
      productionDate: '2024-05-14',
    },
  ],
  '2024-05-14 10:00:00',
  '2024-05-14 18:00:00',
  '王五'
);

export const mockOutboundOrders: OutboundOrder[] = [];

const createOutboundOrder = (
  customer: string,
  status: 'pending' | 'in_progress' | 'completed',
  items: Array<{
    productId: string;
    planQuantity: number;
    actualQuantity: number;
    locationId?: string;
    batchNo?: string;
  }>,
  createTime: string,
  updateTime: string,
  operator?: string
) => {
  const order: OutboundOrder = {
    id: String(mockOutboundOrders.length + 1),
    orderNo: generateOrderNo(),
    customer,
    status,
    items: items.map((item, idx) => {
      const product = getProductById(item.productId);
      return {
        id: `${mockOutboundOrders.length + 1}-${idx + 1}`,
        productId: item.productId,
        productName: product?.name || '',
        productSku: product?.sku || '',
        planQuantity: item.planQuantity,
        actualQuantity: item.actualQuantity,
        locationId: item.locationId,
        locationCode: item.locationId ? getLocationById(item.locationId)?.code : undefined,
        batchNo: item.batchNo,
      };
    }),
    createTime,
    updateTime,
    operator,
  };

  mockOutboundOrders.push(order);

  if (status === 'completed') {
    order.items.forEach((item) => {
      if (item.locationId && item.batchNo && item.actualQuantity > 0) {
        removeInventory(item.productId, item.locationId, item.actualQuantity, item.batchNo);
      }
    });
  }

  return order;
};

createOutboundOrder(
  '客户X',
  'pending',
  [{ productId: '1', planQuantity: 30, actualQuantity: 0 }],
  '2024-06-03 11:00:00',
  '2024-06-03 11:00:00'
);

createOutboundOrder(
  '客户Y',
  'completed',
  [
    {
      productId: '2',
      planQuantity: 50,
      actualQuantity: 50,
      locationId: '5',
      batchNo: 'BATCH20240516',
    },
  ],
  '2024-06-01 15:00:00',
  '2024-06-01 17:30:00',
  '王五'
);

createOutboundOrder(
  '客户Z',
  'completed',
  [
    {
      productId: '6',
      planQuantity: 100,
      actualQuantity: 100,
      locationId: '20',
      batchNo: 'BATCH20240512',
    },
  ],
  '2024-05-25 14:00:00',
  '2024-05-25 16:00:00',
  '赵六'
);

createOutboundOrder(
  '客户W',
  'in_progress',
  [
    {
      productId: '4',
      planQuantity: 10,
      actualQuantity: 5,
      locationId: '15',
      batchNo: 'BATCH20240510',
    },
  ],
  '2024-06-02 10:00:00',
  '2024-06-02 11:00:00',
  '张三'
);

export const mockStocktakePlans: StocktakePlan[] = [];

const aZoneLocations = mockLocations.filter((l) => l.zone === 'A区');
const aZoneInventory = mockInventory.filter((inv) => inv.locationCode.startsWith('A'));

mockStocktakePlans.push({
  id: '1',
  planNo: `STK${Date.now()}`,
  name: 'A区月度盘点',
  type: 'partial',
  status: 'in_progress',
  locationIds: aZoneLocations.map((l) => l.id),
  items: aZoneInventory.map((inv, idx) => ({
    id: String(idx + 1),
    inventoryId: inv.id,
    productId: inv.productId,
    productName: inv.productName,
    productSku: inv.productSku,
    locationId: inv.locationId,
    locationCode: inv.locationCode,
    systemQuantity: inv.quantity,
    actualQuantity: idx % 3 === 0 ? inv.quantity : inv.quantity + (idx % 2 === 0 ? 2 : -1),
    diffQuantity: idx % 3 === 0 ? 0 : idx % 2 === 0 ? 2 : -1,
    status: idx % 3 === 0 ? 'counted' : 'pending',
    batchNo: inv.batchNo,
  })),
  createTime: '2024-06-01 08:00:00',
  startTime: '2024-06-01 09:00:00',
  operator: '赵六',
});

const totalInbound = mockInboundOrders
  .filter((o) => o.status === 'completed')
  .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.actualQuantity, 0), 0);

const totalOutbound = mockOutboundOrders
  .filter((o) => o.status === 'completed')
  .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.actualQuantity, 0), 0);

const totalInventory = mockInventory.reduce((sum, inv) => sum + inv.quantity, 0);
const totalLocations = mockLocations.length;
const usedLocations = mockLocations.filter((l) => l.current > 0).length;

const categoryMap = new Map<string, number>();
mockInventory.forEach((inv) => {
  const product = getProductById(inv.productId);
  if (product) {
    categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + inv.quantity);
  }
});

const zoneMap = new Map<string, number>();
mockLocations.forEach((loc) => {
  zoneMap.set(loc.zone, (zoneMap.get(loc.zone) || 0) + loc.current);
});

const productMap = new Map<string, number>();
mockInventory.forEach((inv) => {
  productMap.set(inv.productName, (productMap.get(inv.productName) || 0) + inv.quantity);
});

export const mockReportData: ReportData = {
  inboundTrend: [
    { date: '05-29', count: 120 },
    { date: '05-30', count: 200 },
    { date: '05-31', count: 150 },
    { date: '06-01', count: 100 },
    { date: '06-02', count: 180 },
    { date: '06-03', count: 80 },
    { date: '06-04', count: totalInbound },
  ],
  outboundTrend: [
    { date: '05-29', count: 80 },
    { date: '05-30', count: 150 },
    { date: '05-31', count: 120 },
    { date: '06-01', count: 50 },
    { date: '06-02', count: 100 },
    { date: '06-03', count: 30 },
    { date: '06-04', count: totalOutbound },
  ],
  categoryStats: Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })),
  locationUtilization: Array.from(zoneMap.entries()).map(([zone, used]) => ({
    zone,
    utilization: Math.round((used / (4 * 3 * 4 * 4 * 100 / 4)) * 100),
  })),
  topProducts: Array.from(productMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5),
  totalInbound,
  totalOutbound,
  totalInventory,
  totalLocations,
  usedLocations,
};
