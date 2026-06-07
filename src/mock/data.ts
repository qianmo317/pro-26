import type {
  User,
  Supplier,
  Customer,
  Product,
  Location,
  Inventory,
  InboundOrder,
  OutboundOrder,
  StocktakePlan,
  ReportData,
  TransferOrder,
  LocationActivity,
  StockDifferenceItem,
  StockAdjustmentOrder,
} from '../types';

export const mockUser: User = {
  id: '1',
  username: 'admin',
  name: '系统管理员',
  role: 'admin',
  avatar: '',
};

export const mockManager: User = {
  id: '2',
  username: 'manager',
  name: '仓库经理',
  role: 'manager',
  avatar: '',
};

export const mockOperator: User = {
  id: '3',
  username: 'operator',
  name: '仓库操作员',
  role: 'operator',
  avatar: '',
};

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    code: 'SUP001',
    companyName: '供应商A',
    contact: '张经理',
    phone: '13800138001',
    address: '北京市朝阳区建国路88号',
    status: 'active',
    creditRating: 'A',
    createTime: '2024-01-15 10:00:00',
    updateTime: '2024-01-15 10:00:00',
  },
  {
    id: '2',
    code: 'SUP002',
    companyName: '供应商B',
    contact: '李主管',
    phone: '13800138002',
    address: '上海市浦东新区张江高科技园区',
    status: 'active',
    creditRating: 'B',
    createTime: '2024-02-20 14:30:00',
    updateTime: '2024-02-20 14:30:00',
  },
  {
    id: '3',
    code: 'SUP003',
    companyName: '供应商C',
    contact: '王工',
    phone: '13800138003',
    address: '广州市天河区天河路385号',
    status: 'active',
    creditRating: 'A',
    createTime: '2024-03-10 09:15:00',
    updateTime: '2024-03-10 09:15:00',
  },
  {
    id: '4',
    code: 'SUP004',
    companyName: '供应商D',
    contact: '赵经理',
    phone: '13800138004',
    address: '深圳市南山区科技园',
    status: 'active',
    creditRating: 'C',
    createTime: '2024-04-05 11:20:00',
    updateTime: '2024-04-05 11:20:00',
  },
  {
    id: '5',
    code: 'SUP005',
    companyName: '供应商E',
    contact: '刘总',
    phone: '13800138005',
    address: '杭州市西湖区文三路',
    status: 'inactive',
    creditRating: 'D',
    createTime: '2024-04-18 16:45:00',
    updateTime: '2024-05-01 08:00:00',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'CUS001',
    companyName: '北京机电设备有限公司',
    shippingAddress: '北京市海淀区中关村大街1号',
    contact: '王经理',
    phone: '13900139001',
    paymentTerms: 30,
    status: 'active',
    createTime: '2024-01-10 09:00:00',
    updateTime: '2024-01-10 09:00:00',
  },
  {
    id: '2',
    code: 'CUS002',
    companyName: '上海自动化科技公司',
    shippingAddress: '上海市浦东新区张江高科技园区博云路2号',
    contact: '李工',
    phone: '13900139002',
    paymentTerms: 45,
    status: 'active',
    createTime: '2024-02-15 10:30:00',
    updateTime: '2024-02-15 10:30:00',
  },
  {
    id: '3',
    code: 'CUS003',
    companyName: '广州贸易有限公司',
    shippingAddress: '广州市天河区珠江新城华夏路8号',
    contact: '张总',
    phone: '13900139003',
    paymentTerms: 60,
    status: 'active',
    createTime: '2024-03-05 14:00:00',
    updateTime: '2024-03-05 14:00:00',
  },
  {
    id: '4',
    code: 'CUS004',
    companyName: '深圳电子制造有限公司',
    shippingAddress: '深圳市宝安区新安街道创业一路1000号',
    contact: '赵经理',
    phone: '13900139004',
    paymentTerms: 30,
    status: 'active',
    createTime: '2024-03-20 11:20:00',
    updateTime: '2024-03-20 11:20:00',
  },
  {
    id: '5',
    code: 'CUS005',
    companyName: '杭州机械加工厂',
    shippingAddress: '杭州市萧山区经济技术开发区桥南区块',
    contact: '孙厂长',
    phone: '13900139005',
    paymentTerms: 90,
    status: 'inactive',
    createTime: '2024-04-01 08:30:00',
    updateTime: '2024-05-10 09:00:00',
  },
];

export const mockProducts: Product[] = [
  { id: '1', sku: 'SKU001', name: '机械轴承', category: '机械零件', unit: '个', price: 150, safetyStockMin: 50, safetyStockMax: 200 },
  { id: '2', sku: 'SKU002', name: '螺丝套装', category: '紧固件', unit: '套', price: 25, safetyStockMin: 100, safetyStockMax: 300 },
  { id: '3', sku: 'SKU003', name: '电机马达', category: '电气设备', unit: '台', price: 800, safetyStockMin: 10, safetyStockMax: 50 },
  { id: '4', sku: 'SKU004', name: '齿轮箱', category: '机械零件', unit: '个', price: 1200, safetyStockMin: 5, safetyStockMax: 30 },
  { id: '5', sku: 'SKU005', name: '液压油管', category: '液压配件', unit: '米', price: 85, safetyStockMin: 30, safetyStockMax: 100 },
  { id: '6', sku: 'SKU006', name: '密封圈', category: '密封件', unit: '个', price: 12, safetyStockMin: 150, safetyStockMax: 250 },
  { id: '7', sku: 'SKU007', name: 'PLC控制器', category: '电气设备', unit: '台', price: 2500, safetyStockMin: 5, safetyStockMax: 20 },
  { id: '8', sku: 'SKU008', name: '传感器', category: '电气设备', unit: '个', price: 350, safetyStockMin: 20, safetyStockMax: 80 },
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
  productionDate: string,
  expirationDate?: string
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
      expirationDate,
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
  supplierId: string,
  supplier: string,
  status: 'pending' | 'in_progress' | 'completed',
  items: Array<{
    productId: string;
    planQuantity: number;
    actualQuantity: number;
    locationId?: string;
    batchNo: string;
    productionDate: string;
    expirationDate?: string;
  }>,
  createTime: string,
  updateTime: string,
  operator?: string
) => {
  const order: InboundOrder = {
    id: String(mockInboundOrders.length + 1),
    orderNo: generateOrderNo(),
    supplierId,
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
        receivedQuantity: item.actualQuantity,
        locationId: item.locationId,
        locationCode: item.locationId ? getLocationById(item.locationId)?.code : undefined,
        batchNo: item.batchNo,
        productionDate: item.productionDate,
        expirationDate: item.expirationDate,
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
        addInventory(item.productId, item.locationId, item.actualQuantity, item.batchNo, item.productionDate, item.expirationDate);
      }
    });
  }

  return order;
};

