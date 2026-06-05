import { create } from 'zustand';
import type {
  Supplier,
  Customer,
  Location,
  Inventory,
  InboundOrder,
  OutboundOrder,
  StocktakePlan,
  Product,
  ReportData,
  CustomerStats,
  TransferOrder,
  InventoryBatch,
  BatchTraceData,
  BatchTraceEvent,
  OutboundSplitData,
} from '../types';
import {
  mockSuppliers,
  mockCustomers,
  mockLocations,
  mockInventory,
  mockInboundOrders,
  mockOutboundOrders,
  mockStocktakePlans,
  mockProducts,
  mockReportData,
  mockTransferOrders,
} from '../mock/data';

export interface InventorySummary {
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  unit: string;
  totalQuantity: number;
  safetyStockMin: number;
  safetyStockMax: number;
  stockStatus: 'normal' | 'low' | 'overstock';
  locationCount: number;
}

interface WarehouseState {
  suppliers: Supplier[];
  customers: Customer[];
  locations: Location[];
  inventory: Inventory[];
  inboundOrders: InboundOrder[];
  outboundOrders: OutboundOrder[];
  stocktakePlans: StocktakePlan[];
  products: Product[];
  reportData: ReportData;
  transferOrders: TransferOrder[];
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerStats: (customerId: string) => CustomerStats;
  addInboundOrder: (order: InboundOrder) => void;
  updateInboundOrder: (id: string, order: Partial<InboundOrder>) => void;
  addOutboundOrder: (order: OutboundOrder) => void;
  updateOutboundOrder: (id: string, order: Partial<OutboundOrder>) => void;
  updateStocktakeItem: (planId: string, itemId: string, actual: number) => void;
  completeStocktake: (planId: string) => void;
  updateProductSafetyStock: (id: string, safetyStockMin: number, safetyStockMax: number) => void;
  getInventorySummary: () => InventorySummary[];
  getLowStockCount: () => number;
  getOverstockCount: () => number;
  addTransferOrder: (order: TransferOrder) => void;
  updateTransferOrder: (id: string, order: Partial<TransferOrder>) => void;
  startTransfer: (id: string) => void;
  completeTransfer: (id: string) => void;
  getInventoryBatches: () => InventoryBatch[];
  getBatchTraceData: (batchNo: string) => BatchTraceData | null;
  splitOutboundOrder: (splitData: OutboundSplitData) => OutboundOrder[];
  getChildOrders: (parentId: string) => OutboundOrder[];
  getParentOrder: (childId: string) => OutboundOrder | undefined;
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  suppliers: mockSuppliers,
  customers: mockCustomers,
  locations: mockLocations,
  inventory: mockInventory,
  inboundOrders: mockInboundOrders,
  outboundOrders: mockOutboundOrders,
  stocktakePlans: mockStocktakePlans,
  products: mockProducts,
  reportData: mockReportData,
  transferOrders: mockTransferOrders,

  addSupplier: (supplier) =>
    set((state) => ({
      suppliers: [...state.suppliers, supplier],
    })),

