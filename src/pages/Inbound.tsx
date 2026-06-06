import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Tag,
  Tabs,
  Dropdown,
} from '@arco-design/web-react';
import { IconPlus, IconEye, IconPrinter, IconDown } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import PrintModal from '../components/PrintModal';
import InboundPrintTemplate from '../components/InboundPrintTemplate';
import LabelPrint from '../components/LabelPrint';
import type { InboundOrder, InboundItem } from '../types';

interface InboundFormValues {
  supplierId: string;
  productId: string;
  quantity: number;
  batchNo: string;
  productionDate: unknown;
  remark?: string;
}

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

export default function Inbound() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [printVisible, setPrintVisible] = useState(false);
  const [labelPrintVisible, setLabelPrintVisible] = useState(false);
  const [printType, setPrintType] = useState<'order' | 'label'>('order');
  const [form] = Form.useForm();
  const { suppliers, inboundOrders, products, addInboundOrder, updateInboundOrder } =
    useWarehouseStore();

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === 'active'),
    [suppliers]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const columns = [
    {
      title: '入库单号',
      dataIndex: 'orderNo',
      width: 160,
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
    },
    {
      title: '商品数量',
      dataIndex: 'items',
      render: (items: InboundItem[]) => items.length + ' 种',
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
      width: 240,
      render: (_: unknown, record: InboundOrder) => (
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
          <Dropdown
            droplist={
              <div>
                <div
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedOrder(record);
                    setPrintType('order');
                    setPrintVisible(true);
                  }}
                >
                  打印入库单
                </div>
                <div
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedOrder(record);
                    setPrintType('label');
                    setLabelPrintVisible(true);
                  }}
                >
                  打印商品标签
                </div>
              </div>
            }
            trigger="click"
          >
            <Button
              type="text"
              size="small"
              icon={<IconPrinter />}
              style={{ color: 'var(--primary-color)' }}
            >
              打印
              <IconDown />
            </Button>
          </Dropdown>
          {record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              status="warning"
              onClick={() => handleStartInbound(record.id)}
            >
              开始入库
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleCompleteInbound(record.id)}
            >
              完成入库
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStartInbound = (id: string) => {
    updateInboundOrder(id, { status: 'in_progress' });
    toast.success('已开始入库流程');
  };

  const handleCompleteInbound = (id: string) => {
    try {
      updateInboundOrder(id, { status: 'completed' });
      toast.success('入库完成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '入库失败');
    }
  };

  const handleSubmit = (values: InboundFormValues) => {
    const supplier = suppliers.find((s) => s.id === values.supplierId);
    if (!supplier) {
      toast.error('请选择有效的供应商');
      return;
    }
    const newOrder: InboundOrder = {
      id: String(Date.now()),
      orderNo: `IN${Date.now()}`,
      supplierId: values.supplierId,
      supplier: supplier.companyName,
      status: 'pending',
      items: [
        {
          id: String(Date.now()) + '-1',
          productId: values.productId,
          productName: products.find((p) => p.id === values.productId)?.name || '',
          productSku: products.find((p) => p.id === values.productId)?.sku || '',
          planQuantity: values.quantity,
          actualQuantity: 0,
          batchNo: values.batchNo,
          productionDate: values.productionDate
            ? typeof (values.productionDate as { format?: (f: string) => string }).format === 'function'
              ? (values.productionDate as { format: (f: string) => string }).format('YYYY-MM-DD')
              : String(values.productionDate)
            : '',
        },
      ],
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
      remark: values.remark,
    };
    addInboundOrder(newOrder);
    setModalVisible(false);
    form.resetFields();
    setSelectedSupplierId('');
    toast.success('入库单创建成功');
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
            新建入库单
          </Button>
        </div>
      </div>

      <Tabs defaultActiveTab="all">
        <TabPane key="all" title="全部">
          <Table columns={columns} data={inboundOrders} rowKey="id" />
        </TabPane>
        <TabPane key="pending" title="待处理">
          <Table
            columns={columns}
            data={inboundOrders.filter((o) => o.status === 'pending')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="in_progress" title="进行中">
          <Table
            columns={columns}
            data={inboundOrders.filter((o) => o.status === 'in_progress')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="completed" title="已完成">
          <Table
            columns={columns}
            data={inboundOrders.filter((o) => o.status === 'completed')}
            rowKey="id"
          />
        </TabPane>
      </Tabs>

      <Modal
        title="新建入库单"
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setSelectedSupplierId('');
          form.resetFields();
        }}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem label="供应商" field="supplierId" rules={[{ required: true, message: '请选择供应商' }]}>
            <Select
              placeholder="请选择供应商"
              onChange={(value: string) => setSelectedSupplierId(value)}
              filterOption={(inputValue, option) => {
                const optionValue = option && 'value' in option ? String(option.value) : '';
                const supplier = activeSuppliers.find((s) => s.id === optionValue);
                if (!supplier) return false;
                return (
                  supplier.companyName.includes(inputValue) ||
                  supplier.code.includes(inputValue)
                );
              }}
              showSearch
            >
              {activeSuppliers.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.companyName} ({s.code})
                </Option>
              ))}
            </Select>
          </FormItem>

          {selectedSupplier && (
            <div
              style={{
                background: '#f5f7fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                供应商信息
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>供应商编码</div>
                  <div style={{ fontWeight: '500' }}>{selectedSupplier.code}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>信用评级</div>
                  <Tag
                    color={
                      selectedSupplier.creditRating === 'A'
                        ? 'green'
                        : selectedSupplier.creditRating === 'B'
                        ? 'blue'
                        : selectedSupplier.creditRating === 'C'
                        ? 'orange'
                        : 'red'
                    }
                  >
                    {selectedSupplier.creditRating}级
                  </Tag>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系人</div>
                  <div style={{ fontWeight: '500' }}>{selectedSupplier.contact}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系电话</div>
                  <div style={{ fontWeight: '500' }}>{selectedSupplier.phone}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>地址</div>
                  <div style={{ fontWeight: '500' }}>{selectedSupplier.address}</div>
                </div>
              </div>
            </div>
          )}

          <FormItem label="商品" field="productId" rules={[{ required: true, message: '请选择商品' }]}>
            <Select placeholder="请选择商品">
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="入库数量" field="quantity" rules={[{ required: true, message: '请输入入库数量' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </FormItem>
          <FormItem label="批次号" field="batchNo" rules={[{ required: true, message: '请输入批次号' }]}>
            <Input placeholder="请输入批次号" />
          </FormItem>
          <FormItem label="生产日期" field="productionDate" rules={[{ required: true, message: '请选择生产日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </FormItem>
          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入备注信息" />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title="入库单详情"
        visible={detailVisible}
        onOk={() => setDetailVisible(false)}
        onCancel={() => setDetailVisible(false)}
        style={{ width: 800 }}
        footer={
          selectedOrder ? (
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              <Dropdown
                droplist={
                  <div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer' }}
                      onClick={() => {
                        setDetailVisible(false);
                        setPrintType('order');
                        setPrintVisible(true);
                      }}
                    >
                      打印入库单
                    </div>
                    <div
                      style={{ padding: '8px 16px', cursor: 'pointer' }}
                      onClick={() => {
                        setDetailVisible(false);
                        setPrintType('label');
                        setLabelPrintVisible(true);
                      }}
                    >
                      打印商品标签
                    </div>
                  </div>
                }
                trigger="click"
              >
                <Button type="primary" icon={<IconPrinter />}>
                  打印
                  <IconDown />
                </Button>
              </Dropdown>
            </Space>
          ) : null
        }
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
                <div style={{ color: '#666', fontSize: '12px' }}>入库单号</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.orderNo}</div>
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
                <div style={{ color: '#666', fontSize: '12px' }}>供应商</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.supplier}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>创建时间</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.createTime}</div>
              </div>
            </div>
            {(() => {
              const supplier = suppliers.find((s) => s.id === selectedOrder.supplierId);
              if (supplier) {
                return (
                  <div
                    style={{
                      background: '#f5f7fa',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                      供应商信息
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>供应商编码</div>
                        <div style={{ fontWeight: '500' }}>{supplier.code}</div>
                      </div>
                      <div>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>信用评级</div>
                        <Tag
                          color={
                            supplier.creditRating === 'A'
                              ? 'green'
                              : supplier.creditRating === 'B'
                              ? 'blue'
                              : supplier.creditRating === 'C'
                              ? 'orange'
                              : 'red'
                          }
                        >
                          {supplier.creditRating}级
                        </Tag>
                      </div>
                      <div>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系人</div>
                        <div style={{ fontWeight: '500' }}>{supplier.contact}</div>
                      </div>
                      <div>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系电话</div>
                        <div style={{ fontWeight: '500' }}>{supplier.phone}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>地址</div>
                        <div style={{ fontWeight: '500' }}>{supplier.address}</div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <div style={{ marginBottom: '12px', fontWeight: '500' }}>入库明细</div>
            <Table
              columns={detailColumns}
              data={selectedOrder.items}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      <PrintModal
        visible={printVisible && printType === 'order' && selectedOrder !== null}
        title="打印入库单"
        onCancel={() => setPrintVisible(false)}
        onAfterPrint={() => toast.success('入库单打印任务已发送')}
      >
        {selectedOrder && (
          <InboundPrintTemplate
            data={{
              orderNo: selectedOrder.orderNo,
              supplier: selectedOrder.supplier,
              operator: selectedOrder.operator || '-',
              createTime: selectedOrder.createTime,
              items: selectedOrder.items.map((item) => ({
                productName: item.productName,
                productSku: item.productSku,
                batchNo: item.batchNo,
                planQuantity: item.planQuantity,
                actualQuantity: item.actualQuantity,
                locationCode: item.locationCode || '-',
              })),
            }}
          />
        )}
      </PrintModal>

      <PrintModal
        visible={labelPrintVisible && printType === 'label' && selectedOrder !== null}
        title="打印商品标签"
        onCancel={() => setLabelPrintVisible(false)}
        onAfterPrint={() => toast.success('标签打印任务已发送')}
      >
        {selectedOrder && (
          <LabelPrint
            items={selectedOrder.items.map((item) => ({
              sku: item.productSku,
              name: item.productName,
              batchNo: item.batchNo,
              quantity: item.actualQuantity || item.planQuantity,
              inboundDate: selectedOrder.createTime.split(' ')[0],
            }))}
          />
        )}
      </PrintModal>
    </div>
  );
}
