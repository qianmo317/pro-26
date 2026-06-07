import { useWarehouseStore } from '../src/store/warehouseStore';
import { useAuthStore } from '../src/store/authStore';
import type { InboundOrder, InboundItem } from '../src/types';

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
} as Storage;

async function runDiagnostics() {
  console.log('=== 诊断测试 ===\n');

  await useAuthStore.getState().login('admin', 'admin123');
  const store = useWarehouseStore.getState();

  console.log('1. 初始 inboundOrders 数量:', store.inboundOrders.length);

  const supplier = store.suppliers[0];
  const product = store.products[0];
  const location = store.locations.find((l) => l.status !== 'locked');

  const testId = `test-diag-${Date.now()}`;
  const item: InboundItem = {
    id: `test-item-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    planQuantity: 100,
    actualQuantity: 0,
    receivedQuantity: 0,
    locationId: location?.id,
    locationCode: location?.code,
    batchNo: `BATCH-${Date.now()}`,
    productionDate: '2026-01-01',
  };

  const order: InboundOrder = {
    id: testId,
    orderNo: `TEST-IN-${Date.now()}`,
    supplierId: supplier.id,
    supplier: supplier.companyName,
    status: 'pending',
    items: [item],
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString(),
    operator: '测试员',
  };

  console.log('2. 创建测试订单，ID:', testId);
  store.addInboundOrder(order);
  console.log('3. addInboundOrder 后 inboundOrders 数量:', store.inboundOrders.length);

  const found1 = store.inboundOrders.find((o) => o.id === testId);
  console.log('4. 查找订单 (find by id):', found1 ? '找到' : '未找到');
  console.log('   订单状态:', found1?.status);

  console.log('\n5. 尝试更新状态为 in_progress...');
  try {
    store.updateInboundOrder(testId, { status: 'in_progress' });
    console.log('   更新成功');
  } catch (e) {
    console.log('   更新失败:', e instanceof Error ? e.message : String(e));
  }

  const found2 = store.inboundOrders.find((o) => o.id === testId);
  console.log('6. 更新后查找订单:', found2 ? '找到' : '未找到');
  console.log('   订单状态:', found2?.status);

  console.log('\n=== 诊断结束 ===');
}

runDiagnostics().catch(console.error);
