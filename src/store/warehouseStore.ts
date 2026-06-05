import { create } from 'zustand';
import type {
  Location,
  Inventory,
  InboundOrder,
  OutboundOrder,
  StocktakePlan,
  Product,
  ReportData,
} from '../types';
import {
  mockLocations,
  mockInventory,
  mockInboundOrders,
  mockOutboundOrders,
  mockStocktakePlans,
  mockProducts,
  mockReportData,
} from '../mock/data';

interface WarehouseState {
  locations: Location[];
  inventory: Inventory[];
  inboundOrders: InboundOrder[];
  outboundOrders: OutboundOrder[];
  stocktakePlans: StocktakePlan[];
  products: Product[];
  reportData: ReportData;
  addInboundOrder: (order: InboundOrder) => void;
  updateInboundOrder: (id: string, order: Partial<InboundOrder>) => void;
  addOutboundOrder: (order: OutboundOrder) => void;
  updateOutboundOrder: (id: string, order: Partial<OutboundOrder>) => void;
  updateStocktakeItem: (planId: string, itemId: string, actual: number) => void;
  completeStocktake: (planId: string) => void;
}

export const useWarehouseStore = create<WarehouseState>((set) => ({
  locations: mockLocations,
  inventory: mockInventory,
  inboundOrders: mockInboundOrders,
  outboundOrders: mockOutboundOrders,
  stocktakePlans: mockStocktakePlans,
  products: mockProducts,
  reportData: mockReportData,

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
}));
