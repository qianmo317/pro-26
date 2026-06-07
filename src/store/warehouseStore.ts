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
  InventorySnapshotData,
  InventorySnapshotItem,
  Task,
  TaskStatus,
  TaskStats,
  InboundItem,
  OutboundItem,
  StocktakeItem,
  OperationLog,
  OperationLogType,
  OperationLogFilter,
} from '../types';
import { OperationLogTypeLabels } from '../types';
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
  mockOperationLogs,
  LARGE_DIFF_THRESHOLD,
  generateDifferenceItemsFromPlan,
  getABCClass,
  generateStockAgeData,
  generateABCAnalysisData,
} from '../mock/data';
import { useAppStore } from './appStore';
import { useAuthStore } from './authStore';
import * as XLSX from 'xlsx';

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
  operationLogs: OperationLog[];
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
  restoreInboundOrder: (id: string) => void;
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
  getInventorySnapshot: (targetDate: string) => InventorySnapshotData;
  exportInventorySnapshotToExcel: (data: InventorySnapshotData) => void;
  getTasks: () => Task[];
  getTaskStats: () => TaskStats;
  updateTaskStatus: (taskId: string, taskType: Task['type'], newStatus: TaskStatus) => void;
  getTaskDetail: (taskId: string, taskType: Task['type']) => {
    order: InboundOrder | OutboundOrder | StocktakePlan | null;
    items: (InboundItem | OutboundItem | StocktakeItem)[];
  } | null;
  addOperationLog: (log: Omit<OperationLog, 'id' | 'operateTime' | 'operatorRole' | 'operationTypeName'>) => void;
  getOperationLogs: (filter?: OperationLogFilter, currentUser?: User | null) => OperationLog[];
  getOperationLogById: (id: string, currentUser?: User | null) => OperationLog | null;
  getOperationTypes: () => { value: OperationLogType; label: string }[];
  getOperators: () => { value: string; label: string }[];
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
  operationLogs: mockOperationLogs,
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
    
    if (order.operator) {
      const user = useAuthStore.getState().user;
      if (user) {
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'inbound_create',
          targetType: 'inbound',
          targetId: order.id,
          targetName: order.orderNo,
          fieldChanges: [
            { field: 'supplier', fieldName: '供应商', oldValue: null, newValue: order.supplier },
            { field: 'status', fieldName: '状态', oldValue: null, newValue: '待处理' },
            { field: 'itemCount', fieldName: '商品项数', oldValue: null, newValue: order.items.length },
          ],
          remark: `创建入库单，供应商: ${order.supplier}`,
        });
      }
    }
    
    set((state) => ({
      inboundOrders: [...state.inboundOrders, order],
    }));
  },

  updateInboundOrder: (id, order) => {
    const state = get();
    const existingOrder = state.inboundOrders.find((o) => o.id === id);
    if (!existingOrder) return;

    if (order.status && order.status !== existingOrder.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [],
        cancelled: ['in_progress'],
      };

      const allowedTransitions = validTransitions[existingOrder.status] || [];
      if (!allowedTransitions.includes(order.status)) {
        const statusMap: Record<string, string> = {
          pending: '待处理',
          in_progress: '处理中',
          completed: '已完成',
          cancelled: '已取消',
        };
        throw new Error(
          `非法状态跳转: 无法从 ${statusMap[existingOrder.status] || existingOrder.status} 变更为 ${statusMap[order.status] || order.status}`
        );
      }

      if (order.status === 'completed') {
        for (const item of existingOrder.items) {
          if (item.locationId && state.isLocationLocked(item.locationId)) {
            const loc = state.locations.find((l) => l.id === item.locationId);
            throw new Error(`库位 ${loc?.code || item.locationId} 已被锁定，禁止入库。原因：${loc?.lockReason || '无'}`);
          }
        }
      }

      const user = useAuthStore.getState().user;
      if (user) {
        const statusMap: Record<string, string> = {
          pending: '待处理',
          in_progress: '处理中',
          completed: '已完成',
          cancelled: '已取消',
        };
        
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'inbound_status_change',
          targetType: 'inbound',
          targetId: existingOrder.id,
          targetName: existingOrder.orderNo,
          fieldChanges: [
            {
              field: 'status',
              fieldName: '状态',
              oldValue: statusMap[existingOrder.status] || existingOrder.status,
              newValue: statusMap[order.status] || order.status,
            },
          ],
          remark: `入库单状态从 ${statusMap[existingOrder.status]} 变更为 ${statusMap[order.status]}`,
        });
      }

      if (order.status === 'completed') {
        const newInventory = [...state.inventory];
        const newLocations = [...state.locations];
        const newChangeRecords = [...state.inventoryChangeRecords];
        const now = new Date().toLocaleString();
        let recordId = newChangeRecords.length + 1;
        const operatorName = user?.name || existingOrder.operator || '系统';

        existingOrder.items.forEach((item) => {
          if (item.receivedQuantity <= 0 || !item.locationId) return;

          const invIndex = newInventory.findIndex(
            (inv) =>
              inv.productId === item.productId &&
              inv.locationId === item.locationId &&
              inv.batchNo === item.batchNo
          );

          let newBalance = item.receivedQuantity;

          if (invIndex > -1) {
            const inv = newInventory[invIndex];
            inv.quantity += item.receivedQuantity;
            inv.updateTime = now;
            newBalance = inv.quantity;
          } else {
            newInventory.push({
              id: String(Date.now() + Math.random()),
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              locationId: item.locationId,
              locationCode: item.locationCode || '',
              quantity: item.receivedQuantity,
              batchNo: item.batchNo,
              productionDate: item.productionDate,
              expirationDate: item.expirationDate,
              updateTime: now,
            });
          }

          const locIndex = newLocations.findIndex((l) => l.id === item.locationId);
          if (locIndex > -1) {
            const loc = newLocations[locIndex];
            loc.current += item.receivedQuantity;
            loc.status =
              loc.current === 0
                ? 'empty'
                : loc.current >= loc.capacity
                ? 'full'
                : 'normal';
          }

          newChangeRecords.unshift({
            id: String(recordId++),
            type: 'inbound',
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            locationId: item.locationId,
            locationCode: item.locationCode || '',
            batchNo: item.batchNo,
            quantity: item.receivedQuantity,
            balanceAfter: newBalance,
            orderNo: existingOrder.orderNo,
            operator: operatorName,
            operateTime: now,
            remark: `入库: ${item.productName} x ${item.receivedQuantity}`,
          });
        });

        set((state) => ({
          inventory: newInventory,
          locations: newLocations,
          inventoryChangeRecords: newChangeRecords,
          inboundOrders: state.inboundOrders.map((o) =>
            o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
          ),
        }));
        return;
      }
    }

    set((state) => ({
      inboundOrders: state.inboundOrders.map((o) =>
        o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
      ),
    }));
  },

  restoreInboundOrder: (id) => {
    const state = get();
    const existingOrder = state.inboundOrders.find((o) => o.id === id);
    if (!existingOrder || existingOrder.status !== 'cancelled') return;

    get().updateInboundOrder(id, { status: 'in_progress' });
  },

  addOutboundOrder: (order) => {
    useAppStore.getState().addNotification({
      type: 'outbound',
      title: '新出库单待处理',
      orderNo: order.orderNo,
      message: `客户: ${order.customer}`,
    });
    
    if (order.operator) {
      const user = useAuthStore.getState().user;
      if (user) {
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'outbound_create',
          targetType: 'outbound',
          targetId: order.id,
          targetName: order.orderNo,
          fieldChanges: [
            { field: 'customer', fieldName: '客户', oldValue: null, newValue: order.customer },
            { field: 'status', fieldName: '状态', oldValue: null, newValue: '待处理' },
            { field: 'itemCount', fieldName: '商品项数', oldValue: null, newValue: order.items.length },
          ],
          remark: `创建出库单，客户: ${order.customer}`,
        });
      }
    }
    
    set((state) => ({
      outboundOrders: [...state.outboundOrders, order],
    }));
  },

  updateOutboundOrder: (id, order) => {
    const state = get();
    const existingOrder = state.outboundOrders.find((o) => o.id === id);
    
    if (order.status && existingOrder && order.status !== existingOrder.status) {
      const user = useAuthStore.getState().user;
      if (user) {
        const statusMap: Record<string, string> = {
          pending: '待处理',
          in_progress: '处理中',
          pending_review: '待复核',
          completed: '已完成',
          cancelled: '已取消',
          split: '已拆分',
        };
        
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'outbound_status_change',
          targetType: 'outbound',
          targetId: existingOrder.id,
          targetName: existingOrder.orderNo,
          fieldChanges: [
            {
              field: 'status',
              fieldName: '状态',
              oldValue: statusMap[existingOrder.status] || existingOrder.status,
              newValue: statusMap[order.status] || order.status,
            },
          ],
          remark: `出库单状态从 ${statusMap[existingOrder.status]} 变更为 ${statusMap[order.status]}`,
        });
      }
    }
    
    set((state) => ({
      outboundOrders: state.outboundOrders.map((o) =>
        o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
      ),
    }));
  },

  updateStocktakeItem: (planId, itemId, actual) => {
    const state = get();
    const plan = state.stocktakePlans.find((p) => p.id === planId);
    const item = plan?.items.find((i) => i.id === itemId);
    
    if (plan && item) {
      const user = useAuthStore.getState().user;
      if (user) {
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'stocktake_result_edit',
          targetType: 'stocktake_item',
          targetId: item.id,
          targetName: item.productName,
          fieldChanges: [
            { field: 'systemQuantity', fieldName: '系统数量', oldValue: item.systemQuantity, newValue: item.systemQuantity },
            { field: 'actualQuantity', fieldName: '实际数量', oldValue: item.actualQuantity, newValue: actual },
            { field: 'diffQuantity', fieldName: '差异数量', oldValue: item.diffQuantity, newValue: actual - item.systemQuantity },
          ],
          remark: `盘点结果录入: ${item.productSku} @ ${item.locationCode}`,
        });
      }
    }
    
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
    }));
  },

  completeStocktake: (planId) => {
    const state = get();
    const plan = state.stocktakePlans.find((p) => p.id === planId);
    if (!plan) return;

    const user = useAuthStore.getState().user;
    if (user) {
      const statusMap: Record<string, string> = {
        pending: '待处理',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
      };
      
      get().addOperationLog({
        operatorId: user.id,
        operatorName: user.name,
        operationType: 'stocktake_status_change',
        targetType: 'stocktake',
        targetId: plan.id,
        targetName: plan.planNo,
        fieldChanges: [
          {
            field: 'status',
            fieldName: '状态',
            oldValue: statusMap[plan.status] || plan.status,
            newValue: '已完成',
          },
        ],
        remark: `盘点计划完成，共${plan.items.length}项商品`,
      });
    }

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

    const user = useAuthStore.getState().user;
    if (user) {
      order.items.forEach((item) => {
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'inventory_adjust',
          targetType: 'inventory',
          targetId: item.id,
          targetName: item.productName,
          fieldChanges: [
            { field: 'systemQuantity', fieldName: '系统数量', oldValue: item.systemQuantity, newValue: item.actualQuantity },
            { field: 'adjustQuantity', fieldName: '调整数量', oldValue: null, newValue: item.adjustQuantity },
          ],
          remark: `库存调整: ${item.productSku} @ ${item.locationCode}，系统${item.systemQuantity} → 实际${item.actualQuantity}`,
        });
      });
    }

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

  addTransferOrder: (order) => {
    if (order.operator) {
      const user = useAuthStore.getState().user;
      if (user) {
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'transfer_create',
          targetType: 'transfer',
          targetId: order.id,
          targetName: order.orderNo,
          fieldChanges: [
            { field: 'sourceLocationCode', fieldName: '源库位', oldValue: null, newValue: order.sourceLocationCode },
            { field: 'targetLocationCode', fieldName: '目标库位', oldValue: null, newValue: order.targetLocationCode },
            { field: 'itemCount', fieldName: '商品项数', oldValue: null, newValue: order.items.length },
          ],
          remark: `创建调拨单，从 ${order.sourceLocationCode} 到 ${order.targetLocationCode}`,
        });
      }
    }
    
    set((state) => ({
      transferOrders: [...state.transferOrders, order],
    }));
  },

  updateTransferOrder: (id, order) => {
    const state = get();
    const existingOrder = state.transferOrders.find((o) => o.id === id);
    
    if (order.status && existingOrder && order.status !== existingOrder.status) {
      const user = useAuthStore.getState().user;
      if (user) {
        const statusMap: Record<string, string> = {
          pending: '待处理',
          in_transit: '运输中',
          completed: '已完成',
          cancelled: '已取消',
        };
        
        get().addOperationLog({
          operatorId: user.id,
          operatorName: user.name,
          operationType: 'transfer_status_change',
          targetType: 'transfer',
          targetId: existingOrder.id,
          targetName: existingOrder.orderNo,
          fieldChanges: [
            {
              field: 'status',
              fieldName: '状态',
              oldValue: statusMap[existingOrder.status] || existingOrder.status,
              newValue: statusMap[order.status] || order.status,
            },
          ],
          remark: `调拨单状态从 ${statusMap[existingOrder.status]} 变更为 ${statusMap[order.status]}`,
        });
      }
    }
    
    set((state) => ({
      transferOrders: state.transferOrders.map((o) =>
        o.id === id ? { ...o, ...order, updateTime: new Date().toLocaleString() } : o
      ),
    }));
  },

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

  getInventorySnapshot: (targetDate) => {
    const state = get();
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const changesAfterTarget = state.inventoryChangeRecords.filter(
      (record) => new Date(record.operateTime) > targetDateEnd
    );

    const historicalBalances = new Map<string, number>();
    const currentBalances = new Map<string, number>();

    state.inventory.forEach((inv) => {
      const key = `${inv.productId}-${inv.locationId}-${inv.batchNo}`;
      currentBalances.set(key, inv.quantity);
      historicalBalances.set(key, inv.quantity);
    });

    changesAfterTarget.forEach((record) => {
      const key = `${record.productId}-${record.locationId}-${record.batchNo}`;
      const currentHist = historicalBalances.get(key) || 0;
      historicalBalances.set(key, currentHist - record.quantity);
    });

    const items: InventorySnapshotItem[] = [];
    const allKeys = new Set([...currentBalances.keys(), ...historicalBalances.keys()]);

    let itemId = 1;
    allKeys.forEach((key) => {
      const currentQty = currentBalances.get(key) || 0;
      const historicalQty = Math.max(0, historicalBalances.get(key) || 0);

      if (currentQty <= 0 && historicalQty <= 0) return;

      const [productId, locationId, batchNo] = key.split('-');
      const product = state.products.find((p) => p.id === productId);
      const location = state.locations.find((l) => l.id === locationId);
      if (!product || !location) return;

      const inventoryItem = state.inventory.find(
        (inv) =>
          inv.productId === productId &&
          inv.locationId === locationId &&
          inv.batchNo === batchNo
      );

      const quantityDiff = currentQty - historicalQty;
      const quantityDiffPercent = historicalQty > 0
        ? Math.round((quantityDiff / historicalQty) * 10000) / 100
        : currentQty > 0 ? 100 : 0;

      items.push({
        id: String(itemId++),
        productId,
        productName: product.name,
        productSku: product.sku,
        category: product.category,
        unit: product.unit,
        locationId,
        locationCode: location.code,
        zone: location.zone,
        batchNo,
        productionDate: inventoryItem?.productionDate || '-',
        expirationDate: inventoryItem?.expirationDate,
        historicalQuantity: historicalQty,
        currentQuantity: currentQty,
        quantityDiff,
        quantityDiffPercent,
      });
    });

    items.sort((a, b) => {
      if (a.productName !== b.productName) {
        return a.productName.localeCompare(b.productName);
      }
      return a.locationCode.localeCompare(b.locationCode);
    });

    const totalHistoricalQuantity = items.reduce((sum, item) => sum + item.historicalQuantity, 0);
    const totalCurrentQuantity = items.reduce((sum, item) => sum + item.currentQuantity, 0);
    const totalDiffQuantity = totalCurrentQuantity - totalHistoricalQuantity;
    const productIds = new Set(items.map((i) => i.productId));
    const locationIds = new Set(items.map((i) => i.locationId));
    const increasedCount = items.filter((i) => i.quantityDiff > 0).length;
    const decreasedCount = items.filter((i) => i.quantityDiff < 0).length;
    const unchangedCount = items.filter((i) => i.quantityDiff === 0).length;

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
      snapshotDate: formatDate(targetDateEnd),
      currentDate: formatDate(new Date()),
      items,
      totalHistoricalQuantity,
      totalCurrentQuantity,
      totalDiffQuantity,
      productCount: productIds.size,
      locationCount: locationIds.size,
      increasedCount,
      decreasedCount,
      unchangedCount,
    };
  },

  exportInventorySnapshotToExcel: (data) => {
    const detailData = data.items.map((item) => ({
      '商品SKU': item.productSku,
      '商品名称': item.productName,
      '品类': item.category,
      '单位': item.unit,
      '区域': item.zone,
      '库位': item.locationCode,
      '批次号': item.batchNo,
      '生产日期': item.productionDate,
      '保质期': item.expirationDate || '-',
      [`${data.snapshotDate} 库存`]: item.historicalQuantity,
      [`${data.currentDate} 库存`]: item.currentQuantity,
      '变动数量': item.quantityDiff > 0 ? `+${item.quantityDiff}` : item.quantityDiff,
      '变动比例(%)': item.quantityDiffPercent > 0 ? `+${item.quantityDiffPercent}%` : `${item.quantityDiffPercent}%`,
    }));

    const summaryData = [
      { '统计项': '快照日期', '数值': data.snapshotDate },
      { '统计项': '当前日期', '数值': data.currentDate },
      { '统计项': '商品种类', '数值': data.productCount },
      { '统计项': '涉及库位', '数值': data.locationCount },
      { '统计项': `${data.snapshotDate} 总库存`, '数值': data.totalHistoricalQuantity },
      { '统计项': `${data.currentDate} 总库存`, '数值': data.totalCurrentQuantity },
      { '统计项': '总变动数量', '数值': data.totalDiffQuantity > 0 ? `+${data.totalDiffQuantity}` : data.totalDiffQuantity },
      { '统计项': '库存增加项数', '数值': data.increasedCount },
      { '统计项': '库存减少项数', '数值': data.decreasedCount },
      { '统计项': '库存无变动项数', '数值': data.unchangedCount },
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(detailData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);

    ws1['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
      { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    ];
    ws2['!cols'] = [{ wch: 25 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws1, '库存明细');
    XLSX.utils.book_append_sheet(wb, ws2, '汇总统计');

    XLSX.writeFile(wb, `库存快照_${data.snapshotDate}.xlsx`);
  },

  getTasks: () => {
    const state = get();
    const tasks: Task[] = [];

    state.inboundOrders.forEach((order) => {
      let status: TaskStatus;
      if (order.status === 'cancelled') {
        status = 'cancelled';
      } else {
        status = order.status;
      }
      tasks.push({
        id: `inbound-${order.id}`,
        type: 'inbound',
        orderNo: order.orderNo,
        title: `入库单 - ${order.supplier}`,
        status,
        createTime: order.createTime,
        updateTime: order.updateTime,
        operator: order.operator,
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.planQuantity, 0),
        relatedParty: order.supplier,
        remark: order.remark,
      });
    });

    state.outboundOrders.forEach((order) => {
      let status: TaskStatus;
      if (order.status === 'cancelled') {
        status = 'cancelled';
      } else if (order.status === 'pending_review' || order.status === 'split') {
        status = 'in_progress';
      } else {
        status = order.status;
      }
      tasks.push({
        id: `outbound-${order.id}`,
        type: 'outbound',
        orderNo: order.orderNo,
        title: `出库单 - ${order.customer}`,
        status,
        createTime: order.createTime,
        updateTime: order.updateTime,
        operator: order.operator,
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.planQuantity, 0),
        relatedParty: order.customer,
        remark: order.remark,
      });
    });

    state.stocktakePlans.forEach((plan) => {
      let status: TaskStatus;
      if (plan.status === 'cancelled') {
        status = 'cancelled';
      } else if (plan.status === 'completed') {
        status = 'completed';
      } else if (plan.status === 'in_progress') {
        status = 'in_progress';
      } else {
        status = 'pending';
      }
      tasks.push({
        id: `stocktake-${plan.id}`,
        type: 'stocktake',
        orderNo: plan.planNo,
        title: `盘点 - ${plan.name}`,
        status,
        createTime: plan.createTime,
        updateTime: plan.endTime || plan.startTime || plan.createTime,
        operator: plan.operator,
        itemCount: plan.items.length,
        totalQuantity: plan.items.reduce((sum, item) => sum + item.systemQuantity, 0),
        relatedParty: plan.type === 'full' ? '全盘' : plan.type === 'partial' ? '部分盘点' : '周期盘点',
        remark: plan.remark,
      });
    });

    return tasks.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
  },

  getTaskStats: () => {
    const tasks = get().getTasks();

    const totalInProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
    const totalCancelled = tasks.filter((t) => t.status === 'cancelled').length;

    const todayPending = tasks.filter((t) => {
      const taskDate = new Date(t.createTime).toDateString();
      const today = new Date('2026-06-06').toDateString();
      return t.status === 'pending' && taskDate === today;
    }).length;

    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const inboundCount = pendingTasks.filter((t) => t.type === 'inbound').length;
    const outboundCount = pendingTasks.filter((t) => t.type === 'outbound').length;
    const stocktakeCount = pendingTasks.filter((t) => t.type === 'stocktake').length;

    const totalPendingCount = pendingTasks.length;
    const inboundRatio = totalPendingCount > 0 ? Math.round((inboundCount / totalPendingCount) * 10000) / 100 : 0;
    const outboundRatio = totalPendingCount > 0 ? Math.round((outboundCount / totalPendingCount) * 10000) / 100 : 0;
    const stocktakeRatio = totalPendingCount > 0 ? Math.round((stocktakeCount / totalPendingCount) * 10000) / 100 : 0;

    return {
      totalPending: todayPending,
      totalInProgress,
      totalCompleted,
      totalCancelled,
      typeBreakdown: {
        inbound: inboundCount,
        outbound: outboundCount,
        stocktake: stocktakeCount,
      },
      typeRatio: {
        inbound: inboundRatio,
        outbound: outboundRatio,
        stocktake: stocktakeRatio,
      },
    };
  },

  updateTaskStatus: (taskId, taskType, newStatus) => {
    const state = get();
    const actualId = taskId.replace(`${taskType}-`, '');

    if (taskType === 'inbound') {
      const order = state.inboundOrders.find((o) => o.id === actualId);
      if (!order) return;

      get().updateInboundOrder(actualId, { status: newStatus });

      useAppStore.getState().addNotification({
        type: 'inbound',
        title: '入库单状态更新',
        orderNo: order.orderNo,
        message: `状态已更新为: ${newStatus === 'pending' ? '待处理' : newStatus === 'in_progress' ? '进行中' : newStatus === 'completed' ? '已完成' : '已取消'}`,
      });
    } else if (taskType === 'outbound') {
      const order = state.outboundOrders.find((o) => o.id === actualId);
      if (!order) return;

      set((state) => ({
        outboundOrders: state.outboundOrders.map((o) =>
          o.id === actualId ? { ...o, status: newStatus, updateTime: new Date().toLocaleString() } : o
        ),
      }));

      useAppStore.getState().addNotification({
        type: 'outbound',
        title: '出库单状态更新',
        orderNo: order.orderNo,
        message: `状态已更新为: ${newStatus === 'pending' ? '待处理' : newStatus === 'in_progress' ? '进行中' : newStatus === 'completed' ? '已完成' : '已取消'}`,
      });
    } else if (taskType === 'stocktake') {
      const plan = state.stocktakePlans.find((p) => p.id === actualId);
      if (!plan) return;

      let statusLabel = '';
      if (newStatus === 'pending') statusLabel = '待处理';
      else if (newStatus === 'in_progress') statusLabel = '进行中';
      else if (newStatus === 'completed') statusLabel = '已完成';
      else if (newStatus === 'cancelled') statusLabel = '已取消';

      if (newStatus === 'completed') {
        state.completeStocktake(actualId);
        useAppStore.getState().addNotification({
          type: 'stocktake',
          title: '盘点计划状态更新',
          orderNo: plan.planNo,
          message: '状态已更新为: 已完成',
        });
      } else if (newStatus === 'cancelled') {
        set((state) => ({
          stocktakePlans: state.stocktakePlans.map((p) =>
            p.id === actualId
              ? {
                  ...p,
                  status: 'cancelled',
                  endTime: new Date().toLocaleString(),
                }
              : p
          ),
        }));
        useAppStore.getState().addNotification({
          type: 'stocktake',
          title: '盘点计划状态更新',
          orderNo: plan.planNo,
          message: '状态已更新为: 已取消',
        });
      } else {
        set((state) => ({
          stocktakePlans: state.stocktakePlans.map((p) =>
            p.id === actualId
              ? {
                  ...p,
                  status: newStatus === 'in_progress' ? 'in_progress' : 'pending',
                  startTime: newStatus === 'in_progress' ? new Date().toLocaleString() : p.startTime,
                }
              : p
          ),
        }));
        useAppStore.getState().addNotification({
          type: 'stocktake',
          title: '盘点计划状态更新',
          orderNo: plan.planNo,
          message: `状态已更新为: ${statusLabel}`,
        });
      }
    }
  },

  getTaskDetail: (taskId, taskType) => {
    const state = get();
    const actualId = taskId.replace(`${taskType}-`, '');

    if (taskType === 'inbound') {
      const order = state.inboundOrders.find((o) => o.id === actualId);
      if (!order) return null;
      return { order, items: order.items };
    } else if (taskType === 'outbound') {
      const order = state.outboundOrders.find((o) => o.id === actualId);
      if (!order) return null;
      return { order, items: order.items };
    } else if (taskType === 'stocktake') {
      const plan = state.stocktakePlans.find((p) => p.id === actualId);
      if (!plan) return null;
      return { order: plan, items: plan.items };
    }

    return null;
  },

  addOperationLog: (log) => {
    const state = get();
    const operator = state.suppliers.length > 0 
      ? { id: log.operatorId, name: log.operatorName, role: 'operator' } 
      : null;
    
    const operatorRole = operator?.role || 'operator';
    
    const roleMap: Record<string, string> = {
      '1': 'admin',
      '2': 'manager', 
      '3': 'operator',
    };
    
    const actualRole = roleMap[log.operatorId] || operatorRole;
    const roleNameMap: Record<string, string> = {
      admin: '管理员',
      manager: '经理',
      operator: '操作员',
    };

    const newLog: OperationLog = {
      ...log,
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operateTime: new Date().toLocaleString(),
      operatorRole: roleNameMap[actualRole] || actualRole,
      operationTypeName: OperationLogTypeLabels[log.operationType],
      ipAddress: '127.0.0.1',
      userAgent: navigator?.userAgent || 'Unknown',
    };

    set((state) => ({
      operationLogs: [newLog, ...state.operationLogs],
    }));
  },

  getOperationLogs: (filter, currentUser) => {
    const state = get();
    let logs = [...state.operationLogs];

    if (currentUser && currentUser.role !== 'admin') {
      logs = logs.filter((log) => log.operatorId === currentUser.id);
    }

    if (filter) {
      if (filter.startTime) {
        const startDate = new Date(filter.startTime);
        logs = logs.filter((log) => new Date(log.operateTime) >= startDate);
      }
      if (filter.endTime) {
        const endDate = new Date(filter.endTime);
        endDate.setHours(23, 59, 59, 999);
        logs = logs.filter((log) => new Date(log.operateTime) <= endDate);
      }
      if (filter.operatorId) {
        logs = logs.filter((log) => log.operatorId === filter.operatorId);
      }
      if (filter.operationType) {
        logs = logs.filter((log) => log.operationType === filter.operationType);
      }
    }

    return logs;
  },

  getOperationLogById: (id, currentUser) => {
    const state = get();
    const log = state.operationLogs.find((l) => l.id === id);
    
    if (!log) return null;
    
    if (currentUser && currentUser.role !== 'admin' && log.operatorId !== currentUser.id) {
      return null;
    }
    
    return log;
  },

  getOperationTypes: () => {
    return Object.entries(OperationLogTypeLabels).map(([value, label]) => ({
      value: value as OperationLogType,
      label,
    }));
  },

  getOperators: () => {
    const state = get();
    const operatorMap = new Map<string, string>();
    
    state.operationLogs.forEach((log) => {
      operatorMap.set(log.operatorId, log.operatorName);
    });
    
    return Array.from(operatorMap.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  },
}));
