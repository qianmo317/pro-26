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
  Message,
} from '@arco-design/web-react';
import { IconPlus, IconEye, IconPrinter, IconDown, IconEdit, IconClose } from '@arco-design/web-react/icon';
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

interface ReceiveFormValues {
  items: Array<{
    id: string;
    receiveQuantity: number;
    locationId: string;
  }>;
}

interface CloseFormValues {
  differenceReason: string;
}

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

export default function Inbound() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [printVisible, setPrintVisible] = useState(false);
  const [labelPrintVisible, setLabelPrintVisible] = useState(false);
  const [printType, setPrintType] = useState<'order' | 'label'>('order');
  const [receiveForm] = Form.useForm<ReceiveFormValues>();
  const [closeForm] = Form.useForm<CloseFormValues>();
  const [confirmForm] = Form.useForm<CloseFormValues>();
  const [form] = Form.useForm();
  const { suppliers, inboundOrders, products, locations, addInboundOrder, updateInboundOrder } =
    useWarehouseStore();

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === 'active'),
    [suppliers]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const normalLocations = useMemo(
    () => locations.filter((l) => l.status !== 'locked'),
    [locations]
  );

  const hasDifference = (order: InboundOrder): boolean => {
    return order.items.some((item) => item.receivedQuantity < item.planQuantity);
  };

  const getDifferenceItems = (order: InboundOrder): InboundItem[] => {
    return order.items.filter((item) => item.receivedQuantity < item.planQuantity);
  };

  const isAllReceived = (order: InboundOrder): boolean => {
    return order.items.every((item) => item.receivedQuantity >= item.planQuantity);
  };

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
      title: '计划总数',
      dataIndex: 'items',
      render: (items: InboundItem[]) => items.reduce((sum, item) => sum + item.planQuantity, 0),
      width: 100,
    },
    {
      title: '已收总数',
      dataIndex: 'items',
      render: (items: InboundItem[]) => items.reduce((sum, item) => sum + item.receivedQuantity, 0),
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
          cancelled: { color: 'red', text: '已关闭' },
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
      width: 300,
      render: (_: unknown, record: InboundOrder) => (
        <Space wrap>
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
            <>
              <Button
                type="text"
                size="small"
                icon={<IconEdit />}
                status="success"
                onClick={() => handleOpenReceiveModal(record)}
              >
                收货
              </Button>
              <Button
                type="text"
                size="small"
                status="success"
                onClick={() => handleCompleteInbound(record)}
              >
                完成入库
              </Button>
              <Button
                type="text"
                size="small"
                icon={<IconClose />}
                status="danger"
                onClick={() => handleOpenCloseModal(record)}
              >
                手动关闭
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleStartInbound = (id: string) => {
    updateInboundOrder(id, { status: 'in_progress' });
    toast.success('已开始入库流程');
  };

  const handleOpenReceiveModal = (order: InboundOrder) => {
    setSelectedOrder(order);
    receiveForm.resetFields();
    const initialItems = order.items.map((item) => ({
      id: item.id,
      receiveQuantity: item.planQuantity - item.receivedQuantity,
      locationId: item.locationId || normalLocations[0]?.id || '',
    }));
    receiveForm.setFieldsValue({ items: initialItems });
    setReceiveModalVisible(true);
  };

  const handleReceiveSubmit = (values: ReceiveFormValues) => {
    if (!selectedOrder) return;

    const newItems = selectedOrder.items.map((item) => {
      const receiveItem = values.items.find((vi) => vi.id === item.id);
      const receiveQty = receiveItem?.receiveQuantity || 0;
      const location = normalLocations.find((l) => l.id === receiveItem?.locationId);

      if (receiveQty < 0) {
        throw new Error('收货数量不能为负数');
      }
      if (item.receivedQuantity + receiveQty > item.planQuantity) {
        throw new Error(`${item.productName} 累计收货数量不能超过计划数量`);
      }

      return {
        ...item,
        receivedQuantity: item.receivedQuantity + receiveQty,
        actualQuantity: receiveQty > 0 ? receiveQty : item.actualQuantity,
        locationId: location?.id || item.locationId,
        locationCode: location?.code || item.locationCode,
      };
    });

    updateInboundOrder(selectedOrder.id, {
      items: newItems,
      status: 'in_progress',
    });

    toast.success('收货成功');
    setReceiveModalVisible(false);

    const updatedOrder = { ...selectedOrder, items: newItems };
    if (isAllReceived(updatedOrder)) {
      Message.info({
        content: '所有商品已收齐，可点击"完成入库"结束单据',
        duration: 3000,
      });
    }
  };

  const handleCompleteInbound = (order: InboundOrder) => {
    if (hasDifference(order)) {
      setSelectedOrder(order);
      confirmForm.resetFields();
      setConfirmModalVisible(true);
    } else {
      doCompleteInbound(order.id);
    }
  };

  const handleConfirmComplete = (values: CloseFormValues) => {
    if (!selectedOrder) return;
    doCompleteInbound(selectedOrder.id, values.differenceReason);
    setConfirmModalVisible(false);
  };

  const doCompleteInbound = (id: string, differenceReason?: string) => {
    try {
      const updateData: Partial<InboundOrder> = {
        status: 'completed',
      };
      if (differenceReason) {
        updateData.differenceReason = differenceReason;
      }
      updateInboundOrder(id, updateData);
      toast.success('入库完成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '入库失败');
    }
  };

  const handleOpenCloseModal = (order: InboundOrder) => {
    setSelectedOrder(order);
    closeForm.resetFields();
    setCloseModalVisible(true);
  };

  const handleCloseSubmit = (values: CloseFormValues) => {
    if (!selectedOrder) return;
    try {
      updateInboundOrder(selectedOrder.id, {
        status: 'cancelled',
        differenceReason: values.differenceReason,
      });
      toast.success('入库单已关闭');
      setCloseModalVisible(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
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
          receivedQuantity: 0,
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
      render: (val: number) => <span style={{ color: '#1d2129', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '累计收货',
      dataIndex: 'receivedQuantity',
      width: 100,
      render: (val: number, record: InboundItem) => {
        const diff = record.planQuantity - val;
        return (
          <div>
            <span style={{ color: '#00b42a', fontWeight: 500 }}>{val}</span>
            {diff > 0 && (
              <Tag color="orange" style={{ marginLeft: '8px' }}>
                欠 {diff}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '差异数量',
      dataIndex: 'planQuantity',
      width: 100,
      render: (_: number, record: InboundItem) => {
        const diff = record.planQuantity - record.receivedQuantity;
        if (diff === 0) {
          return <span style={{ color: '#00b42a' }}>-</span>;
        }
        return <span style={{ color: '#f53f3f', fontWeight: 500 }}>{diff}</span>;
      },
    },
    {
      title: '本次实收',
      dataIndex: 'actualQuantity',
      width: 100,
      render: (val: number) => val || 0,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 120,
      render: (code: string) => code || '-',
    },
  ];

  const receiveColumns = [
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
      title: '计划数量',
      dataIndex: 'planQuantity',
      width: 100,
    },
    {
      title: '已收数量',
      dataIndex: 'receivedQuantity',
      width: 100,
    },
    {
      title: '待收数量',
      width: 100,
      render: (_: unknown, record: InboundItem) => record.planQuantity - record.receivedQuantity,
    },
    {
      title: '本次收货',
      width: 140,
      render: (_: unknown, record: InboundItem, index: number) => (
        <FormItem
          field={`items[${index}].receiveQuantity`}
          rules={[
            { required: true, message: '请输入收货数量' },
            {
              validator: (value: number) => {
                if (value === undefined || value === null) return true;
                if (value < 0) {
                  return { success: false, message: '数量不能为负' };
                }
                const remaining = record.planQuantity - record.receivedQuantity;
                if (value > remaining) {
                  return { success: false, message: `不能超过待收数量 ${remaining}` };
                }
                return { success: true };
              },
            },
          ]}
          style={{ marginBottom: 0 }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            max={record.planQuantity - record.receivedQuantity}
          />
        </FormItem>
      ),
    },
    {
      title: '库位',
      width: 160,
      render: (_: unknown, _record: InboundItem, index: number) => (
        <FormItem
          field={`items[${index}].locationId`}
          rules={[{ required: true, message: '请选择库位' }]}
          style={{ marginBottom: 0 }}
        >
          <Select placeholder="请选择库位">
            {normalLocations.map((l) => (
              <Option key={l.id} value={l.id}>
                {l.code} (剩余: {l.capacity - l.current})
              </Option>
            ))}
          </Select>
        </FormItem>
      ),
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
        <TabPane key="cancelled" title="已关闭">
          <Table
            columns={columns}
            data={inboundOrders.filter((o) => o.status === 'cancelled')}
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
        title="入库收货"
        visible={receiveModalVisible}
        onOk={() => receiveForm.submit()}
        onCancel={() => setReceiveModalVisible(false)}
        style={{ width: 900 }}
        okText="确认收货"
        cancelText="取消"
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                background: '#e6fffb',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #87e8de',
              }}
            >
              <div style={{ color: '#0e6245', fontWeight: 500 }}>
                入库单号：{selectedOrder.orderNo} | 供应商：{selectedOrder.supplier}
              </div>
              <div style={{ color: '#0e6245', fontSize: '13px', marginTop: '4px' }}>
                填写本次实际收货数量，可小于计划数量进行部分收货。入库单状态保持为"进行中"，可继续收货。
              </div>
            </div>
            <Form form={receiveForm} layout="vertical" onSubmit={handleReceiveSubmit}>
              <FormItem field="items" style={{ marginBottom: 0 }}>
                <Table
                  columns={receiveColumns}
                  data={selectedOrder.items}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </FormItem>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="确认完成入库"
        visible={confirmModalVisible}
        onOk={() => confirmForm.submit()}
        onCancel={() => setConfirmModalVisible(false)}
        style={{ width: 520 }}
        okText="确认完成"
        cancelText="取消"
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                background: '#fff7e6',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #ffd591',
              }}
            >
              <div style={{ color: '#d46b08', fontWeight: 500, marginBottom: '8px' }}>
                ⚠️ 存在收货差异
              </div>
              <div style={{ color: '#d46b08', fontSize: '13px', marginBottom: '8px' }}>
                以下商品收货数量少于计划数量：
              </div>
              {getDifferenceItems(selectedOrder).map((item) => (
                <div key={item.id} style={{ color: '#d46b08', fontSize: '13px' }}>
                  • {item.productName}：计划 {item.planQuantity}，已收 {item.receivedQuantity}，差 {item.planQuantity - item.receivedQuantity}
                </div>
              ))}
            </div>
            <Form form={confirmForm} layout="vertical" onSubmit={handleConfirmComplete}>
              <FormItem
                label="差异原因"
                field="differenceReason"
                rules={[{ required: true, message: '请填写差异原因' }]}
              >
                <TextArea
                  placeholder="请描述差异原因，如：供应商缺货、运输损坏、质量问题等"
                  style={{ minHeight: '100px' }}
                />
              </FormItem>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="手动关闭入库单"
        visible={closeModalVisible}
        onOk={() => closeForm.submit()}
        onCancel={() => setCloseModalVisible(false)}
        style={{ width: 520 }}
        okText="确认关闭"
        cancelText="取消"
      >
        {selectedOrder && (
          <div>
            <div
              style={{
                background: '#fff1f0',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #ffccc7',
              }}
            >
              <div style={{ color: '#cf1322', fontWeight: 500, marginBottom: '8px' }}>
                ⚠️ 关闭后将无法继续收货
              </div>
              <div style={{ color: '#cf1322', fontSize: '13px' }}>
                入库单号：{selectedOrder.orderNo}
              </div>
              {hasDifference(selectedOrder) && (
                <div style={{ color: '#cf1322', fontSize: '13px', marginTop: '8px' }}>
                  存在未收齐商品，关闭后差异将被记录。
                </div>
              )}
            </div>
            <Form form={closeForm} layout="vertical" onSubmit={handleCloseSubmit}>
              <FormItem
                label="关闭原因"
                field="differenceReason"
                rules={[{ required: true, message: '请填写关闭原因' }]}
              >
                <TextArea
                  placeholder="请描述关闭原因，如：供应商取消发货、订单取消等"
                  style={{ minHeight: '100px' }}
                />
              </FormItem>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="入库单详情"
        visible={detailVisible}
        onOk={() => setDetailVisible(false)}
        onCancel={() => setDetailVisible(false)}
        style={{ width: 900 }}
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
                gridTemplateColumns: '1fr 1fr 1fr',
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
                        : selectedOrder.status === 'cancelled'
                        ? 'red'
                        : 'orange'
                    }
                  >
                    {selectedOrder.status === 'completed'
                      ? '已完成'
                      : selectedOrder.status === 'in_progress'
                      ? '进行中'
                      : selectedOrder.status === 'cancelled'
                      ? '已关闭'
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
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>更新时间</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.updateTime}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>操作人</div>
                <div style={{ fontWeight: '500' }}>{selectedOrder.operator || '-'}</div>
              </div>
            </div>

            <div
              style={{
                background: '#f5f7fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '12px', color: '#333' }}>
                收货汇总
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>计划总数</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#1d2129' }}>
                    {selectedOrder.items.reduce((sum, item) => sum + item.planQuantity, 0)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>累计收货</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#00b42a' }}>
                    {selectedOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>差异总数</div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: hasDifference(selectedOrder) ? '#f53f3f' : '#00b42a',
                    }}
                  >
                    {selectedOrder.items.reduce((sum, item) => sum + (item.planQuantity - item.receivedQuantity), 0)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>完成率</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#165dff' }}>
                    {selectedOrder.items.reduce((sum, item) => sum + item.planQuantity, 0) > 0
                      ? Math.round(
                          (selectedOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0) /
                            selectedOrder.items.reduce((sum, item) => sum + item.planQuantity, 0)) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>

            {selectedOrder.differenceReason && (
              <div
                style={{
                  background: '#fff7e6',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #ffd591',
                }}
              >
                <div style={{ color: '#d46b08', fontWeight: 500, marginBottom: '4px' }}>
                  {selectedOrder.status === 'cancelled' ? '关闭原因' : '差异原因'}
                </div>
                <div style={{ color: '#873800' }}>{selectedOrder.differenceReason}</div>
              </div>
            )}

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
                actualQuantity: item.receivedQuantity,
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
              quantity: item.receivedQuantity || item.planQuantity,
              inboundDate: selectedOrder.createTime.split(' ')[0],
            }))}
          />
        )}
      </PrintModal>
    </div>
  );
}