createInboundOrder(
  '1',
  '供应商A',
  'pending',
  [
    { productId: '1', planQuantity: 100, actualQuantity: 0, batchNo: 'BATCH20240601', productionDate: '2024-06-01', expirationDate: '2026-06-01' },
  ],
  '2024-06-01 09:00:00',
  '2024-06-01 09:00:00'
);

createInboundOrder(
  '2',
  '供应商B',
  'in_progress',
  [
    { productId: '3', planQuantity: 20, actualQuantity: 15, batchNo: 'BATCH20240602', productionDate: '2024-06-02', expirationDate: '2026-06-02' },
    { productId: '7', planQuantity: 10, actualQuantity: 10, batchNo: 'BATCH20240602', productionDate: '2024-06-02', expirationDate: '2026-06-02' },
  ],
  '2024-06-02 10:30:00',
  '2024-06-02 14:00:00',
  '张三'
);

createInboundOrder(
  '3',
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
      expirationDate: '2025-05-20',
    },
  ],
  '2024-05-20 08:00:00',
  '2024-05-20 16:00:00',
  '李四'
);

createInboundOrder(
  '4',
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
      expirationDate: '2025-07-15',
    },
    {
      productId: '2',
      planQuantity: 200,
      actualQuantity: 200,
      locationId: '5',
      batchNo: 'BATCH20240516',
      productionDate: '2024-05-16',
      expirationDate: '2026-05-16',
    },
  ],
  '2024-05-16 09:00:00',
  '2024-05-16 17:00:00',
  '李四'
);

createInboundOrder(
  '5',
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
      expirationDate: '2026-05-10',
    },
    {
      productId: '6',
      planQuantity: 300,
      actualQuantity: 300,
      locationId: '20',
      batchNo: 'BATCH20240512',
      productionDate: '2024-05-12',
      expirationDate: '2025-06-12',
    },
    {
      productId: '8',
      planQuantity: 60,
      actualQuantity: 60,
      locationId: '25',
      batchNo: 'BATCH20240514',
      productionDate: '2024-05-14',
      expirationDate: '2025-05-14',
    },
  ],
  '2024-05-14 10:00:00',
  '2024-05-14 18:00:00',
  '王五'
);

createInboundOrder(
  '1',
  '供应商A',
  'completed',
  [
    {
      productId: '1',
      planQuantity: 50,
      actualQuantity: 50,
      locationId: '2',
      batchNo: 'BATCH20260530',
      productionDate: '2026-05-30',
      expirationDate: '2028-05-30',
    },
    {
      productId: '2',
      planQuantity: 100,
      actualQuantity: 100,
      locationId: '6',
      batchNo: 'BATCH20260528',
      productionDate: '2026-05-28',
      expirationDate: '2028-05-28',
    },
  ],
  '2026-05-30 09:00:00',
  '2026-05-30 15:00:00',
  '张三'
);

createInboundOrder(
  '2',
  '供应商B',
  'completed',
  [
    {
      productId: '3',
      planQuantity: 30,
      actualQuantity: 30,
      locationId: '30',
      batchNo: 'BATCH20260520',
      productionDate: '2026-05-20',
      expirationDate: '2028-05-20',
    },
    {
      productId: '7',
      planQuantity: 8,
      actualQuantity: 8,
      locationId: '35',
      batchNo: 'BATCH20260525',
      productionDate: '2026-05-25',
      expirationDate: '2028-05-25',
    },
  ],
  '2026-05-25 10:00:00',
  '2026-05-25 16:00:00',
  '李四'
);

createInboundOrder(
  '3',
  '供应商C',
  'completed',
  [
    {
      productId: '5',
      planQuantity: 40,
      actualQuantity: 40,
      locationId: '40',
      batchNo: 'BATCH20260415',
      productionDate: '2026-04-15',
      expirationDate: '2028-04-15',
    },
    {
      productId: '8',
      planQuantity: 25,
      actualQuantity: 25,
      locationId: '45',
      batchNo: 'BATCH20260420',
      productionDate: '2026-04-20',
      expirationDate: '2028-04-20',
    },
  ],
  '2026-04-20 08:00:00',
  '2026-04-20 14:00:00',
  '王五'
);

createInboundOrder(
  '4',
  '供应商D',
  'completed',
  [
    {
      productId: '1',
      planQuantity: 30,
      actualQuantity: 30,
      locationId: '50',
      batchNo: 'BATCH20260310',
      productionDate: '2026-03-10',
      expirationDate: '2028-03-10',
    },
    {
      productId: '4',
      planQuantity: 15,
      actualQuantity: 15,
      locationId: '55',
      batchNo: 'BATCH20260315',
      productionDate: '2026-03-15',
      expirationDate: '2028-03-15',
    },
  ],
  '2026-03-15 10:00:00',
  '2026-03-15 16:00:00',
  '赵六'
);

createInboundOrder(
  '1',
  '供应商A',
  'completed',
  [
    {
      productId: '2',
      planQuantity: 80,
      actualQuantity: 80,
      locationId: '60',
      batchNo: 'BATCH20260201',
      productionDate: '2026-02-01',
      expirationDate: '2028-02-01',
    },
    {
      productId: '6',
      planQuantity: 200,
      actualQuantity: 200,
      locationId: '65',
      batchNo: 'BATCH20260210',
      productionDate: '2026-02-10',
      expirationDate: '2028-02-10',
    },
  ],
  '2026-02-10 09:00:00',
  '2026-02-10 15:00:00',
  '张三'
);

