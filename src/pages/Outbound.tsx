import { useState, useMemo } from 'react';
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
  Progress,
  Divider,
  Descriptions,
  Checkbox,
  Alert,
  Badge,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEye,
  IconUserAdd,
  IconSwap,
  IconInfoCircle,
  IconCheck,
  IconClose,
  IconScan,
} from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/Toast';
import type {
  OutboundOrder,
  OutboundItem,
  OutboundSplitSubOrder,
  OutboundSplitItem,
  ReviewItem,
} from '../types';
import { useNavigate } from 'react-router-dom';

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

interface SplitFormItem {
  productId: string;
  productName: string;
  productSku: string;
  remainingQuantity: number;
  subOrders: Array<{
    quantity: number;
    batchNo?: string;
  }>;
}

export default function Outbound() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [splitVisible, setSplitVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<OutboundOrder | null>(null);
  const [splittingOrder, setSplittingOrder] = useState<OutboundOrder | null>(null);
  const [splitProducts, setSplitProducts] = useState<SplitFormItem[]>([]);
  const [subOrderCount, setSubOrderCount] = useState(2);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewRemark, setReviewRemark] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    outboundOrders,
    products,
    customers,
    addOutboundOrder,
    updateOutboundOrder,
    splitOutboundOrder,
    getChildOrders,
    canReview,
    submitForReview,
    reviewOutboundOrder,
    getPendingReviewOrders,
  } = useWarehouseStore();

  const hasReviewPermission = useMemo(() => canReview(user), [user, canReview]);
  const pendingReviewCount = useMemo(() => getPendingReviewOrders().length, [getPendingReviewOrders]);

  const activeCustomers = customers.filter((c) => c.status === 'active');

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      form.setFieldsValue({
        customerName: customer.companyName,
        shippingAddress: customer.shippingAddress,
        contact: customer.contact,
        phone: customer.phone,
      });
    }
  };

  interface OutboundFormValues {
    customerId: string;
    customerName: string;
    shippingAddress: string;
    contact: string;
    phone: string;
    productId: string;
    quantity: number;
    remark?: string;
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      in_progress: { color: 'blue', text: '进行中' },
      pending_review: { color: 'gold', text: '待复核' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
      split: { color: 'purple', text: '已拆分' },
    };
    return statusMap[status] || { color: 'gray', text: '未知' };
  };

  const getChildOrdersProgress = (parentId: string) => {
    const children = getChildOrders(parentId);
    if (children.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const total = children.length;
    const completed = children.filter((c) => c.status === 'completed').length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  };

  const columns = [
    {
      title: '出库单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (orderNo: string, record: OutboundOrder) => (
        <div>
          <div>{orderNo}</div>
          {record.parentId && (
            <div style={{ fontSize: '12px', color: '#86909c' }}>
              子单 · {outboundOrders.find(o => o.id === record.parentId)?.orderNo}
            </div>
          )}
          {record.isParent && (
            <div style={{ fontSize: '12px', color: '#86909c' }}>
              父单 · {record.childIds?.length || 0} 个子单
            </div>
          )}
        </div>
      ),
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
      width: 120,
      render: (status: string) => {
        const s = getStatusDisplay(status);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '子单进度',
      dataIndex: 'childIds',
      width: 160,
      render: (_: unknown, record: OutboundOrder) => {
        if (!record.isParent) return '-';
        const progress = getChildOrdersProgress(record.id);
        return (
          <div>
            <Progress
              percent={progress.percentage}
              size="small"
              status={progress.percentage === 100 ? 'success' : 'normal'}
            />
            <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
              {progress.completed}/{progress.total} 已完成
            </div>
          </div>
        );
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
      width: 360,
      render: (_: unknown, record: OutboundOrder) => (
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
              status="warning"
              onClick={() => handleSubmitForReview(record.id)}
            >
              提交复核
            </Button>
          )}
          {record.status === 'pending_review' && hasReviewPermission && (
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconScan />}
              onClick={() => handleOpenReview(record)}
            >
              复核
            </Button>
          )}
          {record.status === 'pending_review' && !hasReviewPermission && (
            <Button
              type="text"
              size="small"
              disabled
            >
              待复核
            </Button>
          )}
          {record.status === 'pending' && !record.parentId && (
            <Button
              type="text"
              size="small"
              icon={<IconSwap />}
              onClick={() => handleOpenSplit(record)}
            >
              拆分
            </Button>
          )}
          {record.isParent && (
            <Button
              type="text"
              size="small"
              icon={<IconInfoCircle />}
              onClick={() => {
                setSelectedOrder(record);
                setDetailVisible(true);
              }}
            >
              子单进度
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

  const handleSubmitForReview = (id: string) => {
    submitForReview(id, user?.name);
    toast.success('已提交复核，请等待复核人员审核');
  };

  const handleOpenReview = (order: OutboundOrder) => {
    if (!hasReviewPermission) {
      toast.error('您没有复核权限，请联系管理员或经理进行复核');
      return;
    }
    const initialReviewItems: ReviewItem[] = order.items.map((item) => ({
      itemId: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      planQuantity: item.planQuantity,
      actualQuantity: item.actualQuantity || item.planQuantity,
      checkQuantity: item.actualQuantity || item.planQuantity,
      batchNo: item.batchNo,
      checkBatchNo: item.batchNo || '',
      checkPass: true,
      checkRemark: '',
    }));
    setReviewItems(initialReviewItems);
    setReviewRemark('');
    setReviewingOrder(order);
    setReviewVisible(true);
  };

  const handleReviewItemChange = (index: number, field: keyof ReviewItem, value: unknown) => {
    setReviewItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleReviewSubmit = (result: 'pass' | 'fail') => {
    if (!reviewingOrder || !user) return;

    const allPass = reviewItems.every((item) => item.checkPass);
    if (result === 'pass' && !allPass) {
      Modal.confirm({
        title: '复核确认',
        content: '存在复核不通过的商品，确认要整体通过复核吗？',
        onOk: () => {
          doReview(result);
        },
      });
      return;
    }

    doReview(result);
  };

  const doReview = (result: 'pass' | 'fail') => {
    if (!reviewingOrder || !user) return;

    reviewOutboundOrder(
      reviewingOrder.id,
      result,
      reviewItems,
      user,
      reviewRemark
    );

    toast.success(result === 'pass' ? '复核通过，出库完成' : '复核不通过，已退回重新拣货');
    setReviewVisible(false);
    setReviewingOrder(null);
  };

  const handleSubmit = (values: OutboundFormValues) => {
    const customer = customers.find((c) => c.id === values.customerId);
    const newOrder: OutboundOrder = {
      id: String(Date.now()),
      orderNo: `OUT${Date.now()}`,
      customerId: values.customerId,
      customer: customer?.companyName || values.customerName,
      shippingAddress: values.shippingAddress,
      contact: values.contact,
      phone: values.phone,
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

  const handleOpenSplit = (order: OutboundOrder) => {
    setSplittingOrder(order);
    setSubOrderCount(2);
    const initialProducts: SplitFormItem[] = order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      remainingQuantity: item.planQuantity,
      subOrders: Array(2).fill(null).map(() => ({
        quantity: 0,
        batchNo: '',
      })),
    }));
    setSplitProducts(initialProducts);
    setSplitVisible(true);
  };

  const handleSubOrderCountChange = (count: number) => {
    setSubOrderCount(count);
    setSplitProducts(prev => prev.map(p => ({
      ...p,
      subOrders: Array(count).fill(null).map((_, idx) => 
        p.subOrders[idx] || { quantity: 0, batchNo: '' }
      ),
    })));
  };

  const handleQuantityChange = (productIdx: number, subOrderIdx: number, value: number) => {
    setSplitProducts(prev => {
      const newProducts = [...prev];
      const product = { ...newProducts[productIdx] };
      product.subOrders = [...product.subOrders];
      product.subOrders[subOrderIdx] = {
        ...product.subOrders[subOrderIdx],
        quantity: value || 0,
      };
      
      const totalAllocated = product.subOrders.reduce((sum, s) => sum + s.quantity, 0);
      product.remainingQuantity = splittingOrder?.items[productIdx]?.planQuantity || 0 - totalAllocated;
      
      newProducts[productIdx] = product;
      return newProducts;
    });
  };

  const handleBatchNoChange = (productIdx: number, subOrderIdx: number, value: string) => {
    setSplitProducts(prev => {
      const newProducts = [...prev];
      const product = { ...newProducts[productIdx] };
      product.subOrders = [...product.subOrders];
      product.subOrders[subOrderIdx] = {
        ...product.subOrders[subOrderIdx],
        batchNo: value,
      };
      newProducts[productIdx] = product;
      return newProducts;
    });
  };

  const validateSplit = () => {
    for (const product of splitProducts) {
      const totalAllocated = product.subOrders.reduce((sum, s) => sum + s.quantity, 0);
      const originalQuantity = splittingOrder?.items.find(i => i.productId === product.productId)?.planQuantity || 0;
      
      if (totalAllocated !== originalQuantity) {
        toast.error(`商品 ${product.productName} 的分配数量 (${totalAllocated}) 不等于原单数量 (${originalQuantity})`);
        return false;
      }
      
      if (product.subOrders.some(s => s.quantity <= 0)) {
        toast.error(`商品 ${product.productName} 的每个子单数量必须大于 0`);
        return false;
      }
    }
    return true;
  };

  const handleSplitSubmit = () => {
    if (!splittingOrder || !validateSplit()) return;

    const subOrders: OutboundSplitSubOrder[] = [];
    
    for (let i = 0; i < subOrderCount; i++) {
      const items: OutboundSplitItem[] = splitProducts.map(product => ({
        productId: product.productId,
        productName: product.productName,
        productSku: product.productSku,
        planQuantity: product.subOrders[i].quantity,
        batchNo: product.subOrders[i].batchNo || undefined,
      })).filter(item => item.planQuantity > 0);

      if (items.length > 0) {
        subOrders.push({
          id: String(i + 1),
          items,
        });
      }
    }

    const newOrders = splitOutboundOrder({
      parentOrderId: splittingOrder.id,
      subOrders,
    });

    toast.success(`成功拆分为 ${newOrders.length} 个子单`);
    setSplitVisible(false);
    setSplittingOrder(null);
    setSplitProducts([]);
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

  const childOrderColumns = [
    {
      title: '子单号',
      dataIndex: 'orderNo',
      width: 160,
    },
    {
      title: '商品明细',
      dataIndex: 'items',
      render: (items: OutboundItem[]) => 
        items.map(i => `${i.productName} × ${i.planQuantity}`).join(', '),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const s = getStatusDisplay(status);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      width: 160,
      render: (_: unknown, record: OutboundOrder) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              setSelectedOrder(record);
            }}
          >
            查看详情
          </Button>
        </Space>
      ),
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
        <div>
          <Button
            icon={<IconUserAdd />}
            onClick={() => navigate('/customer')}
          >
            客户档案
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
        <TabPane key="pending_review" title={
          <Space>
            待复核
            {pendingReviewCount > 0 && <Badge count={pendingReviewCount} color="gold" />}
          </Space>
        }>
          <Table
            columns={columns}
            data={outboundOrders.filter((o) => o.status === 'pending_review')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="split" title="已拆分">
          <Table
            columns={columns}
            data={outboundOrders.filter((o) => o.status === 'split')}
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
        style={{ width: 650 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem
              label="选择客户"
              field="customerId"
              rules={[{ required: true, message: '请选择客户' }]}
            >
              <Select
                placeholder="请从客户档案中选择"
                onChange={handleCustomerChange}
                showSearch
              >
                {activeCustomers.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.companyName} ({c.code})
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem
              label="客户名称"
              field="customerName"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="选择客户后自动填充" />
            </FormItem>
            <FormItem
              label="联系人"
              field="contact"
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input placeholder="选择客户后自动填充" />
            </FormItem>
            <FormItem
              label="联系电话"
              field="phone"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="选择客户后自动填充" />
            </FormItem>
          </div>
          <FormItem
            label="收货地址"
            field="shippingAddress"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input placeholder="选择客户后自动填充" />
          </FormItem>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem label="商品" field="productId" rules={[{ required: true, message: '请选择商品' }]}>
              <Select placeholder="请选择商品">
                {products.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </Option>
                ))}
              </Select>
            </FormItem>
            <FormItem label="出库数量" field="quantity" rules={[{ required: true, message: '请输入出库数量' }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </FormItem>
          </div>
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
        style={{ width: 900 }}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <Descriptions
              column={2}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  出库单信息
                  {selectedOrder.isParent && (
                    <Tag color="purple">父单</Tag>
                  )}
                  {selectedOrder.parentId && (
                    <Tag color="cyan">子单</Tag>
                  )}
                </div>
              }
              data={[
                {
                  label: '出库单号',
                  value: selectedOrder.orderNo,
                },
                {
                  label: '客户',
                  value: selectedOrder.customer,
                },
                {
                  label: '联系人',
                  value: selectedOrder.contact || '-',
                },
                {
                  label: '联系电话',
                  value: selectedOrder.phone || '-',
                },
                {
                  label: '收货地址',
                  value: selectedOrder.shippingAddress || '-',
                },
                {
                  label: '状态',
                  value: (
                    <Tag color={getStatusDisplay(selectedOrder.status).color}>
                      {getStatusDisplay(selectedOrder.status).text}
                    </Tag>
                  ),
                },
                {
                  label: '创建时间',
                  value: selectedOrder.createTime,
                },
                {
                  label: '操作人',
                  value: selectedOrder.operator || '-',
                },
                ...(selectedOrder.parentId ? [{
                  label: '关联父单',
                  value: outboundOrders.find(o => o.id === selectedOrder.parentId)?.orderNo || '-',
                }] : []),
                ...(selectedOrder.splitTime ? [{
                  label: '拆分时间',
                  value: selectedOrder.splitTime,
                }] : []),
                ...(selectedOrder.remark ? [{
                  label: '备注',
                  value: selectedOrder.remark,
                }] : []),
              ]}
            />

            <Divider />

            <div style={{ marginBottom: '12px', fontWeight: '500' }}>出库明细</div>
            <Table
              columns={detailColumns}
              data={selectedOrder.items}
              pagination={false}
              size="small"
            />

            {selectedOrder.isParent && (
              <>
                <Divider />
                <div style={{ marginBottom: '12px', fontWeight: '500' }}>
                  子单执行进度 ({getChildOrdersProgress(selectedOrder.id).completed}/{getChildOrdersProgress(selectedOrder.id).total} 已完成)
                </div>
                <Table
                  columns={childOrderColumns}
                  data={getChildOrders(selectedOrder.id)}
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {selectedOrder.reviewRecords && selectedOrder.reviewRecords.length > 0 && (
              <>
                <Divider />
                <div style={{ marginBottom: '12px', fontWeight: '500' }}>
                  复核记录
                </div>
                {selectedOrder.reviewRecords.map((record, recordIdx) => (
                  <div
                    key={record.id}
                    style={{
                      marginBottom: '16px',
                      padding: '12px',
                      border: '1px solid #e5e6eb',
                      borderRadius: '4px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <Space>
                        <Tag
                          color={record.reviewResult === 'pass' ? 'green' : 'red'}
                          icon={
                            record.reviewResult === 'pass' ? <IconCheck /> : <IconClose />
                          }
                        >
                          {record.reviewResult === 'pass' ? '复核通过' : '复核不通过'}
                        </Tag>
                        <span style={{ fontWeight: '500' }}>第 {recordIdx + 1} 次复核</span>
                      </Space>
                      <Space size="large">
                        <span style={{ fontSize: '12px', color: '#86909c' }}>
                          复核人：{record.reviewer} ({record.reviewerRole})
                        </span>
                        <span style={{ fontSize: '12px', color: '#86909c' }}>
                          {record.reviewTime}
                        </span>
                      </Space>
                    </div>
                    {record.reviewRemark && (
                      <div
                        style={{
                          marginBottom: '8px',
                          padding: '8px',
                          background: '#f7f8fa',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      >
                        复核备注：{record.reviewRemark}
                      </div>
                    )}
                    <Table
                      columns={[
                        {
                          title: '商品名称',
                          dataIndex: 'productName',
                          width: 140,
                        },
                        {
                          title: 'SKU',
                          dataIndex: 'productSku',
                          width: 120,
                        },
                        {
                          title: '计划数量',
                          dataIndex: 'planQuantity',
                          width: 90,
                        },
                        {
                          title: '实际数量',
                          dataIndex: 'actualQuantity',
                          width: 90,
                        },
                        {
                          title: '复核数量',
                          dataIndex: 'checkQuantity',
                          width: 90,
                          render: (qty: number, record: ReviewItem) => (
                            <span
                              style={{
                                color: qty !== record.actualQuantity ? '#f53f3f' : '#000',
                              }}
                            >
                              {qty}
                            </span>
                          ),
                        },
                        {
                          title: '原批次',
                          dataIndex: 'batchNo',
                          width: 100,
                          render: (code: string) => code || '-',
                        },
                        {
                          title: '复核批次',
                          dataIndex: 'checkBatchNo',
                          width: 100,
                          render: (code: string, record: ReviewItem) => (
                            <span
                              style={{
                                color: code !== record.batchNo ? '#f53f3f' : '#000',
                              }}
                            >
                              {code || '-'}
                            </span>
                          ),
                        },
                        {
                          title: '复核结果',
                          dataIndex: 'checkPass',
                          width: 90,
                          render: (pass: boolean) => (
                            <Tag color={pass ? 'green' : 'red'}>
                              {pass ? '通过' : '不通过'}
                            </Tag>
                          ),
                        },
                        {
                          title: '备注',
                          dataIndex: 'checkRemark',
                          render: (remark: string) => remark || '-',
                        },
                      ]}
                      data={record.reviewItems}
                      pagination={false}
                      size="small"
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSwap />
            拆分出库单
          </div>
        }
        visible={splitVisible}
        onOk={handleSplitSubmit}
        onCancel={() => setSplitVisible(false)}
        style={{ width: 900 }}
        okText="确认拆分"
        cancelText="取消"
      >
        {splittingOrder && (
          <div>
            <div style={{ 
              padding: '16px', 
              background: '#f2f3f5', 
              borderRadius: '4px', 
              marginBottom: '16px' 
            }}>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '8px' }}>
                <div>
                  <span style={{ color: '#86909c' }}>原单号：</span>
                  <span style={{ fontWeight: '500' }}>{splittingOrder.orderNo}</span>
                </div>
                <div>
                  <span style={{ color: '#86909c' }}>客户：</span>
                  <span>{splittingOrder.customer}</span>
                </div>
              </div>
              <div>
                <span style={{ color: '#86909c' }}>收货地址：</span>
                <span>{splittingOrder.shippingAddress}</span>
              </div>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>拆分为</span>
              <InputNumber
                min={2}
                max={10}
                value={subOrderCount}
                onChange={handleSubOrderCountChange}
                style={{ width: '80px' }}
              />
              <span>个子单</span>
            </div>

            {splitProducts.map((product, productIdx) => {
              const originalItem = splittingOrder.items.find(i => i.productId === product.productId);
              const totalAllocated = product.subOrders.reduce((sum, s) => sum + s.quantity, 0);
              const remaining = (originalItem?.planQuantity || 0) - totalAllocated;
              
              return (
                <div key={product.productId} style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px' 
                  }}>
                    <div style={{ fontWeight: '500' }}>
                      {product.productName} ({product.productSku})
                    </div>
                    <div>
                      <Tag color="blue">原计划: {originalItem?.planQuantity || 0}</Tag>
                      <Tag color={remaining === 0 ? 'green' : 'orange'}>
                        已分配: {totalAllocated}
                      </Tag>
                      <Tag color={remaining === 0 ? 'green' : 'red'}>
                        剩余: {remaining}
                      </Tag>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${subOrderCount}, 1fr)`, 
                    gap: '16px' 
                  }}>
                    {product.subOrders.map((subOrder, subOrderIdx) => (
                      <div 
                        key={subOrderIdx} 
                        style={{ 
                          padding: '12px', 
                          border: '1px solid #e5e6eb', 
                          borderRadius: '4px' 
                        }}
                      >
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '500', 
                          marginBottom: '8px',
                          color: '#1d2129'
                        }}>
                          子单 {subOrderIdx + 1}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px' }}>
                            出库数量
                          </div>
                          <InputNumber
                            min={0}
                            max={originalItem?.planQuantity || 99999}
                            value={subOrder.quantity}
                            onChange={(value) => handleQuantityChange(productIdx, subOrderIdx, value as number)}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#86909c', marginBottom: '4px' }}>
                            批次号 (可选)
                          </div>
                          <Input
                            placeholder="请输入批次号"
                            value={subOrder.batchNo}
                            onChange={(value) => handleBatchNoChange(productIdx, subOrderIdx, value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ 
              padding: '12px', 
              background: '#e8f3ff', 
              borderRadius: '4px',
              fontSize: '13px',
              color: '#165DFF'
            }}>
              <IconInfoCircle style={{ marginRight: '4px' }} />
              拆分后原单状态变为"已拆分"，各子单独立流转。请确保每个商品的分配数量之和等于原计划数量。
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconScan />
            出库复核
          </div>
        }
        visible={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        style={{ width: 1000 }}
        footer={null}
        maskClosable={false}
      >
        {reviewingOrder && (
          <div>
            <Alert
              type="info"
              content={
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    出库单：{reviewingOrder.orderNo} | 客户：{reviewingOrder.customer}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    请仔细核对每个商品的 SKU、批次号和数量，确保出库准确。
                  </div>
                </div>
              }
              style={{ marginBottom: '16px' }}
            />

            <div style={{ marginBottom: '12px', fontWeight: '500' }}>
              复核明细
            </div>

            <Table
              columns={[
                {
                  title: '商品名称',
                  dataIndex: 'productName',
                  width: 140,
                },
                {
                  title: 'SKU',
                  dataIndex: 'productSku',
                  width: 120,
                  render: (sku: string) => (
                    <span style={{ fontFamily: 'monospace', background: '#f2f3f5', padding: '2px 6px', borderRadius: '2px' }}>
                      {sku}
                    </span>
                  ),
                },
                {
                  title: '计划数量',
                  dataIndex: 'planQuantity',
                  width: 90,
                },
                {
                  title: '拣货数量',
                  dataIndex: 'actualQuantity',
                  width: 90,
                },
                {
                  title: '复核数量',
                  dataIndex: 'checkQuantity',
                  width: 130,
                  render: (_: unknown, record: ReviewItem, index: number) => (
                    <InputNumber
                      min={0}
                      value={record.checkQuantity}
                      onChange={(value) =>
                        handleReviewItemChange(index, 'checkQuantity', value as number)
                      }
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: '原批次',
                  dataIndex: 'batchNo',
                  width: 100,
                  render: (code: string) => code || '-',
                },
                {
                  title: '复核批次',
                  dataIndex: 'checkBatchNo',
                  width: 130,
                  render: (_: unknown, record: ReviewItem, index: number) => (
                    <Input
                      placeholder="扫描或输入批次"
                      value={record.checkBatchNo}
                      onChange={(value) =>
                        handleReviewItemChange(index, 'checkBatchNo', value)
                      }
                    />
                  ),
                },
                {
                  title: '核对通过',
                  dataIndex: 'checkPass',
                  width: 90,
                  render: (_: unknown, record: ReviewItem, index: number) => (
                    <Checkbox
                      checked={record.checkPass}
                      onChange={(checked) =>
                        handleReviewItemChange(index, 'checkPass', checked)
                      }
                    />
                  ),
                },
                {
                  title: '备注',
                  dataIndex: 'checkRemark',
                  width: 140,
                  render: (_: unknown, record: ReviewItem, index: number) => (
                    <Input
                      placeholder="差异说明"
                      value={record.checkRemark}
                      onChange={(value) =>
                        handleReviewItemChange(index, 'checkRemark', value)
                      }
                    />
                  ),
                },
              ]}
              data={reviewItems}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />

            <Divider />

            <FormItem label="复核备注" field="reviewRemark" style={{ marginBottom: '16px' }}>
              <TextArea
                placeholder="请输入复核备注信息（可选）"
                value={reviewRemark}
                onChange={setReviewRemark}
                style={{ minHeight: '60px' }}
              />
            </FormItem>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={() => setReviewVisible(false)}>
                取消
              </Button>
              <Button
                status="danger"
                icon={<IconClose />}
                onClick={() => handleReviewSubmit('fail')}
              >
                复核不通过，退回重拣
              </Button>
              <Button
                type="primary"
                status="success"
                icon={<IconCheck />}
                onClick={() => handleReviewSubmit('pass')}
              >
                复核通过，完成出库
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
