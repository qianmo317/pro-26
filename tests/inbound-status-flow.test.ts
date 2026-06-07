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

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;

function logTest(name: string, testPassed: boolean, message?: string) {
  const status = testPassed ? `${COLORS.green}✓ PASS${COLORS.reset}` : `${COLORS.red}✗ FAIL${COLORS.reset}`;
  console.log(`  ${status} ${name}`);
  if (message && !testPassed) {
    console.log(`      ${COLORS.red}${message}${COLORS.reset}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    logTest(name, true);
  } catch (err) {
    failed++;
    logTest(name, false, err instanceof Error ? err.message : String(err));
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertThrows(fn: () => void, expectedMessage?: string) {
  try {
    fn();
    const error = new Error('Expected function to throw');
    error.cause = 'no_error_thrown';
    throw error;
  } catch (err) {
    if (expectedMessage && err instanceof Error && !err.message.includes(expectedMessage)) {
      const error = new Error(`Expected error message to include "${expectedMessage}", got "${err.message}"`);
      error.cause = err;
      throw error;
    }
  }
}

function createTestInboundOrder(
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' = 'pending',
  receivedQty: number = 0
): InboundOrder {
  const store = useWarehouseStore.getState();
  const supplier = store.suppliers[0];
  const product = store.products[0];
  const location = store.locations.find((l) => l.status !== 'locked');

  const item: InboundItem = {
    id: `test-item-${Date.now()}-${Math.random()}`,
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    planQuantity: 100,
    actualQuantity: receivedQty,
    receivedQuantity: receivedQty,
    locationId: location?.id,
    locationCode: location?.code,
    batchNo: `BATCH-${Date.now()}-${Math.random()}`,
    productionDate: '2026-01-01',
  };

  return {
    id: `test-${Date.now()}-${Math.random()}`,
    orderNo: `TEST-IN-${Date.now()}`,
    supplierId: supplier.id,
    supplier: supplier.companyName,
    status,
    items: [item],
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString(),
    operator: '测试员',
  };
}

function runTests() {
  console.log(`\n${COLORS.bold}${COLORS.blue}════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}           入库单状态流转测试套件${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.blue}════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  useAuthStore.setState({
    user: { id: '1', username: 'admin', name: '系统管理员', role: 'admin' },
    token: 'test-token',
    isAuthenticated: true,
  });

  console.log(`${COLORS.bold}${COLORS.yellow}一、正常状态流转测试${COLORS.reset}\n`);

  test('1. pending 状态的入库单可以开始入库并变为 in_progress', () => {
    const order = createTestInboundOrder('pending');
    const store = useWarehouseStore.getState();
    store.addInboundOrder(order);

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'in_progress' });

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'in_progress', '状态应变为 in_progress');
  });

  test('2. in_progress 状态的入库单可以完成入库并变为 completed', () => {
    const order = createTestInboundOrder('in_progress', 100);
    const store = useWarehouseStore.getState();
    store.addInboundOrder(order);

    const item = order.items[0];
    const existingInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    const initialQty = existingInv?.quantity || 0;
    const loc = useWarehouseStore.getState().locations.find((l) => l.id === item.locationId);
    const initialLocCurrent = loc?.current || 0;
    const initialChangeCount = useWarehouseStore.getState().inventoryChangeRecords.length;

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' });

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'completed', '状态应变为 completed');

    const newInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    assert(newInv, '应存在库存记录');
    assertEqual(newInv?.quantity, initialQty + 100, '库存数量应增加 100');

    const updatedLoc = useWarehouseStore.getState().locations.find((l) => l.id === item.locationId);
    assertEqual(updatedLoc?.current, initialLocCurrent + 100, '库位当前数量应增加 100');

    const changeRecords = useWarehouseStore.getState().inventoryChangeRecords;
    assert(
      changeRecords.length > initialChangeCount,
      '应添加库存变更记录'
    );
    const changeRecord = changeRecords.find(
      (r) => r.orderNo === order.orderNo && r.type === 'inbound'
    );
    assert(changeRecord, '应存在入库类型的变更记录');
    assertEqual(changeRecord?.quantity, 100, '变更记录数量应为 100');
    assertEqual(changeRecord?.balanceAfter, initialQty + 100, '变更后余额应正确');
  });

  test('3. 部分收货后完成入库，库存按实际收货数量增加', () => {
    const order = createTestInboundOrder('in_progress', 60);
    useWarehouseStore.getState().addInboundOrder(order);

    const item = order.items[0];
    const existingInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    const initialQty = existingInv?.quantity || 0;

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' });

    const newInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    assertEqual(newInv?.quantity, initialQty + 60, '库存数量应增加 60（实际收货数量）');
  });

  test('4. cancelled 状态的入库单可以恢复为 in_progress', () => {
    const order = createTestInboundOrder('cancelled', 50);
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().restoreInboundOrder(order.id);

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'in_progress', '状态应恢复为 in_progress');
  });

  console.log(`\n${COLORS.bold}${COLORS.yellow}二、非法状态跳转拦截测试${COLORS.reset}\n`);

  test('5. 不能直接从 pending 跳到 completed', () => {
    const order = createTestInboundOrder('pending', 100);
    useWarehouseStore.getState().addInboundOrder(order);

    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' }),
      '非法状态跳转'
    );

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'pending', '状态应保持 pending');
  });

  test('6. completed 状态的入库单不能再次操作（状态不可变更）', () => {
    const order = createTestInboundOrder('pending');
    useWarehouseStore.getState().addInboundOrder(order);
    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'in_progress' });

    const store = useWarehouseStore.getState();
    const inProgressOrder = store.inboundOrders.find((o) => o.id === order.id)!;
    store.updateInboundOrder(inProgressOrder.id, {
      status: 'completed',
      items: inProgressOrder.items.map((i) => ({ ...i, receivedQuantity: i.planQuantity })),
    });

    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'in_progress' }),
      '非法状态跳转'
    );
    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'cancelled' }),
      '非法状态跳转'
    );
    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'pending' }),
      '非法状态跳转'
    );

    const final = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(final?.status, 'completed', '状态应保持 completed');
  });

  test('7. 不能从 in_progress 直接跳到 pending', () => {
    const order = createTestInboundOrder('in_progress');
    useWarehouseStore.getState().addInboundOrder(order);

    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'pending' }),
      '非法状态跳转'
    );

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'in_progress', '状态应保持 in_progress');
  });

  test('8. 不能从 cancelled 直接跳到 pending 或 completed', () => {
    const order = createTestInboundOrder('cancelled');
    useWarehouseStore.getState().addInboundOrder(order);

    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'pending' }),
      '非法状态跳转'
    );
    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' }),
      '非法状态跳转'
    );

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'cancelled', '状态应保持 cancelled');
  });

  test('9. pending 状态可以取消', () => {
    const order = createTestInboundOrder('pending');
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'cancelled' });

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'cancelled', '状态应变为 cancelled');
  });

  test('10. in_progress 状态可以取消', () => {
    const order = createTestInboundOrder('in_progress');
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'cancelled' });

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'cancelled', '状态应变为 cancelled');
  });

  console.log(`\n${COLORS.bold}${COLORS.yellow}三、库存和库位联动更新测试${COLORS.reset}\n`);

  test('11. 入库完成后，库位状态正确更新（normal/empty/full）', () => {
    const store = useWarehouseStore.getState();
    const emptyLoc = store.locations.find((l) => l.status === 'empty');
    assert(emptyLoc, '应有空库位');

    const order = createTestInboundOrder('in_progress', 50);
    order.items[0].locationId = emptyLoc.id;
    order.items[0].locationCode = emptyLoc.code;
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' });

    const updatedLoc = useWarehouseStore.getState().locations.find((l) => l.id === emptyLoc.id);
    assert(updatedLoc, '库位应存在');
    assertEqual(updatedLoc.current, 50, '库位当前数量应为 50');
    assert(
      updatedLoc.status === 'normal' || updatedLoc.status === 'full',
      `库位状态应为 normal 或 full，实际为 ${updatedLoc.status}`
    );
  });

  test('12. 入库到已存在库存的库位时，库存数量累加而非新增', () => {
    const store = useWarehouseStore.getState();
    const existingInv = store.inventory[0];
    assert(existingInv, '应有现有库存');

    const order = createTestInboundOrder('in_progress', 30);
    order.items[0].productId = existingInv.productId;
    order.items[0].productName = existingInv.productName;
    order.items[0].productSku = existingInv.productSku;
    order.items[0].locationId = existingInv.locationId;
    order.items[0].locationCode = existingInv.locationCode;
    order.items[0].batchNo = existingInv.batchNo;
    useWarehouseStore.getState().addInboundOrder(order);

    const initialQty = existingInv.quantity;
    const initialInventoryCount = useWarehouseStore.getState().inventory.length;

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' });

    const updatedInv = useWarehouseStore.getState().inventory.find((inv) => inv.id === existingInv.id);
    assertEqual(updatedInv?.quantity, initialQty + 30, '库存数量应累加');
    assertEqual(
      useWarehouseStore.getState().inventory.length,
      initialInventoryCount,
      '库存记录数不应增加（应合并现有记录）'
    );
  });

  test('13. 入库完成时，如果库位已锁定应抛出错误', () => {
    const store = useWarehouseStore.getState();
    const normalLoc = store.locations.find((l) => l.status !== 'locked');
    assert(normalLoc, '应有正常库位');

    useWarehouseStore.getState().lockLocations([normalLoc.id], '测试锁定', '测试员');

    const order = createTestInboundOrder('in_progress', 50);
    order.items[0].locationId = normalLoc.id;
    order.items[0].locationCode = normalLoc.code;
    useWarehouseStore.getState().addInboundOrder(order);

    assertThrows(
      () => useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' }),
      '已被锁定'
    );

    useWarehouseStore.getState().unlockLocations([normalLoc.id], '测试解锁', '测试员');
  });

  test('14. 收货数量为 0 的商品不生成库存记录', () => {
    const order = createTestInboundOrder('in_progress', 0);
    useWarehouseStore.getState().addInboundOrder(order);

    const initialInventoryCount = useWarehouseStore.getState().inventory.length;

    useWarehouseStore.getState().updateInboundOrder(order.id, { status: 'completed' });

    assertEqual(
      useWarehouseStore.getState().inventory.length,
      initialInventoryCount,
      '收货数量为 0 不应生成库存记录'
    );
  });

  test('15. updateTaskStatus 也会经过状态机验证', () => {
    const order = createTestInboundOrder('pending');
    useWarehouseStore.getState().addInboundOrder(order);

    assertThrows(
      () => useWarehouseStore.getState().updateTaskStatus(`inbound-${order.id}`, 'inbound', 'completed'),
      '非法状态跳转'
    );

    useWarehouseStore.getState().updateTaskStatus(`inbound-${order.id}`, 'inbound', 'in_progress');
    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'in_progress', '正常状态跳转应成功');
  });

  console.log(`\n${COLORS.bold}${COLORS.yellow}四、边界情况测试${COLORS.reset}\n`);

  test('16. 操作不存在的入库单应静默失败', () => {
    const initialCount = useWarehouseStore.getState().inboundOrders.length;
    useWarehouseStore.getState().updateInboundOrder('non-existent-id', { status: 'completed' });
    assertEqual(useWarehouseStore.getState().inboundOrders.length, initialCount, '入库单数量不应变化');
  });

  test('17. 恢复非 cancelled 状态的入库单应静默失败', () => {
    const order = createTestInboundOrder('pending');
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().restoreInboundOrder(order.id);

    const updated = useWarehouseStore.getState().inboundOrders.find((o) => o.id === order.id);
    assertEqual(updated?.status, 'pending', '状态应保持 pending');
  });

  test('18. 多次收货后完成入库，库存按累计收货数量增加', () => {
    const order = createTestInboundOrder('in_progress', 0);
    useWarehouseStore.getState().addInboundOrder(order);

    useWarehouseStore.getState().updateInboundOrder(order.id, {
      items: order.items.map((i) => ({ ...i, receivedQuantity: 30 })),
    });

    const store = useWarehouseStore.getState();
    const orderAfterFirstReceive = store.inboundOrders.find((o) => o.id === order.id)!;
    store.updateInboundOrder(order.id, {
      items: orderAfterFirstReceive.items.map((i) => ({ ...i, receivedQuantity: 70 })),
    });

    const item = order.items[0];
    const existingInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    const initialQty = existingInv?.quantity || 0;

    const store2 = useWarehouseStore.getState();
    const updatedOrder = store2.inboundOrders.find((o) => o.id === order.id)!;
    store2.updateInboundOrder(order.id, { status: 'completed', items: updatedOrder.items });

    const newInv = useWarehouseStore.getState().inventory.find(
      (inv) =>
        inv.productId === item.productId &&
        inv.locationId === item.locationId &&
        inv.batchNo === item.batchNo
    );
    assertEqual(newInv?.quantity, initialQty + 70, '库存应按最终累计收货数量增加');
  });

  console.log(`\n${COLORS.bold}${COLORS.blue}════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(
    `${COLORS.bold}测试完成: ${COLORS.green}${passed} 通过${COLORS.reset}, ${
      failed > 0 ? COLORS.red : ''
    }${failed} 失败${COLORS.reset}`
  );
  console.log(`${COLORS.bold}${COLORS.blue}════════════════════════════════════════════════════════════${COLORS.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