  updateSupplier: (id, supplier) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) =>
        s.id === id ? { ...s, ...supplier, updateTime: new Date().toLocaleString() } : s
      ),
    })),

  deleteSupplier: (id) =>
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== id),
    })),

  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),

  updateCustomer: (id, customer) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...customer, updateTime: new Date().toLocaleString() } : c
      ),
    })),

  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),

  getCustomerStats: (customerId) => {
    const state = get();
    const customerOrders = state.outboundOrders.filter(
      (o) => o.customerId === customerId && o.status === 'completed'
    );

    const totalAmount = customerOrders.reduce((sum, order) => {
      const orderAmount = order.items.reduce((s, item) => {
        const product = state.products.find((p) => p.id === item.productId);
        return s + (product?.price || 0) * item.actualQuantity;
      }, 0);
      return sum + orderAmount;
    }, 0);

    const lastOutboundTime =
      customerOrders.length > 0
        ? customerOrders.sort(
            (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
          )[0].createTime
        : '-';

    return {
      customerId,
      totalOutboundAmount: totalAmount,
      lastOutboundTime,
    };
  },

  addInboundOrder: (order) =>
    set((state) => ({
      inboundOrders: [...state.inboundOrders, order],
    })),

  updateInboundOrder: (id, order) =>
    set((state) => ({
      inboundOrders: state.inboundOrders.map((o) =>
        o.id === id ? { ...o, ...order } : o
      ),
    })),

  addOutboundOrder: (order) =>
    set((state) => ({
      outboundOrders: [...state.outboundOrders, order],
    })),

  updateOutboundOrder: (id, order) =>
    set((state) => ({
      outboundOrders: state.outboundOrders.map((o) =>
        o.id === id ? { ...o, ...order } : o
      ),
    })),

  updateStocktakeItem: (planId, itemId, actual) =>
    set((state) => ({
      stocktakePlans: state.stocktakePlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              items: plan.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      actualQuantity: actual,
                      diffQuantity: actual - item.systemQuantity,
                      status: 'counted',
                    }
                  : item
              ),
            }
          : plan
      ),
    })),

  completeStocktake: (planId) =>
    set((state) => ({
      stocktakePlans: state.stocktakePlans.map((plan) =>
        plan.id === planId
          ? { ...plan, status: 'completed', endTime: new Date().toISOString() }
          : plan
      ),
    })),

  updateProductSafetyStock: (id, safetyStockMin, safetyStockMax) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, safetyStockMin, safetyStockMax } : p
      ),
    })),

  getInventorySummary: () => {
    const state = get();
    const summaryMap = new Map<string, { totalQuantity: number; locationCount: number; locationIds: Set<string> }>();

    state.inventory.forEach((inv) => {
      const existing = summaryMap.get(inv.productId);
      if (existing) {
        existing.totalQuantity += inv.quantity;
        existing.locationIds.add(inv.locationId);
        existing.locationCount = existing.locationIds.size;
      } else {
        summaryMap.set(inv.productId, {
          totalQuantity: inv.quantity,
          locationCount: 1,
          locationIds: new Set([inv.locationId]),
        });
      }
    });

    return state.products.map((product) => {
      const summary = summaryMap.get(product.id) || { totalQuantity: 0, locationCount: 0, locationIds: new Set() };
      let stockStatus: 'normal' | 'low' | 'overstock' = 'normal';
      if (summary.totalQuantity < product.safetyStockMin) {
        stockStatus = 'low';
      } else if (summary.totalQuantity > product.safetyStockMax) {
        stockStatus = 'overstock';
      }
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        category: product.category,
        unit: product.unit,
        totalQuantity: summary.totalQuantity,
        safetyStockMin: product.safetyStockMin,
        safetyStockMax: product.safetyStockMax,
        stockStatus,
        locationCount: summary.locationCount,
      };
    });
  },

  getLowStockCount: () => {
    const summary = get().getInventorySummary();
    return summary.filter((s) => s.stockStatus === 'low').length;
  },

  getOverstockCount: () => {
    const summary = get().getInventorySummary();
    return summary.filter((s) => s.stockStatus === 'overstock').length;
  },

  addTransferOrder: (order) =>
    set((state) => ({
      transferOrders: [...state.transferOrders, order],
    })),

  updateTransferOrder: (id, order) =>
    set((state) => ({
      transferOrders: state.transferOrders.map((o) =>
        o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
      ),
    })),

  startTransfer: (id) => {
    const state = get();
    const order = state.transferOrders.find((o) => o.id === id);
    if (!order || order.status !== 'pending') return;

    const newInventory = [...state.inventory];
    const newLocations = [...state.locations];

    order.items.forEach((item) => {
      const invIndex = newInventory.findIndex(
        (inv) =>
          inv.productId === item.productId &&
          inv.locationId === item.sourceLocationId &&
          inv.batchNo === item.batchNo
      );

      if (invIndex > -1) {
        const inv = newInventory[invIndex];
        if (inv.quantity >= item.quantity) {
          inv.quantity -= item.quantity;
          inv.updateTime = new Date().toLocaleString();

          if (inv.quantity <= 0) {
            newInventory.splice(invIndex, 1);
          }

          const locIndex = newLocations.findIndex((l) => l.id === item.sourceLocationId);
          if (locIndex > -1) {
            const loc = newLocations[locIndex];
            loc.current -= item.quantity;
            loc.status =
              loc.current === 0 ? 'empty' : loc.current >= loc.capacity ? 'full' : 'normal';
          }
        }
      }
    });

    set((state) => ({
      inventory: newInventory,
      locations: newLocations,
      transferOrders: state.transferOrders.map((o) =>
        o.id === id
          ? { ...o, status: 'in_transit' as const, updateTime: new Date().toLocaleString() }
          : o
      ),
    }));
  },

  completeTransfer: (id) => {
    const state = get();
    const order = state.transferOrders.find((o) => o.id === id);
    if (!order || order.status !== 'in_transit') return;

    const newInventory = [...state.inventory];
    const newLocations = [...state.locations];

    order.items.forEach((item) => {
      const existingInv = newInventory.find(
        (inv) =>
          inv.productId === item.productId &&
          inv.locationId === item.targetLocationId &&
          inv.batchNo === item.batchNo
      );

      if (existingInv) {
        existingInv.quantity += item.quantity;
        existingInv.updateTime = new Date().toLocaleString();
      } else {
        const product = state.products.find((p) => p.id === item.productId);
        const sourceInv = state.inventory.find(
          (inv) =>
            inv.productId === item.productId &&
            inv.locationId === item.sourceLocationId &&
            inv.batchNo === item.batchNo
        );
        if (product) {
          newInventory.push({
            id: String(Date.now() + Math.random()),
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            locationId: item.targetLocationId,
            locationCode: item.targetLocationCode,
            quantity: item.quantity,
            batchNo: item.batchNo,
            productionDate: sourceInv?.productionDate || new Date().toISOString().split('T')[0],
            expirationDate: sourceInv?.expirationDate,
            updateTime: new Date().toLocaleString(),
          });
        }
      }

      const locIndex = newLocations.findIndex((l) => l.id === item.targetLocationId);
      if (locIndex > -1) {
        const loc = newLocations[locIndex];
        loc.current += item.quantity;
        loc.status =
          loc.current === 0 ? 'empty' : loc.current >= loc.capacity ? 'full' : 'normal';
      }
    });

    set((state) => ({
      inventory: newInventory,
      locations: newLocations,
      transferOrders: state.transferOrders.map((o) =>
        o.id === id
          ? { ...o, status: 'completed' as const, updateTime: new Date().toLocaleString() }
          : o
      ),
    }));
  },

  getInventoryBatches: () => {
    const state = get();
    const batchMap = new Map<string, InventoryBatch>();

    state.inventory.forEach((inv) => {
      const key = `${inv.productId}-${inv.batchNo}`;
      const existing = batchMap.get(key);
      if (existing) {
        existing.totalQuantity += inv.quantity;
        existing.locations.push({
          locationCode: inv.locationCode,
          quantity: inv.quantity,
        });
        existing.locationCount = existing.locations.length;
      } else {
        const product = state.products.find((p) => p.id === inv.productId);
        if (product) {
          let stockStatus: InventoryBatch['stockStatus'] = 'normal';
          if (inv.expirationDate) {
            const now = new Date();
            const expDate = new Date(inv.expirationDate);
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              stockStatus = 'expired';
            } else if (diffDays <= 30) {
              stockStatus = 'expiring';
            }
          }
          if (stockStatus === 'normal') {
            if (inv.quantity < product.safetyStockMin) {
              stockStatus = 'low';
            } else if (inv.quantity > product.safetyStockMax) {
              stockStatus = 'overstock';
            }
          }

          batchMap.set(key, {
            productId: inv.productId,
            productName: inv.productName,
            productSku: inv.productSku,
            category: product.category,
            unit: product.unit,
            batchNo: inv.batchNo,
            productionDate: inv.productionDate,
            expirationDate: inv.expirationDate,
            totalQuantity: inv.quantity,
            locationCount: 1,
            locations: [
              {
                locationCode: inv.locationCode,
                quantity: inv.quantity,
              },
            ],
            stockStatus,
          });
        }
      }
    });

    return Array.from(batchMap.values());
  },

  getBatchTraceData: (batchNo: string) => {
    const state = get();
    const inventoryItems = state.inventory.filter((inv) => inv.batchNo === batchNo);

    if (inventoryItems.length === 0) {
      return null;
    }

    const firstItem = inventoryItems[0];
    const product = state.products.find((p) => p.id === firstItem.productId);
    if (!product) return null;

    const timeline: BatchTraceEvent[] = [];
    let totalInbound = 0;
    let totalOutbound = 0;

    let inboundOrder: BatchTraceData['inboundOrder'] = null;
    for (const order of state.inboundOrders) {
      for (const item of order.items) {
        if (item.batchNo === batchNo && item.actualQuantity > 0) {
          inboundOrder = {
            orderNo: order.orderNo,
            supplier: order.supplier,
            createTime: order.createTime,
            operator: order.operator,
            quantity: item.actualQuantity,
          };
          totalInbound += item.actualQuantity;
          timeline.push({
            type: 'inbound',
            time: order.createTime,
            description: `从 ${order.supplier} 入库`,
            orderNo: order.orderNo,
            locationCode: item.locationCode,
            quantity: item.actualQuantity,
            operator: order.operator,
          });
        }
      }
    }

    const outboundRecords: BatchTraceData['outboundRecords'] = [];
    for (const order of state.outboundOrders) {
      for (const item of order.items) {
        if (item.batchNo === batchNo && item.actualQuantity > 0) {
          outboundRecords.push({
            orderNo: order.orderNo,
            customer: order.customer,
            createTime: order.createTime,
            locationCode: item.locationCode || '-',
            quantity: item.actualQuantity,
            operator: order.operator,
          });
          totalOutbound += item.actualQuantity;
          timeline.push({
            type: 'outbound',
            time: order.createTime,
            description: `出库至 ${order.customer}`,
            orderNo: order.orderNo,
            locationCode: item.locationCode,
            quantity: item.actualQuantity,
            operator: order.operator,
          });
        }
      }
    }

    const transferRecords: BatchTraceData['transferRecords'] = [];
    for (const order of state.transferOrders) {
      for (const item of order.items) {
        if (item.batchNo === batchNo) {
          const statusMap: Record<string, string> = {
            pending: '待处理',
            in_transit: '运输中',
            completed: '已完成',
            cancelled: '已取消',
          };
          transferRecords.push({
            orderNo: order.orderNo,
            sourceLocation: item.sourceLocationCode,
            targetLocation: item.targetLocationCode,
            createTime: order.createTime,
            quantity: item.quantity,
            operator: order.operator,
            status: statusMap[order.status] || order.status,
          });
          timeline.push({
            type: 'transfer',
            time: order.createTime,
            description: `从 ${item.sourceLocationCode} 移库至 ${item.targetLocationCode}`,
            orderNo: order.orderNo,
            quantity: item.quantity,
            operator: order.operator,
            remark: statusMap[order.status],
          });
        }
      }
    }

    for (const plan of state.stocktakePlans) {
      for (const item of plan.items) {
        if (item.batchNo === batchNo && item.status === 'counted') {
          timeline.push({
            type: 'stocktake',
            time: plan.startTime || plan.createTime,
            description: `盘点: ${plan.name}`,
            orderNo: plan.planNo,
            locationCode: item.locationCode,
            quantity: item.diffQuantity,
            operator: plan.operator,
            remark: `系统: ${item.systemQuantity}, 实际: ${item.actualQuantity}, 差异: ${item.diffQuantity > 0 ? '+' : ''}${item.diffQuantity}`,
          });
        }
      }
    }

    timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    const currentLocations = inventoryItems.map((inv) => ({
      locationCode: inv.locationCode,
      quantity: inv.quantity,
    }));

    const remainingQuantity = currentLocations.reduce((sum, loc) => sum + loc.quantity, 0);

    return {
      batchNo,
      productId: firstItem.productId,
      productName: firstItem.productName,
      productSku: firstItem.productSku,
      category: product.category,
      unit: product.unit,
      productionDate: firstItem.productionDate,
      expirationDate: firstItem.expirationDate,
      inboundOrder,
      currentLocations,
      outboundRecords,
      transferRecords,
      timeline,
      totalInbound,
      totalOutbound,
      remainingQuantity,
    };
  },

  splitOutboundOrder: (splitData) => {
    const state = get();
    const parentOrder = state.outboundOrders.find((o) => o.id === splitData.parentOrderId);
    if (!parentOrder) return [];

    const now = new Date().toLocaleString();
    const childIds: string[] = [];
    const newOrders: OutboundOrder[] = [];

    splitData.subOrders.forEach((subOrder, index) => {
      const childId = `${parentOrder.id}-${index + 1}`;
      childIds.push(childId);

      const childOrder: OutboundOrder = {
        id: childId,
        orderNo: `${parentOrder.orderNo}-${index + 1}`,
        customerId: parentOrder.customerId,
        customer: parentOrder.customer,
        shippingAddress: parentOrder.shippingAddress,
        contact: parentOrder.contact,
        phone: parentOrder.phone,
        status: 'pending',
        items: subOrder.items.map((item, itemIdx) => ({
          id: `${childId}-${itemIdx + 1}`,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          planQuantity: item.planQuantity,
          actualQuantity: 0,
          batchNo: item.batchNo,
        })),
        createTime: now,
        updateTime: now,
        remark: subOrder.remark,
        parentId: parentOrder.id,
      };

      newOrders.push(childOrder);
    });

    const updatedParentOrder: OutboundOrder = {
      ...parentOrder,
      status: 'split',
      isParent: true,
      childIds,
      splitTime: now,
      splitRemark: splitData.splitRemark,
      updateTime: now,
    };

    set((state) => ({
      outboundOrders: [
        ...state.outboundOrders.map((o) =>
          o.id === parentOrder.id ? updatedParentOrder : o
        ),
        ...newOrders,
      ],
    }));

    return newOrders;
  },

  getChildOrders: (parentId) => {
    const state = get();
    return state.outboundOrders.filter((o) => o.parentId === parentId);
  },

  getParentOrder: (childId) => {
    const state = get();
    const childOrder = state.outboundOrders.find((o) => o.id === childId);
    if (!childOrder || !childOrder.parentId) return undefined;
    return state.outboundOrders.find((o) => o.id === childOrder.parentId);
  },
}));
