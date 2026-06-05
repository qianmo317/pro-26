import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Tag,
  Tabs,
} from '@arco-design/web-react';
import { IconPlus, IconEye } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { OutboundOrder, OutboundItem } from '../types';

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

export default function Outbound() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [form] = Form.useForm();
  const { outboundOrders, products, addOutboundOrder, updateOutboundOrder } =
    useWarehouseStore();

  const columns = [
    {
      title: '出库单号',
      dataIndex: 'orderNo',
      width: 160,
    },
    {
      title: '客户',
      dataIndex: 'customer',
    },
    {
      title: '商品数量',
      dataIndex: 'items',
      render: (items: OutboundItem[]) => items.length + ' 种',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待处理' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
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
      width: 180,
      render: (_: any, record: OutboundOrder) => (
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
              onClick={() => handleStartOutbound(record.id)}
            >
              开始出库
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleCompleteOutbound(record.id)}
            >
              完成出库
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStartOutbound = (id: string) => {
    updateOutboundOrder(id, { status: 'in_progress' });
    toast.success('已开始出库流程');
  };

  const handleCompleteOutbound = (id: string) => {
    updateOutboundOrder(id, { status: 'completed' });
    toast.success('出库完成');
  };

  const handleSubmit = (values: any) => {
    const newOrder: OutboundOrder = {
      id: String(Date.now()),
      orderNo: `OUT${Date.now()}`,
      customer: values.customer,
      status: 'pending',
      items: [
        {
          id: String(Date.now()) + '-1',
          productId: values.productId,
          productName: products.find((p) => p.id === values.productId)?.name || '',
          productSku: products.find((p) => p.id === values.productId)?.sku || '',
          planQuantity: values.quantity,
          actualQuantity: 0,
        },
      ],
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      remark: values.remark,
    };
    addOutboundOrder(newOrder);
    setModalVisible(false);
    form.resetFields();
    toast.success('出库单创建成功');
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
      render: (code: string) => code || '-',
    },
    {
      title: '计划数量',
      dataIndex: 'planQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      width: 100,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 120,
      render: (code: string) => code || '-',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>
            新建出库单
          </Button>
        </div>
      </div>

      <Tabs defaultActiveTab="all">
        <TabPane key="all" title="全部">
          <Table columns={columns} data={outboundOrders} rowKey="id" />
        </TabPane>
        <TabPane key="pending" title="待处理">
          <Table
            columns={columns}
            data={outboundOrders.filter((o) => o.status === 'pending')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="in_progress" title="进行中">
          <Table
            columns={columns}
            data={outboundOrders.filter((o) => o.status === 'in_progress')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="completed" title="已完成">
          <Table
            columns={columns}
            data={outboundOrders.filter((o) => o.status === 'completed')}
            rowKey="id"
          />
        </TabPane>
      </Tabs>

      <Modal
        title="新建出库单"
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem label="客户名称" field="customer" rules={[{ required: true }]}>
            <Input placeholder="请输入客户名称" />
          </FormItem>
          <FormItem label="商品" field="productId" rules={[{ required: true }]}>
            <Select placeholder="请选择商品">
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="出库数量" field="quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </FormItem>
          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入备注信息" />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title="出库单详情"
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
                <div style={{ color: '#666', fontSize: '12px' }}>出库单号</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.orderNo}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>客户</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.customer}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>状态</div>
                <div>
                  <Tag
                    color={
                      selectedOrder.status === 'completed'
                        ? 'green'
                        : selectedOrder.status === 'in_progress'
                        ? 'blue'
                        : 'orange'
                    }
                  >
                    {selectedOrder.status === 'completed'
                      ? '已完成'
                      : selectedOrder.status === 'in_progress'
                      ? '进行中'
                      : '待处理'}
                  </Tag>
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>创建时间</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.createTime}</div>
              </div>
            </div>
            <div style={{ marginBottom: '12px', fontWeight: '500' }}>出库明细</div>
            <Table
              columns={detailColumns}
              data={selectedOrder.items}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