createInboundOrder(
  '5',
  '供应商E',
  'completed',
  [
    {
      productId: '3',
      planQuantity: 10,
      actualQuantity: 10,
      locationId: '70',
      batchNo: 'BATCH20251201',
      productionDate: '2025-12-01',
      expirationDate: '2027-12-01',
    },
    {
      productId: '7',
      planQuantity: 5,
      actualQuantity: 5,
      locationId: '75',
      batchNo: 'BATCH20251115',
      productionDate: '2025-11-15',
      expirationDate: '2027-11-15',
    },
    {
      productId: '5',
      planQuantity: 20,
      actualQuantity: 20,
      locationId: '80',
      batchNo: 'BATCH20251001',
      productionDate: '2025-10-01',
      expirationDate: '2027-10-01',
    },
  ],
  '2025-12-05 10:00:00',
  '2025-12-05 16:00:00',
  '李四'
);

export const mockOutboundOrders: OutboundOrder[] = [];

const getCustomerById = (id: string) => mockCustomers.find((c) => c.id === id);

const createOutboundOrderWithCustomer = (
  customerId: string,
  status: 'pending' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled' | 'split',
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
  const customer = getCustomerById(customerId);
  const order: OutboundOrder = {
    id: String(mockOutboundOrders.length + 1),
    orderNo: generateOrderNo(),
    customerId: customerId,
    customer: customer?.companyName || '',
    shippingAddress: customer?.shippingAddress,
    contact: customer?.contact,
    phone: customer?.phone,
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

createOutboundOrderWithCustomer(
  '1',
  'pending',
  [{ productId: '1', planQuantity: 30, actualQuantity: 0 }],
  '2024-06-03 11:00:00',
  '2024-06-03 11:00:00'
);

createOutboundOrderWithCustomer(
  '2',
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

createOutboundOrderWithCustomer(
  '3',
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

createOutboundOrderWithCustomer(
  '4',
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

createOutboundOrderWithCustomer(
  '1',
  'pending_review',
  [
    {
      productId: '1',
      planQuantity: 20,
      actualQuantity: 20,
      locationId: '1',
      batchNo: 'BATCH20240501',
    },
    {
      productId: '3',
      planQuantity: 15,
      actualQuantity: 15,
      locationId: '8',
      batchNo: 'BATCH20240505',
    },
  ],
  '2024-06-04 09:30:00',
  '2024-06-04 14:00:00',
  '李四'
);

const reviewedOrder = createOutboundOrderWithCustomer(
  '2',
  'completed',
  [
    {
      productId: '2',
      planQuantity: 30,
      actualQuantity: 30,
      locationId: '5',
      batchNo: 'BATCH20240515',
    },
  ],
  '2024-06-03 08:00:00',
  '2024-06-03 16:00:00',
  '系统管理员'
);

if (reviewedOrder) {
  reviewedOrder.reviewRecords = [
    {
      id: '1',
      reviewer: '系统管理员',
      reviewerRole: 'admin',
      reviewTime: '2024-06-03 15:30:00',
      reviewResult: 'pass',
      reviewRemark: '复核通过，商品信息准确无误',
      reviewItems: [
        {
          itemId: '1',
          productId: '2',
          productName: '精密轴承',
          productSku: 'SKU-BR-001',
          planQuantity: 30,
          actualQuantity: 30,
          checkQuantity: 30,
          batchNo: 'BATCH20240515',
          checkBatchNo: 'BATCH20240515',
          checkPass: true,
          checkRemark: '',
        },
      ],
    },
  ];
}

const failedReviewOrder = createOutboundOrderWithCustomer(
  '5',
  'in_progress',
  [
    {
      productId: '7',
      planQuantity: 25,
      actualQuantity: 25,
      locationId: '12',
      batchNo: 'BATCH20240520',
    },
  ],
  '2024-06-04 10:00:00',
  '2024-06-04 15:00:00',
  '王五'
);

if (failedReviewOrder) {
  failedReviewOrder.reviewRecords = [
    {
      id: '1',
      reviewer: '仓库经理',
      reviewerRole: 'manager',
      reviewTime: '2024-06-04 14:30:00',
      reviewResult: 'fail',
      reviewRemark: '批次号不匹配，实际批次为 BATCH20240521，请重新拣货',
      reviewItems: [
        {
          itemId: '1',
          productId: '7',
          productName: '密封圈',
          productSku: 'SKU-SE-001',
          planQuantity: 25,
          actualQuantity: 25,
          checkQuantity: 25,
          batchNo: 'BATCH20240520',
          checkBatchNo: 'BATCH20240521',
          checkPass: false,
          checkRemark: '批次号不符',
        },
      ],
    },
  ];
}

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

export const mockTransferOrders: TransferOrder[] = [];

const createTransferOrder = (
  sourceLocationId: string,
  targetLocationId: string,
  status: 'pending' | 'in_transit' | 'completed',
  items: Array<{
    productId: string;
    quantity: number;
    batchNo: string;
  }>,
  createTime: string,
  updateTime: string,
  operator?: string
) => {
  const sourceLocation = getLocationById(sourceLocationId);
  const targetLocation = getLocationById(targetLocationId);
  if (!sourceLocation || !targetLocation) return;

  const order: TransferOrder = {
    id: String(mockTransferOrders.length + 1),
    orderNo: `TRF${Date.now()}${mockTransferOrders.length + 1}`,
    sourceLocationId,
    sourceLocationCode: sourceLocation.code,
    targetLocationId,
    targetLocationCode: targetLocation.code,
    status,
    items: items.map((item, idx) => {
      const product = getProductById(item.productId);
      return {
        id: `${mockTransferOrders.length + 1}-${idx + 1}`,
        productId: item.productId,
        productName: product?.name || '',
        productSku: product?.sku || '',
        quantity: item.quantity,
        batchNo: item.batchNo,
        sourceLocationId,
        sourceLocationCode: sourceLocation.code,
        targetLocationId,
        targetLocationCode: targetLocation.code,
      };
    }),
    createTime,
    updateTime,
    operator,
  };

  mockTransferOrders.push(order);

  if (status === 'completed') {
    order.items.forEach((item) => {
      const sourceInv = mockInventory.find(
        (inv) =>
          inv.productId === item.productId &&
          inv.locationId === item.sourceLocationId &&
          inv.batchNo === item.batchNo
      );
      removeInventory(item.productId, item.sourceLocationId, item.quantity, item.batchNo);
      addInventory(
        item.productId,
        item.targetLocationId,
        item.quantity,
        item.batchNo,
        sourceInv?.productionDate || new Date().toISOString().split('T')[0],
        sourceInv?.expirationDate
      );
    });
  } else if (status === 'in_transit') {
    order.items.forEach((item) => {
      removeInventory(item.productId, item.sourceLocationId, item.quantity, item.batchNo);
    });
  }

  return order;
};

createTransferOrder(
  '1',
  '2',
  'completed',
  [{ productId: '1', quantity: 10, batchNo: 'BATCH20240515' }],
  '2024-05-20 10:00:00',
  '2024-05-20 10:30:00',
  '张三'
);

createTransferOrder(
  '5',
  '6',
  'in_transit',
  [{ productId: '2', quantity: 30, batchNo: 'BATCH20240516' }],
  '2024-06-03 09:00:00',
  '2024-06-03 09:15:00',
  '李四'
);

createTransferOrder(
  '10',
  '11',
  'pending',
  [{ productId: '5', quantity: 15, batchNo: 'BATCH20240520' }],
  '2024-06-04 14:00:00',
  '2024-06-04 14:00:00'
);

export const mockLocationActivities: LocationActivity[] = mockLocations.map((loc) => {
  const zoneActivityMultiplier: Record<string, number> = {
    'A区': 1.5,
    'B区': 1.2,
    'C区': 0.8,
    'D区': 0.5,
  };
  const multiplier = zoneActivityMultiplier[loc.zone] || 1;
  const levelMultiplier = (5 - loc.level) * 0.3;
  const baseActivity = Math.floor(Math.random() * 30) * multiplier * (1 + levelMultiplier);

  const inboundCount = Math.floor(baseActivity * (0.4 + Math.random() * 0.3));
  const outboundCount = Math.floor(baseActivity * (0.3 + Math.random() * 0.3));

  return {
    locationId: loc.id,
    locationCode: loc.code,
    zone: loc.zone,
    inboundCount,
    outboundCount,
    totalCount: inboundCount + outboundCount,
  };
});

import type { InventoryChangeRecord } from '../types';

export const mockInventoryChangeRecords: InventoryChangeRecord[] = [];

const generateInventoryChangeRecords = () => {
  let recordId = 1;
  const productBalances: Record<string, number> = {};
  const locationBalances: Record<string, number> = {};

  const operators = ['张三', '李四', '王五', '赵六', '孙七'];

  mockInboundOrders
    .filter((o) => o.status === 'completed')
    .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
    .forEach((order) => {
      order.items.forEach((item) => {
        if (item.locationId && item.actualQuantity > 0) {
          const product = getProductById(item.productId);
          const location = getLocationById(item.locationId);
          if (product && location) {
            const key = `${item.productId}-${item.locationId}`;
            productBalances[key] = (productBalances[key] || 0) + item.actualQuantity;
            locationBalances[item.locationId] = (locationBalances[item.locationId] || 0) + item.actualQuantity;

            mockInventoryChangeRecords.push({
              id: String(recordId++),
              type: 'inbound',
              productId: item.productId,
              productName: product.name,
              productSku: product.sku,
              locationId: item.locationId,
              locationCode: location.code,
              batchNo: item.batchNo,
              quantity: item.actualQuantity,
              balanceAfter: productBalances[key],
              orderNo: order.orderNo,
              operator: order.operator || operators[Math.floor(Math.random() * operators.length)],
              operateTime: order.updateTime,
              remark: `从 ${order.supplier} 入库`,
            });
          }
        }
      });
    });

  mockTransferOrders
    .filter((o) => o.status === 'completed')
    .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
    .forEach((order) => {
      order.items.forEach((item) => {
        const product = getProductById(item.productId);
        if (product) {
          const sourceKey = `${item.productId}-${item.sourceLocationId}`;
          const targetKey = `${item.productId}-${item.targetLocationId}`;
          productBalances[sourceKey] = (productBalances[sourceKey] || 0) - item.quantity;
          productBalances[targetKey] = (productBalances[targetKey] || 0) + item.quantity;
          locationBalances[item.sourceLocationId] = (locationBalances[item.sourceLocationId] || 0) - item.quantity;
          locationBalances[item.targetLocationId] = (locationBalances[item.targetLocationId] || 0) + item.quantity;

          mockInventoryChangeRecords.push({
            id: String(recordId++),
            type: 'transfer',
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            locationId: item.sourceLocationId,
            locationCode: item.sourceLocationCode,
            batchNo: item.batchNo,
            quantity: -item.quantity,
            balanceAfter: productBalances[sourceKey],
            orderNo: order.orderNo,
            operator: order.operator || operators[Math.floor(Math.random() * operators.length)],
            operateTime: order.updateTime,
            remark: `调拨出库至 ${item.targetLocationCode}`,
          });

          mockInventoryChangeRecords.push({
            id: String(recordId++),
            type: 'transfer',
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            locationId: item.targetLocationId,
            locationCode: item.targetLocationCode,
            batchNo: item.batchNo,
            quantity: item.quantity,
            balanceAfter: productBalances[targetKey],
            orderNo: order.orderNo,
            operator: order.operator || operators[Math.floor(Math.random() * operators.length)],
            operateTime: order.updateTime,
            remark: `调拨入库自 ${item.sourceLocationCode}`,
          });
        }
      });
    });

  mockOutboundOrders
    .filter((o) => o.status === 'completed')
    .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())
    .forEach((order) => {
      order.items.forEach((item) => {
        if (item.locationId && item.batchNo && item.actualQuantity > 0) {
          const product = getProductById(item.productId);
          const location = getLocationById(item.locationId);
          if (product && location) {
            const key = `${item.productId}-${item.locationId}`;
            productBalances[key] = (productBalances[key] || 0) - item.actualQuantity;
            locationBalances[item.locationId] = (locationBalances[item.locationId] || 0) - item.actualQuantity;

            mockInventoryChangeRecords.push({
              id: String(recordId++),
              type: 'outbound',
              productId: item.productId,
              productName: product.name,
              productSku: product.sku,
              locationId: item.locationId,
              locationCode: location.code,
              batchNo: item.batchNo,
              quantity: -item.actualQuantity,
              balanceAfter: Math.max(0, productBalances[key]),
              orderNo: order.orderNo,
              operator: order.operator || operators[Math.floor(Math.random() * operators.length)],
              operateTime: order.updateTime,
              remark: `出库至 ${order.customer}`,
            });
          }
        }
      });
    });

  mockStocktakePlans
    .filter((p) => p.status === 'in_progress' || p.status === 'completed')
    .forEach((plan) => {
      plan.items
        .filter((item) => item.status === 'counted' && item.diffQuantity !== 0)
        .forEach((item) => {
          const product = getProductById(item.productId);
          const location = getLocationById(item.locationId);
          if (product && location) {
            const key = `${item.productId}-${item.locationId}`;
            productBalances[key] = (productBalances[key] || item.systemQuantity) + item.diffQuantity;
            locationBalances[item.locationId] = (locationBalances[item.locationId] || item.systemQuantity) + item.diffQuantity;

            mockInventoryChangeRecords.push({
              id: String(recordId++),
              type: 'adjust',
              productId: item.productId,
              productName: product.name,
              productSku: product.sku,
              locationId: item.locationId,
              locationCode: location.code,
              batchNo: item.batchNo,
              quantity: item.diffQuantity,
              balanceAfter: Math.max(0, productBalances[key]),
              orderNo: plan.planNo,
              operator: plan.operator || operators[Math.floor(Math.random() * operators.length)],
              operateTime: plan.startTime || plan.createTime,
              remark: `盘点调整: 系统${item.systemQuantity} → 实际${item.actualQuantity}`,
            });
          }
        });
    });

  mockInventoryChangeRecords.sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
};

generateInventoryChangeRecords();

import type { CycleCountConfig } from '../types';

export const mockCycleCountConfigs: CycleCountConfig[] = [
  {
    id: '1',
    name: 'A类商品月度盘点',
    period: 'monthly',
    scope: 'abc',
    abcValues: ['A'],
    enabled: true,
    lastGenerateTime: '2024-05-01 08:00:00',
    nextGenerateTime: '2024-06-01 08:00:00',
    autoGenerate: true,
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-05-01 08:00:00',
    operator: '系统管理员',
    remark: '每月盘点高价值A类商品',
  },
  {
    id: '2',
    name: 'A区周度盘点',
    period: 'weekly',
    scope: 'zone',
    zoneValues: ['A区'],
    enabled: true,
    lastGenerateTime: '2024-05-27 08:00:00',
    nextGenerateTime: '2024-06-03 08:00:00',
    autoGenerate: true,
    createTime: '2024-02-15 10:00:00',
    updateTime: '2024-05-27 08:00:00',
    operator: '系统管理员',
    remark: '每周盘点A区高周转区域',
  },
  {
    id: '3',
    name: '电气设备季度盘点',
    period: 'quarterly',
    scope: 'category',
    categoryValues: ['电气设备'],
    enabled: false,
    lastGenerateTime: '2024-04-01 08:00:00',
    nextGenerateTime: '2024-07-01 08:00:00',
    autoGenerate: false,
    createTime: '2024-01-15 14:00:00',
    updateTime: '2024-04-01 08:00:00',
    operator: '系统管理员',
    remark: '每季度盘点电气设备类商品',
  },
];

export const getABCClass = (productId: string): ABCClass => {
  const product = getProductById(productId);
  if (!product) return 'C';
  if (product.price >= 1000) return 'A';
  if (product.price >= 100) return 'B';
  return 'C';
};

import type { StockAgeRange, StockAgeItem, StockAgeStat, StockAgeData, StockAgeFilter } from '../types';

const getStockAgeRange = (days: number): StockAgeRange => {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

const rangeLabels: Record<StockAgeRange, string> = {
  '0-30': '0-30天',
  '31-60': '31-60天',
  '61-90': '61-90天',
  '90+': '90天以上',
};

export const generateStockAgeData = (filter?: StockAgeFilter): StockAgeData => {
  const today = new Date('2026-06-06');
  const items: StockAgeItem[] = [];

  mockInventory.forEach((inv) => {
    const product = getProductById(inv.productId);
    const location = getLocationById(inv.locationId);
    if (!product || !location) return;

    if (filter?.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(product.category)) return;
    }
    if (filter?.zones && filter.zones.length > 0) {
      if (!filter.zones.includes(location.zone)) return;
    }

    const prodDate = new Date(inv.productionDate);
    const stockDays = Math.floor((today.getTime() - prodDate.getTime()) / (1000 * 60 * 60 * 24));
    const ageRange = getStockAgeRange(stockDays);
    const amount = product.price * inv.quantity;

    items.push({
      productId: inv.productId,
      productName: inv.productName,
      productSku: inv.productSku,
      category: product.category,
      zone: location.zone,
      locationCode: inv.locationCode,
      batchNo: inv.batchNo,
      quantity: inv.quantity,
      price: product.price,
      amount,
      productionDate: inv.productionDate,
      stockDays,
      ageRange,
    });
  });

  const ranges: StockAgeRange[] = ['0-30', '31-60', '61-90', '90+'];
  const stats: StockAgeStat[] = ranges.map((range) => ({
    range,
    label: rangeLabels[range],
    quantity: 0,
    quantityRatio: 0,
    amount: 0,
    amountRatio: 0,
  }));

  let totalQuantity = 0;
  let totalAmount = 0;

  items.forEach((item) => {
    totalQuantity += item.quantity;
    totalAmount += item.amount;
    const stat = stats.find((s) => s.range === item.ageRange);
    if (stat) {
      stat.quantity += item.quantity;
      stat.amount += item.amount;
    }
  });

  stats.forEach((stat) => {
    stat.quantityRatio = totalQuantity > 0 ? Math.round((stat.quantity / totalQuantity) * 10000) / 100 : 0;
    stat.amountRatio = totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 10000) / 100 : 0;
  });

  const overageStat = stats.find((s) => s.range === '90+')!;
  const overageQuantity = overageStat.quantity;
  const overageAmount = overageStat.amount;
  const overageQuantityRatio = overageStat.quantityRatio;
  const overageAmountRatio = overageStat.amountRatio;

  return {
    stats,
    items,
    totalQuantity,
    totalAmount,
    overageQuantity,
    overageAmount,
    overageQuantityRatio,
    overageAmountRatio,
  };
};

export const mockStockAgeData: StockAgeData = generateStockAgeData();

import type { ABCAnalysisItem, ABCAnalysisData, ABCAnalysisFilter, ABCAnalysisSummary, ABCClass } from '../types';

const calculateABCClassByCumulative = (cumulativeRatio: number): ABCClass => {
  if (cumulativeRatio <= 70) return 'A';
  if (cumulativeRatio <= 90) return 'B';
  return 'C';
};

const combineABCClasses = (amountClass: ABCClass, frequencyClass: ABCClass): ABCClass => {
  const classMatrix: Record<string, ABCClass> = {
    'A-A': 'A',
    'A-B': 'A',
    'A-C': 'B',
    'B-A': 'A',
    'B-B': 'B',
    'B-C': 'C',
    'C-A': 'B',
    'C-B': 'C',
    'C-C': 'C',
  };
  return classMatrix[`${amountClass}-${frequencyClass}`] || 'C';
};

export const generateABCAnalysisData = (
  startDate?: string,
  endDate?: string,
  filter?: ABCAnalysisFilter
): ABCAnalysisData => {
  const today = new Date('2026-06-06');
  const start = startDate ? new Date(startDate) : new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : today;

  const productStats = new Map<string, {
    totalQuantity: number;
    totalAmount: number;
    inboundCount: number;
    outboundCount: number;
  }>();

  mockProducts.forEach((product) => {
    productStats.set(product.id, {
      totalQuantity: 0,
      totalAmount: 0,
      inboundCount: 0,
      outboundCount: 0,
    });
  });

  mockInventory.forEach((inv) => {
    const product = getProductById(inv.productId);
    if (!product) return;
    const stats = productStats.get(inv.productId);
    if (stats) {
      stats.totalQuantity += inv.quantity;
      stats.totalAmount += inv.quantity * product.price;
    }
  });

  mockInboundOrders
    .filter((o) => o.status === 'completed')
    .forEach((order) => {
      const orderDate = new Date(order.createTime);
      if (orderDate < start || orderDate > end) return;
      order.items.forEach((item) => {
        const stats = productStats.get(item.productId);
        if (stats) {
          stats.inboundCount += 1;
        }
      });
    });

  mockOutboundOrders
    .filter((o) => o.status === 'completed')
    .forEach((order) => {
      const orderDate = new Date(order.createTime);
      if (orderDate < start || orderDate > end) return;
      order.items.forEach((item) => {
        const stats = productStats.get(item.productId);
        if (stats) {
          stats.outboundCount += 1;
        }
      });
    });

  let items: ABCAnalysisItem[] = [];
  mockProducts.forEach((product) => {
    const stats = productStats.get(product.id);
    if (!stats) return;

    if (filter?.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(product.category)) return;
    }

    const totalTransactionCount = stats.inboundCount + stats.outboundCount;

    items.push({
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price,
      totalQuantity: stats.totalQuantity,
      totalAmount: stats.totalAmount,
      amountRatio: 0,
      cumulativeAmountRatio: 0,
      inboundCount: stats.inboundCount,
      outboundCount: stats.outboundCount,
      totalTransactionCount,
      frequencyRatio: 0,
      cumulativeFrequencyRatio: 0,
      abcClass: 'C',
      amountClass: 'C',
      frequencyClass: 'C',
    });
  });

  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalFrequency = items.reduce((sum, item) => sum + item.totalTransactionCount, 0);

  items.forEach((item) => {
    item.amountRatio = totalAmount > 0 ? Math.round((item.totalAmount / totalAmount) * 10000) / 100 : 0;
    item.frequencyRatio = totalFrequency > 0 ? Math.round((item.totalTransactionCount / totalFrequency) * 10000) / 100 : 0;
  });

  const sortedByAmount = [...items].sort((a, b) => b.totalAmount - a.totalAmount);
  let cumulativeAmount = 0;
  sortedByAmount.forEach((item) => {
    cumulativeAmount += item.totalAmount;
    const cumulativeRatio = totalAmount > 0 ? Math.round((cumulativeAmount / totalAmount) * 10000) / 100 : 0;
    const originalItem = items.find((i) => i.productId === item.productId);
    if (originalItem) {
      originalItem.cumulativeAmountRatio = cumulativeRatio;
      originalItem.amountClass = calculateABCClassByCumulative(cumulativeRatio);
    }
  });

  const sortedByFrequency = [...items].sort((a, b) => b.totalTransactionCount - a.totalTransactionCount);
  let cumulativeFrequency = 0;
  sortedByFrequency.forEach((item) => {
    cumulativeFrequency += item.totalTransactionCount;
    const cumulativeRatio = totalFrequency > 0 ? Math.round((cumulativeFrequency / totalFrequency) * 10000) / 100 : 0;
    const originalItem = items.find((i) => i.productId === item.productId);
    if (originalItem) {
      originalItem.cumulativeFrequencyRatio = cumulativeRatio;
      originalItem.frequencyClass = calculateABCClassByCumulative(cumulativeRatio);
    }
  });

  items.forEach((item) => {
    item.abcClass = combineABCClasses(item.amountClass, item.frequencyClass);
  });

  if (filter?.abcClasses && filter.abcClasses.length > 0) {
    items = items.filter((item) => filter.abcClasses!.includes(item.abcClass));
  }

  items.sort((a, b) => {
    const classOrder: Record<ABCClass, number> = { A: 0, B: 1, C: 2 };
    if (classOrder[a.abcClass] !== classOrder[b.abcClass]) {
      return classOrder[a.abcClass] - classOrder[b.abcClass];
    }
    return b.totalAmount - a.totalAmount;
  });

  const summary: ABCAnalysisSummary = {
    classA: { count: 0, countRatio: 0, totalAmount: 0, amountRatio: 0, totalFrequency: 0, frequencyRatio: 0 },
    classB: { count: 0, countRatio: 0, totalAmount: 0, amountRatio: 0, totalFrequency: 0, frequencyRatio: 0 },
    classC: { count: 0, countRatio: 0, totalAmount: 0, amountRatio: 0, totalFrequency: 0, frequencyRatio: 0 },
    totalProducts: items.length,
    totalAmount,
    totalFrequency,
  };

  items.forEach((item) => {
    const classKey = `class${item.abcClass}` as keyof ABCAnalysisSummary;
    const classSummary = summary[classKey] as ABCAnalysisSummary['classA'];
    classSummary.count += 1;
    classSummary.totalAmount += item.totalAmount;
    classSummary.totalFrequency += item.totalTransactionCount;
  });

  (['classA', 'classB', 'classC'] as const).forEach((classKey) => {
    const classSummary = summary[classKey];
    classSummary.countRatio = summary.totalProducts > 0 ? Math.round((classSummary.count / summary.totalProducts) * 10000) / 100 : 0;
    classSummary.amountRatio = totalAmount > 0 ? Math.round((classSummary.totalAmount / totalAmount) * 10000) / 100 : 0;
    classSummary.frequencyRatio = totalFrequency > 0 ? Math.round((classSummary.totalFrequency / totalFrequency) * 10000) / 100 : 0;
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return {
    items,
    summary,
    timeRange: {
      start: formatDate(start),
      end: formatDate(end),
    },
    calculateTime: new Date().toLocaleString(),
  };
};

export const mockABCAnalysisData: ABCAnalysisData = generateABCAnalysisData();

export const LARGE_DIFF_THRESHOLD = 20;

export const mockStockDifferenceItems: StockDifferenceItem[] = [];
export const mockStockAdjustmentOrders: StockAdjustmentOrder[] = [];

const generateDifferenceItems = () => {
  let diffId = 1;

  mockStocktakePlans.forEach((plan) => {
    plan.items
      .filter((item) => item.diffQuantity !== 0)
      .forEach((item) => {
        const diffRatio = item.systemQuantity > 0
          ? Math.abs(item.diffQuantity) / item.systemQuantity * 100
          : item.diffQuantity !== 0 ? 100 : 0;
        const isLargeDiff = diffRatio >= LARGE_DIFF_THRESHOLD || Math.abs(item.diffQuantity) >= 50;

        mockStockDifferenceItems.push({
          id: `DIFF-${diffId++}`,
          stocktakePlanId: plan.id,
          stocktakePlanNo: plan.planNo,
          stocktakeItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          locationId: item.locationId,
          locationCode: item.locationCode,
          batchNo: item.batchNo,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          diffQuantity: item.diffQuantity,
          diffRatio: Math.round(diffRatio * 100) / 100,
          isLargeDiff,
          status: 'pending',
        });
      });
  });
};

generateDifferenceItems();

export const generateDifferenceItemsFromPlan = (plan: StocktakePlan): StockDifferenceItem[] => {
  const items: StockDifferenceItem[] = [];
  let diffId = Date.now();

  plan.items
    .filter((item) => item.diffQuantity !== 0)
    .forEach((item) => {
      const diffRatio = item.systemQuantity > 0
        ? Math.abs(item.diffQuantity) / item.systemQuantity * 100
        : item.diffQuantity !== 0 ? 100 : 0;
      const isLargeDiff = diffRatio >= LARGE_DIFF_THRESHOLD || Math.abs(item.diffQuantity) >= 50;

      items.push({
        id: `DIFF-${diffId++}`,
        stocktakePlanId: plan.id,
        stocktakePlanNo: plan.planNo,
        stocktakeItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        locationId: item.locationId,
        locationCode: item.locationCode,
        batchNo: item.batchNo,
        systemQuantity: item.systemQuantity,
        actualQuantity: item.actualQuantity,
        diffQuantity: item.diffQuantity,
        diffRatio: Math.round(diffRatio * 100) / 100,
        isLargeDiff,
        status: 'pending',
      });
    });

  return items;
};

import type { OperationLog, OperationLogType } from '../types';
import { OperationLogTypeLabels } from '../types';

const statusMap: Record<string, string> = {
  pending: '待处理',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  pending_review: '待复核',
  split: '已拆分',
  draft: '草稿',
  pending_confirm: '待确认',
  confirmed: '已确认',
  in_transit: '运输中',
};

const generateMockOperationLogs = (): OperationLog[] => {
  const logs: OperationLog[] = [];
  let logId = 1;
  const now = new Date('2026-06-06T18:00:00');

  const users = [mockUser, mockManager, mockOperator];

  const addLog = (
    operatorIndex: number,
    operationType: OperationLogType,
    targetType: string,
    targetId: string,
    targetName: string,
    fieldChanges: OperationLog['fieldChanges'],
    daysAgo: number,
    hoursAgo: number,
    remark?: string
  ) => {
    const opTime = new Date(now);
    opTime.setDate(opTime.getDate() - daysAgo);
    opTime.setHours(opTime.getHours() - hoursAgo);

    const user = users[operatorIndex];
    logs.push({
      id: `LOG-${logId++}`,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      operateTime: opTime.toLocaleString(),
      operationType,
      operationTypeName: OperationLogTypeLabels[operationType],
      targetType,
      targetId,
      targetName,
      fieldChanges,
      remark,
      ipAddress: `192.168.1.${100 + operatorIndex}`,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    });
  };

  addLog(0, 'login', 'user', '1', '系统管理员', [], 0, 10, '用户登录系统');
  addLog(1, 'login', 'user', '2', '仓库经理', [], 0, 9, '用户登录系统');
  addLog(2, 'login', 'user', '3', '仓库操作员', [], 0, 8, '用户登录系统');

  mockInboundOrders.forEach((order, idx) => {
    addLog(
      idx % 3,
      'inbound_create',
      'inbound',
      order.id,
      order.orderNo,
      [
        { field: 'supplier', fieldName: '供应商', oldValue: null, newValue: order.supplier },
        { field: 'status', fieldName: '状态', oldValue: null, newValue: statusMap[order.status] },
      ],
      idx + 1,
      idx * 2,
      `创建入库单，共${order.items.length}项商品`
    );

    if (order.status !== 'pending') {
      addLog(
        idx % 3,
        'inbound_status_change',
        'inbound',
        order.id,
        order.orderNo,
        [
          { field: 'status', fieldName: '状态', oldValue: statusMap['pending'], newValue: statusMap[order.status] },
        ],
        idx,
        idx * 2 + 1,
        `入库单状态变更`
      );
    }
  });

  mockOutboundOrders.forEach((order, idx) => {
    addLog(
      idx % 3,
      'outbound_create',
      'outbound',
      order.id,
      order.orderNo,
      [
        { field: 'customer', fieldName: '客户', oldValue: null, newValue: order.customer },
        { field: 'status', fieldName: '状态', oldValue: null, newValue: statusMap[order.status] },
      ],
      idx + 2,
      idx * 2,
      `创建出库单，共${order.items.length}项商品`
    );

    if (order.status !== 'pending') {
      addLog(
        (idx + 1) % 3,
        'outbound_status_change',
        'outbound',
        order.id,
        order.orderNo,
        [
          { field: 'status', fieldName: '状态', oldValue: statusMap['pending'], newValue: statusMap[order.status] },
        ],
        idx + 1,
        idx * 2 + 2,
        `出库单状态变更`
      );
    }
  });

  mockStocktakePlans.forEach((plan, idx) => {
    addLog(
      idx % 3,
      'stocktake_create',
      'stocktake',
      plan.id,
      plan.planNo,
      [
        { field: 'name', fieldName: '盘点名称', oldValue: null, newValue: plan.name },
        { field: 'type', fieldName: '盘点类型', oldValue: null, newValue: plan.type === 'full' ? '全盘' : plan.type === 'partial' ? '抽盘' : '周期盘点' },
      ],
      idx + 3,
      idx * 3,
      `创建盘点计划，共${plan.items.length}项商品`
    );

    if (plan.status === 'completed') {
      addLog(
        idx % 3,
        'stocktake_status_change',
        'stocktake',
        plan.id,
        plan.planNo,
        [
          { field: 'status', fieldName: '状态', oldValue: statusMap['pending'], newValue: statusMap[plan.status] },
        ],
        idx + 2,
        idx * 3 + 1,
        `盘点计划完成`
      );
    }

    plan.items.filter((item) => item.diffQuantity !== 0).forEach((item, itemIdx) => {
      addLog(
        idx % 3,
        'stocktake_result_edit',
        'stocktake_item',
        item.id,
        item.productName,
        [
          { field: 'actualQuantity', fieldName: '实际数量', oldValue: 0, newValue: item.actualQuantity },
          { field: 'systemQuantity', fieldName: '系统数量', oldValue: null, newValue: item.systemQuantity },
          { field: 'diffQuantity', fieldName: '差异数量', oldValue: null, newValue: item.diffQuantity },
        ],
        idx + 2,
        idx * 3 + itemIdx + 2,
        `盘点结果录入: ${item.productSku}`
      );
    });
  });

  mockTransferOrders.forEach((order, idx) => {
    addLog(
      idx % 3,
      'transfer_create',
      'transfer',
      order.id,
      order.orderNo,
      [
        { field: 'sourceLocationCode', fieldName: '源库位', oldValue: null, newValue: order.sourceLocationCode },
        { field: 'targetLocationCode', fieldName: '目标库位', oldValue: null, newValue: order.targetLocationCode },
      ],
      idx + 2,
      idx * 2 + 4,
      `创建调拨单，共${order.items.length}项商品`
    );

    if (order.status !== 'pending') {
      addLog(
        (idx + 2) % 3,
        'transfer_status_change',
        'transfer',
        order.id,
        order.orderNo,
        [
          { field: 'status', fieldName: '状态', oldValue: statusMap['pending'], newValue: statusMap[order.status] },
        ],
        idx + 1,
        idx * 2 + 5,
        `调拨单状态变更`
      );
    }
  });

  mockStockAdjustmentOrders.forEach((order, idx) => {
    order.items.forEach((item, itemIdx) => {
      addLog(
        idx % 3,
        'inventory_adjust',
        'inventory',
        item.id,
        item.productName,
        [
          { field: 'systemQuantity', fieldName: '系统数量', oldValue: item.systemQuantity, newValue: item.actualQuantity },
          { field: 'adjustQuantity', fieldName: '调整数量', oldValue: null, newValue: item.adjustQuantity },
        ],
        idx + 1,
        idx * 2 + itemIdx + 3,
        `库存调整: ${item.productSku} @ ${item.locationCode}`
      );
    });
  });

  addLog(0, 'logout', 'user', '1', '系统管理员', [], 0, 2, '用户退出系统');
  addLog(1, 'logout', 'user', '2', '仓库经理', [], 0, 3, '用户退出系统');
  addLog(2, 'logout', 'user', '3', '仓库操作员', [], 0, 1, '用户退出系统');

  logs.sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  return logs;
};

export const mockOperationLogs: OperationLog[] = generateMockOperationLogs();
