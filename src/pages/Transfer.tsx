import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Space,
  Tag,
  Input,
} from '@arco-design/web-react';
import { IconPlus, IconEye, IconRefresh } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { TransferOrder, TransferItem, Inventory } from '../types';

interface TransferFormValues {
  sourceLocationId: string;
  targetLocationId: string;
  inventoryId: string;
  quantity: number;
  remark?: string;
}

const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

export default function Transfer() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<TransferOrder | null>(null);
  const [selectedSourceLoc, setSelectedSourceLoc] = useState<string>('');
  const [filterSourceLoc, setFilterSourceLoc] = useState<string>('');
  const [filterTargetLoc, setFilterTargetLoc] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [form] = Form.useForm();

  const {
    locations,
    inventory,
    products,
    transferOrders,
    addTransferOrder,
    startTransfer,
    completeTransfer,
  } = useWarehouseStore();

  const availableLocations = useMemo(
    () => locations.filter((l) => l.status !== 'locked'),
    [locations]
  );

  const sourceInventory = useMemo(() => {
    if (!selectedSourceLoc) return [];
    return inventory.filter((inv) => inv.locationId === selectedSourceLoc);
  }, [inventory, selectedSourceLoc]);

  const filteredOrders = useMemo(() => {
    let result = [...transferOrders];
    if (filterSourceLoc) {
      result = result.filter((o) => o.sourceLocationId === filterSourceLoc);
    }
    if (filterTargetLoc) {
      result = result.filter((o) => o.targetLocationId === filterTargetLoc);
    }
    if (filterStatus) {
      result = result.filter((o) => o.status === filterStatus);
    }
    return result.sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    );
  }, [transferOrders, filterSourceLoc, filterTargetLoc, filterStatus]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待确认' },
      in_transit: { color: 'blue', text: '在途' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    return statusMap[status] || { color: 'gray', text: '未知' };
  };

  const columns = [
    {
      title: '调拨单号',
      dataIndex: 'orderNo',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const s = getStatusInfo(status);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '源库位',
      dataIndex: 'sourceLocationCode',
      width: 120,
    },
    {
      title: '目标库位',
      dataIndex: 'targetLocationCode',
      width: 120,
    },
    {
      title: '商品',
      dataIndex: 'items',
      render: (items: TransferItem[]) =>
        items.map((i) => i.productName).join(', ') || '-',
    },
    {
      title: '总数量',
      dataIndex: 'items',
      width: 100,
      render: (items: TransferItem[]) =>
        items.reduce((sum, i) => sum + i.quantity, 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 100,
      render: (op: string) => op || '-',
    },
    {
      title: '操作',
      width: 200,
      render: (_: unknown, record: TransferOrder) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              setSelectedOrder(record);
              setDetailVisible(true);
            }}
          >
            查看
          </Button>
          {record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              status="warning"
              onClick={() => handleStartTransfer(record.id)}
            >
              开始调拨
            </Button>
          )}
          {record.status === 'in_transit' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleCompleteTransfer(record.id)}
            >
              完成调拨
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStartTransfer = (id: string) => {
    startTransfer(id);
    toast.success('调拨已开始，商品已从源库位出库');
  };

  const handleCompleteTransfer = (id: string) => {
    completeTransfer(id);
    toast.success('调拨已完成，商品已入库目标库位');
  };

  const handleSubmit = (values: TransferFormValues) => {
    if (values.sourceLocationId === values.targetLocationId) {
      toast.error('源库位和目标库位不能相同');
      return;
    }

    const inv = inventory.find((i) => i.id === values.inventoryId);
    if (!inv) {
      toast.error('请选择有效的库存');
      return;
    }

    if (inv.quantity < values.quantity) {
      toast.error('调拨数量不能超过库存数量');
      return;
    }

    const sourceLoc = locations.find((l) => l.id === values.sourceLocationId);
    const targetLoc = locations.find((l) => l.id === values.targetLocationId);
    const product = products.find((p) => p.id === inv.productId);

    if (!sourceLoc || !targetLoc || !product) {
      toast.error('数据错误，请检查');
      return;
    }

    const newOrder: TransferOrder = {
      id: String(Date.now()),
      orderNo: `TRF${Date.now()}`,
      sourceLocationId: values.sourceLocationId,
      sourceLocationCode: sourceLoc.code,
      targetLocationId: values.targetLocationId,
      targetLocationCode: targetLoc.code,
      status: 'pending',
      items: [
        {
          id: String(Date.now()) + '-1',
          productId: inv.productId,
          productName: inv.productName,
          productSku: inv.productSku,
          quantity: values.quantity,
          batchNo: inv.batchNo,
          sourceLocationId: values.sourceLocationId,
          sourceLocationCode: sourceLoc.code,
          targetLocationId: values.targetLocationId,
          targetLocationCode: targetLoc.code,
        },
      ],
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      remark: values.remark,
    };

    addTransferOrder(newOrder);
    setModalVisible(false);
    form.resetFields();
    setSelectedSourceLoc('');
    toast.success('调拨单创建成功');
  };

  const handleResetFilters = () => {
    setFilterSourceLoc('');
    setFilterTargetLoc('');
    setFilterStatus('');
  };

  const detailColumns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 120,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 140,
    },
    {
      title: '调拨数量',
      dataIndex: 'quantity',
      width: 100,
    },
    {
      title: '源库位',
      dataIndex: 'sourceLocationCode',
      width: 120,
    },
    {
      title: '目标库位',
      dataIndex: 'targetLocationCode',
      width: 120,
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>
            新建调拨单
          </Button>
          <Button icon={<IconRefresh />} onClick={handleResetFilters}>
            重置筛选
          </Button>
        </Space>
        <Space>
          <Select
            placeholder="源库位"
            style={{ width: 150 }}
            value={filterSourceLoc}
            onChange={setFilterSourceLoc}
            allowClear
          >
            {availableLocations.map((l) => (
              <Option key={l.id} value={l.id}>
                {l.code}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="目标库位"
            style={{ width: 150 }}
            value={filterTargetLoc}
            onChange={setFilterTargetLoc}
            allowClear
          >
            {availableLocations.map((l) => (
              <Option key={l.id} value={l.id}>
                {l.code}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 150 }}
            value={filterStatus}
            onChange={setFilterStatus}
            allowClear
          >
            <Option value="pending">待确认</Option>
            <Option value="in_transit">在途</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        data={filteredOrders}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建调拨单"
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setSelectedSourceLoc('');
          form.resetFields();
        }}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem
            label="源库位"
            field="sourceLocationId"
            rules={[{ required: true, message: '请选择源库位' }]}
          >
            <Select
              placeholder="请选择源库位"
              onChange={(value: string) => {
                setSelectedSourceLoc(value);
                form.setFieldsValue({ inventoryId: undefined });
              }}
            >
              {availableLocations.map((l) => (
                <Option key={l.id} value={l.id}>
                  {l.code} ({l.zone})
                </Option>
              ))}
            </Select>
          </FormItem>

          {selectedSourceLoc && sourceInventory.length > 0 && (
            <div
              style={{
                background: '#f5f7fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                源库位库存
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {sourceInventory.map((inv: Inventory) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #e5e6eb',
                    }}
                  >
                    <span>
                      {inv.productName} ({inv.productSku})
                    </span>
                    <span style={{ color: '#666' }}>
                      批次: {inv.batchNo}, 数量: {inv.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSourceLoc && sourceInventory.length === 0 && (
            <div
              style={{
                background: '#fff7e6',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#d46b08',
              }}
            >
              该库位暂无库存
            </div>
          )}

          <FormItem
            label="库存商品"
            field="inventoryId"
            rules={[{ required: true, message: '请选择要调拨的库存' }]}
          >
            <Select placeholder="请选择库存商品" disabled={!selectedSourceLoc}>
              {sourceInventory.map((inv) => (
                <Option key={inv.id} value={inv.id}>
                  {inv.productName} ({inv.productSku}) - 批次: {inv.batchNo} - 库存:{' '}
                  {inv.quantity}
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            label="目标库位"
            field="targetLocationId"
            rules={[{ required: true, message: '请选择目标库位' }]}
          >
            <Select placeholder="请选择目标库位">
              {availableLocations.map((l) => (
                <Option key={l.id} value={l.id}>
                  {l.code} ({l.zone})
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            label="调拨数量"
            field="quantity"
            rules={[{ required: true, message: '请输入调拨数量' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </FormItem>

          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入备注信息" />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title="调拨单详情"
        visible={detailVisible}
        onOk={() => setDetailVisible(false)}
        onCancel={() => setDetailVisible(false)}
        style={{ width: 800 }}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>调拨单号</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.orderNo}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>状态</div>
                <div>
                  <Tag color={getStatusInfo(selectedOrder.status).color}>
                    {getStatusInfo(selectedOrder.status).text}
                  </Tag>
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>源库位</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.sourceLocationCode}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>目标库位</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.targetLocationCode}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>创建时间</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.createTime}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>更新时间</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.updateTime}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>操作人</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.operator || '-'}</div>
              </div>
            </div>

            {selectedOrder.remark && (
              <div
                style={{
                  background: '#f5f7fa',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                  备注
                </div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.remark}</div>
              </div>
            )}

            <div style={{ marginBottom: '12px', fontWeight: '500' }}>调拨明细</div>
            <Table
              columns={detailColumns}
              data={selectedOrder.items}
              pagination={false}
              size="small"
            />

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              {selectedOrder.status === 'pending' && (
                <Button
                  type="primary"
                  status="warning"
                  onClick={() => {
                    handleStartTransfer(selectedOrder.id);
                    setDetailVisible(false);
                  }}
                >
                  开始调拨
                </Button>
              )}
              {selectedOrder.status === 'in_transit' && (
                <Button
                  type="primary"
                  status="success"
                  onClick={() => {
                    handleCompleteTransfer(selectedOrder.id);
                    setDetailVisible(false);
                  }}
                >
                  完成调拨
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
