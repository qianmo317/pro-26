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
            productionDate: new Date().toISOString().split('T')[0],
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
}));
