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
}));
