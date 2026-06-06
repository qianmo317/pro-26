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
  LocationActivity,
  HeatmapDimension,
  InventoryChangeRecord,
  InventoryChangeType,
  CycleCountConfig,
  CycleCountRecommendation,
  CycleCountPeriod,
  ABCClass,
  StockAgeData,
  StockAgeFilter,
  StockAgeItem,
  ReviewRecord,
  ReviewItem,
  User,
  ABCAnalysisData,
  ABCAnalysisFilter,
  StockDifferenceItem,
  StockAdjustmentOrder,
  StockAdjustmentItem,
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
  mockLocationActivities,
  mockInventoryChangeRecords,
  mockCycleCountConfigs,
  mockStockDifferenceItems,
  mockStockAdjustmentOrders,
  LARGE_DIFF_THRESHOLD,
  generateDifferenceItemsFromPlan,
  getABCClass,
  generateStockAgeData,
  generateABCAnalysisData,
} from '../mock/data';
import { useAppStore } from './appStore';

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
  locationActivities: LocationActivity[];
  inventoryChangeRecords: InventoryChangeRecord[];
  cycleCountConfigs: CycleCountConfig[];
  stockDifferenceItems: StockDifferenceItem[];
  stockAdjustmentOrders: StockAdjustmentOrder[];
  largeDiffThreshold: number;
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
  getDifferenceItemsByPlan: (planId: string) => StockDifferenceItem[];
  getPendingDifferenceItems: () => StockDifferenceItem[];
  confirmDifferenceItem: (id: string, operator: string, remark?: string) => void;
  ignoreDifferenceItem: (id: string, operator: string, remark?: string) => void;
  createStockAdjustmentOrder: (planId: string, differenceItemIds: string[], operator: string, remark?: string) => StockAdjustmentOrder | null;
  confirmStockAdjustmentOrder: (orderId: string, confirmer: string, remark?: string) => void;
  completeStockAdjustmentOrder: (orderId: string, operator: string) => void;
  cancelStockAdjustmentOrder: (orderId: string, operator: string, remark?: string) => void;
  getStockAdjustmentOrdersByPlan: (planId: string) => StockAdjustmentOrder[];
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
  getLocationActivity: (locationId: string) => LocationActivity | undefined;
  getTopActiveLocations: (dimension: HeatmapDimension, limit?: number) => LocationActivity[];
  getTopInactiveLocations: (dimension: HeatmapDimension, limit?: number) => LocationActivity[];
  getMaxActivityCount: (dimension: HeatmapDimension) => number;
  getInventoryChangeByProduct: (productId: string, types?: InventoryChangeType[]) => InventoryChangeRecord[];
  getInventoryChangeByLocation: (locationId: string, types?: InventoryChangeType[]) => InventoryChangeRecord[];
  addCycleCountConfig: (config: Omit<CycleCountConfig, 'id' | 'createTime' | 'updateTime' | 'nextGenerateTime'>) => void;
  updateCycleCountConfig: (id: string, config: Partial<CycleCountConfig>) => void;
  deleteCycleCountConfig: (id: string) => void;
  toggleCycleCountConfig: (id: string) => void;
  getCycleCountRecommendation: (configId: string) => CycleCountRecommendation | null;
  generateStocktakePlanFromConfig: (configId: string) => StocktakePlan | null;
  checkAndGenerateAutoPlans: () => StocktakePlan[];
  getLastStocktakeTime: (productId: string, locationId: string) => string | undefined;
  getABCClassForProduct: (productId: string) => ABCClass;
  calculateNextGenerateTime: (period: CycleCountPeriod, lastTime?: string) => string;
  getStockAgeData: (filter?: StockAgeFilter) => StockAgeData;
  getCategories: () => string[];
  getZones: () => string[];
  exportOverageItems: (items: StockAgeItem[]) => void;
  canReview: (user: User | null) => boolean;
  getABCAnalysisData: (startDate?: string, endDate?: string, filter?: ABCAnalysisFilter) => ABCAnalysisData;
  exportABCAnalysis: (data: ABCAnalysisData) => void;
  submitForReview: (orderId: string, operator?: string) => void;
  reviewOutboundOrder: (
    orderId: string,
    reviewResult: 'pass' | 'fail',
    reviewItems: ReviewItem[],
    reviewer: User,
    reviewRemark?: string
  ) => void;
  getPendingReviewOrders: () => OutboundOrder[];
  lockLocations: (locationIds: string[], reason: string, operator: string) => number;
  unlockLocations: (locationIds: string[], reason: string, operator: string) => number;
  isLocationLocked: (locationId: string) => boolean;
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
  locationActivities: mockLocationActivities,
  inventoryChangeRecords: mockInventoryChangeRecords,
  cycleCountConfigs: mockCycleCountConfigs,
  stockDifferenceItems: mockStockDifferenceItems,
  stockAdjustmentOrders: mockStockAdjustmentOrders,
  largeDiffThreshold: LARGE_DIFF_THRESHOLD,

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

  addInboundOrder: (order) => {
    useAppStore.getState().addNotification({
      type: 'inbound',
      title: '新入库单待处理',
      orderNo: order.orderNo,
      message: `供应商: ${order.supplier}`,
    });
    set((state) => ({
      inboundOrders: [...state.inboundOrders, order],
    }));
  },

  updateInboundOrder: (id, order) => {
    const state = get();
    const existingOrder = state.inboundOrders.find((o) => o.id === id);
    if (!existingOrder) return;

    if (order.status === 'completed') {
      for (const item of existingOrder.items) {
        if (item.locationId && state.isLocationLocked(item.locationId)) {
          const loc = state.locations.find((l) => l.id === item.locationId);
          throw new Error(`库位 ${loc?.code || item.locationId} 已被锁定，禁止入库。原因：${loc?.lockReason || '无'}`);
        }
      }
    }

    set((state) => ({
      inboundOrders: state.inboundOrders.map((o) =>
        o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
      ),
    }));
  },

  addOutboundOrder: (order) => {
    useAppStore.getState().addNotification({
      type: 'outbound',
      title: '新出库单待处理',
      orderNo: order.orderNo,
      message: `客户: ${order.customer}`,
    });
    set((state) => ({
      outboundOrders: [...state.outboundOrders, order],
    }));
  },

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

  completeStocktake: (planId) => {
    const state = get();
    const plan = state.stocktakePlans.find((p) => p.id === planId);
    if (!plan) return;

    const newDifferenceItems = generateDifferenceItemsFromPlan({
      ...plan,
      status: 'completed',
      endTime: new Date().toISOString(),
    });

    set((state) => ({
      stocktakePlans: state.stocktakePlans.map((plan) =>
        plan.id === planId
          ? { ...plan, status: 'completed', endTime: new Date().toISOString() }
          : plan
      ),
      stockDifferenceItems: [...state.stockDifferenceItems, ...newDifferenceItems],
    }));

    if (newDifferenceItems.length > 0) {
      useAppStore.getState().addNotification({
        type: 'stocktake',
        title: '盘点差异待处理',
        orderNo: plan.planNo,
        message: `发现 ${newDifferenceItems.length} 项差异，其中 ${newDifferenceItems.filter((d) => d.isLargeDiff).length} 项差异较大`,
      });
    }
  },

  getDifferenceItemsByPlan: (planId) => {
    return get().stockDifferenceItems.filter((item) => item.stocktakePlanId === planId);
  },

  getPendingDifferenceItems: () => {
    return get().stockDifferenceItems.filter((item) => item.status === 'pending');
  },

  confirmDifferenceItem: (id, operator, remark) => {
    const now = new Date().toLocaleString();
    set((state) => ({
      stockDifferenceItems: state.stockDifferenceItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'confirmed',
              confirmedBy: operator,
              confirmedTime: now,
              remark: remark || item.remark,
            }
          : item
      ),
    }));
  },

  ignoreDifferenceItem: (id, operator, remark) => {
    const now = new Date().toLocaleString();
    set((state) => ({
      stockDifferenceItems: state.stockDifferenceItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'ignored',
              confirmedBy: operator,
              confirmedTime: now,
              remark: remark || item.remark,
            }
          : item
      ),
    }));
  },

  createStockAdjustmentOrder: (planId, differenceItemIds, operator, remark) => {
    const state = get();
    const plan = state.stocktakePlans.find((p) => p.id === planId);
    if (!plan) return null;

    const selectedItems = state.stockDifferenceItems.filter(
      (item) =>
        item.stocktakePlanId === planId &&
        differenceItemIds.includes(item.id) &&
        (item.status === 'pending' || item.status === 'confirmed')
    );

    if (selectedItems.length === 0) return null;

    const hasLargeDiff = selectedItems.some((item) => item.isLargeDiff);
    const largeDiffCount = selectedItems.filter((item) => item.isLargeDiff).length;

    const now = new Date().toLocaleString();
    const orderNo = `ADJ${Date.now()}`;

    const adjustmentItems: StockAdjustmentItem[] = selectedItems.map((item, idx) => ({
      id: `${orderNo}-${idx + 1}`,
      differenceItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      locationId: item.locationId,
      locationCode: item.locationCode,
      batchNo: item.batchNo,
      systemQuantity: item.systemQuantity,
      actualQuantity: item.actualQuantity,
      adjustQuantity: item.diffQuantity,
    }));

    const newOrder: StockAdjustmentOrder = {
      id: orderNo,
      orderNo,
      stocktakePlanId: planId,
      stocktakePlanNo: plan.planNo,
      status: hasLargeDiff ? 'pending_confirm' : 'draft',
      items: adjustmentItems,
      totalAdjustCount: selectedItems.length,
      largeDiffCount,
      createTime: now,
      updateTime: now,
      operator,
      remark,
    };

    set((state) => ({
      stockAdjustmentOrders: [...state.stockAdjustmentOrders, newOrder],
      stockDifferenceItems: state.stockDifferenceItems.map((item) =>
        differenceItemIds.includes(item.id)
          ? { ...item, status: 'confirmed', adjustmentOrderId: orderNo }
          : item
      ),
    }));

    return newOrder;
  },

  confirmStockAdjustmentOrder: (orderId, confirmer, remark) => {
    const now = new Date().toLocaleString();
    set((state) => ({
      stockAdjustmentOrders: state.stockAdjustmentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'confirmed',
              confirmer,
              confirmTime: now,
              updateTime: now,
              remark: remark || order.remark,
            }
          : order
      ),
    }));
  },

  completeStockAdjustmentOrder: (orderId, operator) => {
    const state = get();
    const order = state.stockAdjustmentOrders.find((o) => o.id === orderId);
    if (!order) return;

    const newInventory = [...state.inventory];
    const newLocations = [...state.locations];
    const newChangeRecords = [...state.inventoryChangeRecords];
    const now = new Date().toLocaleString();
    let recordId = newChangeRecords.length + 1;

    order.items.forEach((item) => {
      const invIndex = newInventory.findIndex(
        (inv) =>
          inv.productId === item.productId &&
          inv.locationId === item.locationId &&
          inv.batchNo === item.batchNo
      );

      if (invIndex > -1) {
        const inv = newInventory[invIndex];
        const oldQuantity = inv.quantity;
        inv.quantity = item.actualQuantity;
        inv.updateTime = now;

        if (inv.quantity <= 0) {
          newInventory.splice(invIndex, 1);
        }

        const locIndex = newLocations.findIndex((l) => l.id === item.locationId);
        if (locIndex > -1) {
          const loc = newLocations[locIndex];
          loc.current = loc.current - oldQuantity + item.actualQuantity;
          loc.status =
            loc.current === 0
              ? 'empty'
              : loc.current >= loc.capacity
              ? 'full'
              : 'normal';
        }

        newChangeRecords.unshift({
          id: String(recordId++),
          type: 'adjust',
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          locationId: item.locationId,
          locationCode: item.locationCode,
          batchNo: item.batchNo,
          quantity: item.adjustQuantity,
          balanceAfter: item.actualQuantity,
          orderNo: order.orderNo,
          operator,
          operateTime: now,
          remark: `盘点调整: 系统${item.systemQuantity} → 实际${item.actualQuantity}`,
        });
      }
    });

    const differenceItemIds = order.items.map((item) => item.differenceItemId);

    set((state) => ({
      inventory: newInventory,
      locations: newLocations,
      inventoryChangeRecords: newChangeRecords,
      stockAdjustmentOrders: state.stockAdjustmentOrders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'completed', completeTime: now, updateTime: now, operator }
          : o
      ),
      stockDifferenceItems: state.stockDifferenceItems.map((item) =>
        differenceItemIds.includes(item.id)
          ? { ...item, status: 'adjusted' }
          : item
      ),
      stocktakePlans: state.stocktakePlans.map((plan) =>
        plan.id === order.stocktakePlanId
          ? {
              ...plan,
              items: plan.items.map((planItem) => {
                const adjustItem = order.items.find(
                  (i) =>
                    i.productId === planItem.productId &&
                    i.locationId === planItem.locationId &&
                    i.batchNo === planItem.batchNo
                );
                if (adjustItem) {
                  return { ...planItem, status: 'adjusted' };
                }
                return planItem;
              }),
            }
          : plan
      ),
    }));
  },

  cancelStockAdjustmentOrder: (orderId, _operator, remark) => {
    const state = get();
    const order = state.stockAdjustmentOrders.find((o) => o.id === orderId);
    if (!order) return;

    const now = new Date().toLocaleString();
    const differenceItemIds = order.items.map((item) => item.differenceItemId);

    set((state) => ({
      stockAdjustmentOrders: state.stockAdjustmentOrders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'cancelled', updateTime: now, remark: remark || o.remark }
          : o
      ),
      stockDifferenceItems: state.stockDifferenceItems.map((item) =>
        differenceItemIds.includes(item.id)
          ? { ...item, status: 'pending', adjustmentOrderId: undefined }
          : item
      ),
    }));
  },

  getStockAdjustmentOrdersByPlan: (planId) => {
    return get().stockAdjustmentOrders.filter((order) => order.stocktakePlanId === planId);
  },

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

  getLocationActivity: (locationId) => {
    const state = get();
    return state.locationActivities.find((a) => a.locationId === locationId);
  },

  getTopActiveLocations: (dimension, limit = 10) => {
    const state = get();
    const key = dimension === 'inbound' ? 'inboundCount' : dimension === 'outbound' ? 'outboundCount' : 'totalCount';
    return [...state.locationActivities]
      .sort((a, b) => b[key] - a[key])
      .slice(0, limit);
  },

  getTopInactiveLocations: (dimension, limit = 10) => {
    const state = get();
    const key = dimension === 'inbound' ? 'inboundCount' : dimension === 'outbound' ? 'outboundCount' : 'totalCount';
    return [...state.locationActivities]
      .sort((a, b) => a[key] - b[key])
      .slice(0, limit);
  },

  getMaxActivityCount: (dimension) => {
    const state = get();
    const key = dimension === 'inbound' ? 'inboundCount' : dimension === 'outbound' ? 'outboundCount' : 'totalCount';
    return state.locationActivities.reduce((max, a) => Math.max(max, a[key]), 0);
  },

  getInventoryChangeByProduct: (productId, types) => {
    const state = get();
    const records = state.inventoryChangeRecords.filter((r) => r.productId === productId);
    if (types && types.length > 0) {
      return records.filter((r) => types.includes(r.type));
    }
    return records;
  },

  getInventoryChangeByLocation: (locationId, types) => {
    const state = get();
    const records = state.inventoryChangeRecords.filter((r) => r.locationId === locationId);
    if (types && types.length > 0) {
      return records.filter((r) => types.includes(r.type));
    }
    return records;
  },

  getABCClassForProduct: (productId) => {
    return getABCClass(productId);
  },

  calculateNextGenerateTime: (period, lastTime) => {
    const baseTime = lastTime ? new Date(lastTime) : new Date();
    const next = new Date(baseTime);

    switch (period) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    next.setHours(8, 0, 0, 0);
    return next.toLocaleString();
  },

  getLastStocktakeTime: (productId, locationId) => {
    const state = get();
    let lastTime: string | undefined;

    for (const plan of state.stocktakePlans) {
      if (plan.status === 'completed' || plan.status === 'in_progress') {
        for (const item of plan.items) {
          if (item.productId === productId && item.locationId === locationId) {
            const planTime = plan.endTime || plan.startTime || plan.createTime;
            if (!lastTime || new Date(planTime) > new Date(lastTime)) {
              lastTime = planTime;
            }
          }
        }
      }
    }

    return lastTime;
  },

  addCycleCountConfig: (config) => {
    const now = new Date().toLocaleString();
    const nextGenerateTime = get().calculateNextGenerateTime(config.period, config.lastGenerateTime);
    const newConfig: CycleCountConfig = {
      ...config,
      id: String(Date.now()),
      createTime: now,
      updateTime: now,
      nextGenerateTime,
    };
    set((state) => ({
      cycleCountConfigs: [...state.cycleCountConfigs, newConfig],
    }));
  },

  updateCycleCountConfig: (id, config) => {
    const now = new Date().toLocaleString();
    set((state) => ({
      cycleCountConfigs: state.cycleCountConfigs.map((c) =>
        c.id === id
          ? {
              ...c,
              ...config,
              updateTime: now,
              nextGenerateTime: config.period
                ? get().calculateNextGenerateTime(config.period, c.lastGenerateTime)
                : c.nextGenerateTime,
            }
          : c
      ),
    }));
  },

  deleteCycleCountConfig: (id) => {
    set((state) => ({
      cycleCountConfigs: state.cycleCountConfigs.filter((c) => c.id !== id),
    }));
  },

  toggleCycleCountConfig: (id) => {
    set((state) => ({
      cycleCountConfigs: state.cycleCountConfigs.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled, updateTime: new Date().toLocaleString() } : c
      ),
    }));
  },

  getCycleCountRecommendation: (configId) => {
    const state = get();
    const config = state.cycleCountConfigs.find((c) => c.id === configId);
    if (!config) return null;

    const periodDays: Record<string, number> = {
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    const periodDayCount = periodDays[config.period] || 30;
    const now = new Date();

    const recommendedItems: CycleCountRecommendation['recommendedItems'] = [];

    for (const inv of state.inventory) {
      const product = state.products.find((p) => p.id === inv.productId);
      const location = state.locations.find((l) => l.id === inv.locationId);
      if (!product || !location) continue;

      let matchesScope = false;
      if (config.scope === 'zone' && config.zoneValues?.includes(location.zone)) {
        matchesScope = true;
      } else if (config.scope === 'category' && config.categoryValues?.includes(product.category)) {
        matchesScope = true;
      } else if (config.scope === 'abc') {
        const abcClass = state.getABCClassForProduct(product.id);
        if (config.abcValues?.includes(abcClass)) {
          matchesScope = true;
        }
      }

      if (!matchesScope) continue;

      const lastStocktakeTime = state.getLastStocktakeTime(product.id, location.id);
      const lastDate = lastStocktakeTime ? new Date(lastStocktakeTime) : new Date(0);
      const daysSinceLastStocktake = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastStocktake >= periodDayCount * 0.8) {
        recommendedItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          locationId: location.id,
          locationCode: location.code,
          lastStocktakeTime,
          daysSinceLastStocktake,
          abcClass: state.getABCClassForProduct(product.id),
          category: product.category,
          zone: location.zone,
        });
      }
    }

    recommendedItems.sort((a, b) => b.daysSinceLastStocktake - a.daysSinceLastStocktake);

    const scopeText: Record<string, string> = {
      zone: `区域: ${config.zoneValues?.join(', ')}`,
      category: `类别: ${config.categoryValues?.join(', ')}`,
      abc: `ABC分类: ${config.abcValues?.join(', ')}`,
    };

    let reason = `根据 ${config.period === 'weekly' ? '每周' : config.period === 'monthly' ? '每月' : config.period === 'quarterly' ? '每季度' : '每年'} 盘点周期，`;
    reason += `筛选出 ${recommendedItems.length} 项超过 ${Math.floor(periodDayCount * 0.8)} 天未盘点的库存。`;
    reason += ` 优先级：按距离上次盘点天数降序排列。`;

    return {
      configId: config.id,
      configName: config.name,
      recommendedScope: scopeText[config.scope],
      recommendedItems,
      reason,
    };
  },

  generateStocktakePlanFromConfig: (configId) => {
    const state = get();
    const config = state.cycleCountConfigs.find((c) => c.id === configId);
    if (!config) return null;

    const recommendation = state.getCycleCountRecommendation(configId);
    if (!recommendation) return null;

    const now = new Date().toLocaleString();
    const planNo = `STK-CYC-${Date.now()}`;

    const locationIds = new Set<string>();
    const items: StocktakePlan['items'] = [];

    recommendation.recommendedItems.forEach((rec, idx) => {
      const inv = state.inventory.find(
        (i) => i.productId === rec.productId && i.locationId === rec.locationId
      );
      if (inv) {
        locationIds.add(inv.locationId);
        items.push({
          id: String(idx + 1),
          inventoryId: inv.id,
          productId: inv.productId,
          productName: inv.productName,
          productSku: inv.productSku,
          locationId: inv.locationId,
          locationCode: inv.locationCode,
          systemQuantity: inv.quantity,
          actualQuantity: 0,
          diffQuantity: 0,
          status: 'pending',
          batchNo: inv.batchNo,
        });
      }
    });

    if (items.length === 0) return null;

    const newPlan: StocktakePlan = {
      id: String(Date.now()),
      planNo,
      name: `${config.name} - ${new Date().toLocaleDateString()}`,
      type: 'cycle',
      status: 'pending',
      locationIds: Array.from(locationIds),
      items,
      createTime: now,
      operator: '系统自动',
      remark: `由周期盘点配置"${config.name}"自动生成`,
    };

    set((state) => ({
      stocktakePlans: [...state.stocktakePlans, newPlan],
      cycleCountConfigs: state.cycleCountConfigs.map((c) =>
        c.id === configId
          ? {
              ...c,
              lastGenerateTime: now,
              nextGenerateTime: state.calculateNextGenerateTime(c.period, now),
              updateTime: now,
            }
          : c
      ),
    }));

    return newPlan;
  },

  checkAndGenerateAutoPlans: () => {
    const state = get();
    const now = new Date();
    const generatedPlans: StocktakePlan[] = [];

    for (const config of state.cycleCountConfigs) {
      if (!config.enabled || !config.autoGenerate) continue;
      if (!config.nextGenerateTime) continue;

      const nextGenerateDate = new Date(config.nextGenerateTime);
      if (now >= nextGenerateDate) {
        const plan = state.generateStocktakePlanFromConfig(config.id);
        if (plan) {
          generatedPlans.push(plan);
        }
      }
    }

    return generatedPlans;
  },

  getStockAgeData: (filter) => {
    return generateStockAgeData(filter);
  },

  getCategories: () => {
    const state = get();
    const categories = new Set(state.products.map((p) => p.category));
    return Array.from(categories);
  },

  getZones: () => {
    const state = get();
    const zones = new Set(state.locations.map((l) => l.zone));
    return Array.from(zones);
  },

  exportOverageItems: (items) => {
    const headers = ['商品SKU', '商品名称', '类别', '区域', '库位', '批次号', '数量', '单价', '金额', '生产日期', '库龄(天)'];
    const rows = items.map((item) => [
      item.productSku,
      item.productName,
      item.category,
      item.zone,
      item.locationCode,
      item.batchNo,
      item.quantity,
      item.price,
      item.amount,
      item.productionDate,
      item.stockDays,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `超龄商品列表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getABCAnalysisData: (startDate, endDate, filter) => {
    return generateABCAnalysisData(startDate, endDate, filter);
  },

  exportABCAnalysis: (data) => {
    const headers = ['ABC分类', '商品SKU', '商品名称', '类别', '单价(元)', '库存数量', '库存金额(元)', '金额占比(%)', '入库次数', '出库次数', '总频次', '频次占比(%)', '金额维度分类', '频次维度分类'];
    const rows = data.items.map((item) => [
      item.abcClass,
      item.productSku,
      item.productName,
      item.category,
      item.price,
      item.totalQuantity,
      item.totalAmount,
      item.amountRatio,
      item.inboundCount,
      item.outboundCount,
      item.totalTransactionCount,
      item.frequencyRatio,
      item.amountClass,
      item.frequencyClass,
    ]);

    const summaryRows = [
      [],
      ['汇总统计', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['分类', '商品数量', '数量占比(%)', '库存金额(元)', '金额占比(%)', '总频次', '频次占比(%)', '', '', '', '', '', '', ''],
      ['A类', data.summary.classA.count, data.summary.classA.countRatio, data.summary.classA.totalAmount, data.summary.classA.amountRatio, data.summary.classA.totalFrequency, data.summary.classA.frequencyRatio, '', '', '', '', '', '', ''],
      ['B类', data.summary.classB.count, data.summary.classB.countRatio, data.summary.classB.totalAmount, data.summary.classB.amountRatio, data.summary.classB.totalFrequency, data.summary.classB.frequencyRatio, '', '', '', '', '', '', ''],
      ['C类', data.summary.classC.count, data.summary.classC.countRatio, data.summary.classC.totalAmount, data.summary.classC.amountRatio, data.summary.classC.totalFrequency, data.summary.classC.frequencyRatio, '', '', '', '', '', '', ''],
      ['合计', data.summary.totalProducts, '100', data.summary.totalAmount, '100', data.summary.totalFrequency, '100', '', '', '', '', '', '', ''],
      [],
      [`分析时间范围: ${data.timeRange.start} 至 ${data.timeRange.end}`, '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [`计算时间: ${data.calculateTime}`, '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ];

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(',')), ...summaryRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ABC分析报表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  canReview: (user) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'manager';
  },

  submitForReview: (orderId, operator) => {
    const state = get();
    const order = state.outboundOrders.find((o) => o.id === orderId);
    if (!order || order.status !== 'in_progress') return;

    const now = new Date().toLocaleString();
    set((state) => ({
      outboundOrders: state.outboundOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'pending_review',
              updateTime: now,
              operator: operator || o.operator,
            }
          : o
      ),
    }));
  },

  reviewOutboundOrder: (orderId, reviewResult, reviewItems, reviewer, reviewRemark) => {
    const state = get();
    const order = state.outboundOrders.find((o) => o.id === orderId);
    if (!order || order.status !== 'pending_review') return;

    const now = new Date().toLocaleString();
    const reviewRecord: ReviewRecord = {
      id: String(Date.now()),
      reviewer: reviewer.name,
      reviewerRole: reviewer.role,
      reviewTime: now,
      reviewResult,
      reviewRemark,
      reviewItems,
    };

    const existingRecords = order.reviewRecords || [];
    const newStatus = reviewResult === 'pass' ? 'completed' : 'in_progress';

    set((state) => ({
      outboundOrders: state.outboundOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              updateTime: now,
              operator: reviewer.name,
              reviewRecords: [...existingRecords, reviewRecord],
            }
          : o
      ),
    }));
  },

  getPendingReviewOrders: () => {
    const state = get();
    return state.outboundOrders.filter((o) => o.status === 'pending_review');
  },

  lockLocations: (locationIds, reason, operator) => {
    const state = get();
    const now = new Date().toLocaleString();
    let updatedCount = 0;

    const newLocations = state.locations.map((loc) => {
      if (locationIds.includes(loc.id) && loc.status !== 'locked') {
        updatedCount++;
        return {
          ...loc,
          status: 'locked' as const,
          lockReason: reason,
          lockOperator: operator,
          lockTime: now,
        };
      }
      return loc;
    });

    set({ locations: newLocations });
    return updatedCount;
  },

  unlockLocations: (locationIds, _reason, _operator) => {
    const state = get();
    let updatedCount = 0;

    const newLocations = state.locations.map((loc) => {
      if (locationIds.includes(loc.id) && loc.status === 'locked') {
        updatedCount++;
        const newStatus = loc.current === 0
          ? 'empty' as const
          : loc.current >= loc.capacity
          ? 'full' as const
          : 'normal' as const;
        return {
          ...loc,
          status: newStatus,
          lockReason: undefined,
          lockOperator: undefined,
          lockTime: undefined,
        };
      }
      return loc;
    });

    set({ locations: newLocations });
    return updatedCount;
  },

  isLocationLocked: (locationId) => {
    const state = get();
    const loc = state.locations.find((l) => l.id === locationId);
    return loc?.status === 'locked';
  },
}));
