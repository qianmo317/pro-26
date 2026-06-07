import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Tabs,
  InputNumber,
  Grid,
  Card,
  Alert,
  Checkbox,
  Popconfirm,
  Descriptions,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEye,
  IconSchedule,
  IconRight,
  IconCheck,
  IconClose,
  IconEdit,
} from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/Toast';
import type { StocktakePlan, StockDifferenceItem, StockAdjustmentOrder } from '../types';

const Row = Grid.Row;
const Col = Grid.Col;

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

export default function Stocktake() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [adjustmentVisible, setAdjustmentVisible] = useState(false);
  const [largeDiffConfirmVisible, setLargeDiffConfirmVisible] = useState(false);
  const [adjustmentOrderDetailVisible, setAdjustmentOrderDetailVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StocktakePlan | null>(null);
  const [selectedDifferenceItems, setSelectedDifferenceItems] = useState<string[]>([]);
  const [selectedAdjustmentOrder, setSelectedAdjustmentOrder] = useState<StockAdjustmentOrder | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [adjustmentForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    stocktakePlans,
    addStocktakePlan,
    updateStocktakeItem,
    completeStocktake,
    cycleCountConfigs,
    stockDifferenceItems,
    stockAdjustmentOrders,
    largeDiffThreshold,
    getDifferenceItemsByPlan,
    confirmDifferenceItem,
    ignoreDifferenceItem,
    createStockAdjustmentOrder,
    confirmStockAdjustmentOrder,
    completeStockAdjustmentOrder,
    cancelStockAdjustmentOrder,
    getStockAdjustmentOrdersByPlan,
  } = useWarehouseStore();

  const planDifferenceItems = useMemo(() => {
    if (!selectedPlan) return [];
    return getDifferenceItemsByPlan(selectedPlan.id);
  }, [selectedPlan, stockDifferenceItems, getDifferenceItemsByPlan]);

  const planAdjustmentOrders = useMemo(() => {
    if (!selectedPlan) return [];
    return getStockAdjustmentOrdersByPlan(selectedPlan.id);
  }, [selectedPlan, stockAdjustmentOrders, getStockAdjustmentOrdersByPlan]);

  const hasLargeDiffInSelected = useMemo(() => {
    return planDifferenceItems.some(
      (item) => selectedDifferenceItems.includes(item.id) && item.isLargeDiff
    );
  }, [planDifferenceItems, selectedDifferenceItems]);

  const largeDiffItemsInSelected = useMemo(() => {
    return planDifferenceItems.filter(
      (item) => selectedDifferenceItems.includes(item.id) && item.isLargeDiff
    );
  }, [planDifferenceItems, selectedDifferenceItems]);

  const columns = [
    {
      title: '盘点单号',
      dataIndex: 'planNo',
      width: 160,
    },
    {
      title: '盘点名称',
      dataIndex: 'name',
    },
    {
      title: '盘点类型',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          full: '全盘',
          partial: '部分盘点',
          cycle: '循环盘点',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待开始' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '盘点项数',
      dataIndex: 'items',
      width: 100,
      render: (items: any[]) => items.length + ' 项',
    },
    {
      title: '差异项数',
      width: 100,
      render: (_: any, record: StocktakePlan) => {
        const diffItems = getDifferenceItemsByPlan(record.id);
        if (diffItems.length === 0) return <span style={{ color: '#999' }}>-</span>;
        const pendingCount = diffItems.filter((d) => d.status === 'pending').length;
        return (
          <Space>
            <Tag color="red">{diffItems.length} 项</Tag>
            {pendingCount > 0 && <Tag color="orange">待处理 {pendingCount}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      width: 220,
      render: (_: any, record: StocktakePlan) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              setSelectedPlan(record);
              setSelectedDifferenceItems([]);
              setDetailVisible(true);
            }}
          >
            查看
          </Button>
          {record.status === 'in_progress' && (
            <Button
              type="text"
              size="small"
              status="success"
              onClick={() => handleComplete(record.id)}
            >
              完成盘点
            </Button>
          )}
          {record.status === 'completed' && getDifferenceItemsByPlan(record.id).some((d) => d.status === 'pending') && (
            <Button
              type="text"
              size="small"
              status="warning"
              onClick={() => {
                setSelectedPlan(record);
                setSelectedDifferenceItems([]);
                setDetailVisible(true);
                setTimeout(() => setActiveTab('differences'), 100);
              }}
            >
              处理差异
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleComplete = (id: string) => {
    completeStocktake(id);
    toast.success('盘点已完成，系统已自动生成差异调整清单');
  };

  const handleQuantityChange = (planId: string, itemId: string, value: number) => {
    updateStocktakeItem(planId, itemId, value);
  };

  const handleSubmit = (values: any) => {
    const newPlan = addStocktakePlan({
      name: values.name,
      type: values.type,
      zones: values.zone,
      startTime: values.startTime ? values.startTime.toLocaleString() : undefined,
      remark: values.remark,
    });

    if (newPlan) {
      toast.success('盘点计划创建成功');
      setModalVisible(false);
      createForm.resetFields();
    } else {
      toast.error('盘点计划创建失败，所选区域无库存数据');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingItems = planDifferenceItems.filter(
        (item) => item.status === 'pending' || item.status === 'confirmed'
      );
      setSelectedDifferenceItems(pendingItems.map((item) => item.id));
    } else {
      setSelectedDifferenceItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDifferenceItems([...selectedDifferenceItems, id]);
    } else {
      setSelectedDifferenceItems(selectedDifferenceItems.filter((item) => item !== id));
    }
  };

  const handleCreateAdjustmentOrder = () => {
    if (selectedDifferenceItems.length === 0) {
      toast.warning('请至少选择一项差异');
      return;
    }

    if (hasLargeDiffInSelected) {
      setLargeDiffConfirmVisible(true);
    } else {
      doCreateAdjustmentOrder();
    }
  };

  const doCreateAdjustmentOrder = () => {
    if (!selectedPlan) return;

    const values = adjustmentForm.getFieldsValue();
    const order = createStockAdjustmentOrder(
      selectedPlan.id,
      selectedDifferenceItems,
      user?.name || '系统管理员',
      values.remark
    );

    if (order) {
      if (order.status === 'pending_confirm') {
        toast.success(`调整单已创建，包含 ${order.largeDiffCount} 项大差异，需经理确认`);
      } else {
        toast.success('调整单已创建');
      }
      setSelectedDifferenceItems([]);
      adjustmentForm.resetFields();
    }
  };

  const handleConfirmLargeDiff = () => {
    setLargeDiffConfirmVisible(false);
    doCreateAdjustmentOrder();
  };

  const handleConfirmAdjustmentOrder = (orderId: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast.error('只有管理员或经理可以确认调整单');
      return;
    }

    confirmStockAdjustmentOrder(orderId, user.name);
    toast.success('调整单已确认');
    setAdjustmentOrderDetailVisible(false);
  };

  const handleCompleteAdjustmentOrder = (orderId: string) => {
    completeStockAdjustmentOrder(orderId, user?.name || '系统管理员');
    toast.success('调整已完成，库存已更新');
    setAdjustmentOrderDetailVisible(false);
  };

  const handleCancelAdjustmentOrder = (orderId: string) => {
    Modal.confirm({
      title: '确认取消',
      content: '取消后，关联的差异项将恢复为待处理状态',
      onOk: () => {
        cancelStockAdjustmentOrder(orderId, user?.name || '系统管理员');
        toast.success('调整单已取消');
        setAdjustmentOrderDetailVisible(false);
      },
    });
  };

  const handleConfirmSingleDifference = (item: StockDifferenceItem) => {
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      toast.error('只有管理员或经理可以确认大差异');
      return;
    }
    confirmDifferenceItem(item.id, user.name);
    toast.success('差异已确认');
  };

  const handleIgnoreDifference = (item: StockDifferenceItem) => {
    Modal.confirm({
      title: '确认忽略',
      content: '忽略后该差异将不会生成调整单',
      onOk: () => {
        ignoreDifferenceItem(item.id, user?.name || '系统管理员');
        toast.success('差异已忽略');
      },
    });
  };

  const detailColumns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 150,
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 100,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 120,
    },
    {
      title: '系统数量',
      dataIndex: 'systemQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      width: 120,
      render: (_: any, record: any) => {
        if (selectedPlan?.status === 'in_progress') {
          return (
            <InputNumber
              style={{ width: '100%' }}
              value={record.actualQuantity}
              onChange={(v) => handleQuantityChange(selectedPlan.id, record.id, v as number)}
            />
          );
        }
        return record.actualQuantity;
      },
    },
    {
      title: '差异',
      dataIndex: 'diffQuantity',
      width: 100,
      render: (diff: number) => {
        if (diff > 0) {
          return <span style={{ color: '#27ae60' }}>+{diff}</span>;
        } else if (diff < 0) {
          return <span style={{ color: '#e74c3c' }}>{diff}</span>;
        }
        return <span style={{ color: '#999' }}>0</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待盘点' },
          counted: { color: 'blue', text: '已盘点' },
          adjusted: { color: 'green', text: '已调整' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color} size="small">{s.text}</Tag>;
      },
    },
  ];

  const differenceColumns = [
    {
      title: '选择',
      width: 50,
      render: (_: any, record: StockDifferenceItem) => {
        const disabled = record.status !== 'pending' && record.status !== 'confirmed';
        return (
          <Checkbox
            disabled={disabled}
            checked={selectedDifferenceItems.includes(record.id)}
            onChange={(checked) => handleSelectItem(record.id, checked)}
          />
        );
      },
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 150,
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 100,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 120,
    },
    {
      title: '系统数量',
      dataIndex: 'systemQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      width: 100,
    },
    {
      title: '差异数量',
      dataIndex: 'diffQuantity',
      width: 100,
      render: (diff: number) => {
        if (diff > 0) {
          return <span style={{ color: '#27ae60' }}>+{diff}</span>;
        } else if (diff < 0) {
          return <span style={{ color: '#e74c3c' }}>{diff}</span>;
        }
        return <span style={{ color: '#999' }}>0</span>;
      },
    },
    {
      title: '差异率',
      dataIndex: 'diffRatio',
      width: 100,
      render: (ratio: number, record: StockDifferenceItem) => (
        <Space>
          <span>{ratio.toFixed(2)}%</span>
          {record.isLargeDiff && (
            <Tag color="red" size="small">大差异</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待处理' },
          confirmed: { color: 'blue', text: '已确认' },
          adjusted: { color: 'green', text: '已调整' },
          ignored: { color: 'gray', text: '已忽略' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color} size="small">{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: StockDifferenceItem) => (
        <Space>
          {record.isLargeDiff && record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              status="warning"
              icon={<IconCheck />}
              onClick={() => handleConfirmSingleDifference(record)}
            >
              确认差异
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="text"
              size="small"
              status="default"
              icon={<IconClose />}
              onClick={() => handleIgnoreDifference(record)}
            >
              忽略
            </Button>
          )}
          {record.adjustmentOrderId && (
            <Button
              type="text"
              size="small"
              icon={<IconEye />}
              onClick={() => {
                const order = stockAdjustmentOrders.find((o) => o.id === record.adjustmentOrderId);
                if (order) {
                  setSelectedAdjustmentOrder(order);
                  setAdjustmentOrderDetailVisible(true);
                }
              }}
            >
              查看调整单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const adjustmentOrderColumns = [
    {
      title: '调整单号',
      dataIndex: 'orderNo',
      width: 160,
    },
    {
      title: '关联盘点单',
      dataIndex: 'stocktakePlanNo',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'gray', text: '草稿' },
          pending_confirm: { color: 'orange', text: '待确认' },
          confirmed: { color: 'blue', text: '已确认' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '调整项数',
      dataIndex: 'totalAdjustCount',
      width: 100,
    },
    {
      title: '大差异数',
      dataIndex: 'largeDiffCount',
      width: 100,
      render: (count: number) => count > 0 ? <Tag color="red">{count} 项</Tag> : '-',
    },
    {
      title: '创建人',
      dataIndex: 'operator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: StockAdjustmentOrder) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              setSelectedAdjustmentOrder(record);
              setAdjustmentOrderDetailVisible(true);
            }}
          >
            查看
          </Button>
          {record.status === 'pending_confirm' && (user?.role === 'admin' || user?.role === 'manager') && (
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconCheck />}
              onClick={() => handleConfirmAdjustmentOrder(record.id)}
            >
              确认
            </Button>
          )}
          {(record.status === 'draft' || record.status === 'confirmed') && (
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconEdit />}
              onClick={() => handleCompleteAdjustmentOrder(record.id)}
            >
              执行调整
            </Button>
          )}
          {(record.status === 'draft' || record.status === 'pending_confirm') && (
            <Popconfirm
              title="确认取消该调整单？"
              onOk={() => handleCancelAdjustmentOrder(record.id)}
            >
              <Button type="text" size="small" status="danger">
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const enabledConfigs = cycleCountConfigs.filter((c) => c.enabled);

  return (
    <div>
      {enabledConfigs.length > 0 && (
        <Alert
          type="info"
          style={{ marginBottom: '16px' }}
          content={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Space>
                  <IconSchedule style={{ color: '#165dff' }} />
                  <span>
                    已配置 <strong>{enabledConfigs.length}</strong> 个周期盘点规则，系统将按周期自动生成盘点计划
                  </span>
                </Space>
              </div>
              <Button
                type="text"
                size="small"
                onClick={() => navigate('/cycle-count')}
              >
                查看配置 <IconRight />
              </Button>
            </div>
          }
        />
      )}

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>
            创建盘点计划
          </Button>
          <Button
            icon={<IconSchedule />}
            onClick={() => navigate('/cycle-count')}
          >
            周期盘点配置
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveTab="all">
        <TabPane key="all" title="全部">
          <Table columns={columns} data={stocktakePlans} rowKey="id" />
        </TabPane>
        <TabPane key="pending" title="待开始">
          <Table
            columns={columns}
            data={stocktakePlans.filter((p) => p.status === 'pending')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="in_progress" title="进行中">
          <Table
            columns={columns}
            data={stocktakePlans.filter((p) => p.status === 'in_progress')}
            rowKey="id"
          />
        </TabPane>
        <TabPane key="completed" title="已完成">
          <Table
            columns={columns}
            data={stocktakePlans.filter((p) => p.status === 'completed')}
            rowKey="id"
          />
        </TabPane>
      </Tabs>

      <Modal
        title="创建盘点计划"
        visible={modalVisible}
        onOk={() => createForm.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={createForm} layout="vertical" onSubmit={handleSubmit}>
          <FormItem label="盘点名称" field="name" rules={[{ required: true }]}>
            <Input placeholder="请输入盘点计划名称" />
          </FormItem>
          <FormItem label="盘点类型" field="type" rules={[{ required: true }]}>
            <Select placeholder="请选择盘点类型">
              <Option value="full">全盘</Option>
              <Option value="partial">部分盘点</Option>
              <Option value="cycle">循环盘点</Option>
            </Select>
          </FormItem>
          <FormItem label="盘点区域" field="zone">
            <Select placeholder="请选择盘点区域" mode="multiple">
              {['A区', 'B区', 'C区', 'D区'].map((zone) => (
                <Option key={zone} value={zone}>
                  {zone}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem label="计划开始时间" field="startTime">
            <DatePicker showTime style={{ width: '100%' }} />
          </FormItem>
          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入备注信息" />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title="盘点详情"
        visible={detailVisible}
        onOk={() => {
          setDetailVisible(false);
          setActiveTab('all');
        }}
        onCancel={() => {
          setDetailVisible(false);
          setActiveTab('all');
        }}
        style={{ width: 1200 }}
        footer={null}
      >
        {selectedPlan && (
          <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card size="small">
                  <div style={{ fontSize: '12px', color: '#666' }}>盘点单号</div>
                  <div style={{ fontWeight: '600' }}>{selectedPlan.planNo}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ fontSize: '12px', color: '#666' }}>盘点名称</div>
                  <div style={{ fontWeight: '600' }}>{selectedPlan.name}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ fontSize: '12px', color: '#666' }}>状态</div>
                  <div>
                    <Tag
                      color={
                        selectedPlan.status === 'completed'
                          ? 'green'
                          : selectedPlan.status === 'in_progress'
                          ? 'blue'
                          : 'orange'
                      }
                    >
                      {selectedPlan.status === 'completed'
                        ? '已完成'
                        : selectedPlan.status === 'in_progress'
                        ? '进行中'
                        : '待开始'}
                    </Tag>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ fontSize: '12px', color: '#666' }}>完成进度</div>
                  <div style={{ fontWeight: '600' }}>
                    {selectedPlan.items.filter((i) => i.status === 'counted').length} /{' '}
                    {selectedPlan.items.length}
                  </div>
                </Card>
              </Col>
            </Row>

            <Tabs activeTab={activeTab} onChange={setActiveTab}>
              <TabPane key="all" title="盘点明细">
                <Table
                  columns={detailColumns}
                  data={selectedPlan.items}
                  pagination={false}
                  size="small"
                  scroll={{ y: 400 }}
                />
              </TabPane>

              {selectedPlan.status === 'completed' && (
                <TabPane
                  key="differences"
                  title={
                    <Space>
                      差异调整清单
                      {planDifferenceItems.filter((d) => d.status === 'pending').length > 0 && (
                        <Tag color="red">
                          {planDifferenceItems.filter((d) => d.status === 'pending').length} 待处理
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  {planDifferenceItems.length > 0 ? (
                    <div>
                      <Alert
                        type="info"
                        style={{ marginBottom: '16px' }}
                        content={
                          <div>
                            <Space>
                              <span>大差异判定标准：差异率 ≥ {largeDiffThreshold}% 或差异绝对值 ≥ 50</span>
                              <Tag color="red">
                                大差异项需经理/管理员确认后方可调整
                              </Tag>
                            </Space>
                          </div>
                        }
                      />

                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Checkbox
                            checked={
                              selectedDifferenceItems.length > 0 &&
                              selectedDifferenceItems.length === planDifferenceItems.filter(
                                (item) => item.status === 'pending' || item.status === 'confirmed'
                              ).length
                            }
                            indeterminate={
                              selectedDifferenceItems.length > 0 &&
                              selectedDifferenceItems.length < planDifferenceItems.filter(
                                (item) => item.status === 'pending' || item.status === 'confirmed'
                              ).length
                            }
                            onChange={handleSelectAll}
                          >
                            全选待处理项
                          </Checkbox>
                          <span style={{ color: '#666' }}>
                            已选择 {selectedDifferenceItems.length} 项
                          </span>
                          {hasLargeDiffInSelected && (
                            <Tag color="red">
                              包含 {largeDiffItemsInSelected.length} 项大差异
                            </Tag>
                          )}
                        </Space>
                        <Space>
                          <Button
                            type="primary"
                            icon={<IconEdit />}
                            onClick={() => setAdjustmentVisible(true)}
                            disabled={selectedDifferenceItems.length === 0}
                          >
                            生成库存调整单
                          </Button>
                        </Space>
                      </div>

                      <Table
                        columns={differenceColumns}
                        data={planDifferenceItems}
                        pagination={false}
                        size="small"
                        scroll={{ y: 350 }}
                        rowKey="id"
                      />
                    </div>
                  ) : (
                    <Alert
                      type="success"
                      content="本次盘点无差异，所有商品账实相符"
                      style={{ marginTop: '20px' }}
                    />
                  )}
                </TabPane>
              )}

              {selectedPlan.status === 'completed' && planAdjustmentOrders.length > 0 && (
                <TabPane key="adjustments" title="库存调整单">
                  <Table
                    columns={adjustmentOrderColumns}
                    data={planAdjustmentOrders}
                    pagination={false}
                    size="small"
                    rowKey="id"
                  />
                </TabPane>
              )}
            </Tabs>
          </div>
        )}
      </Modal>

      <Modal
        title="生成库存调整单"
        visible={adjustmentVisible}
        onOk={() => {
          adjustmentForm.validate().then(() => {
            setAdjustmentVisible(false);
            handleCreateAdjustmentOrder();
          });
        }}
        onCancel={() => setAdjustmentVisible(false)}
        style={{ width: 500 }}
      >
        <Form form={adjustmentForm} layout="vertical">
          <Alert
            type="info"
            style={{ marginBottom: '16px' }}
            content={
              <div>
                <div>将为 <strong>{selectedDifferenceItems.length}</strong> 项差异生成调整单</div>
                {hasLargeDiffInSelected && (
                  <div style={{ color: '#f53f3f', marginTop: '8px' }}>
                    包含 <strong>{largeDiffItemsInSelected.length}</strong> 项大差异，需经理/管理员确认后方可执行调整
                  </div>
                )}
              </div>
            }
          />
          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入调整备注（选填）" rows={3} />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title="大差异确认"
        visible={largeDiffConfirmVisible}
        onOk={handleConfirmLargeDiff}
        onCancel={() => setLargeDiffConfirmVisible(false)}
        style={{ width: 700 }}
        okText="确认生成"
        okButtonProps={{ status: 'danger' }}
      >
        <Alert
          type="warning"
          style={{ marginBottom: '16px' }}
          content={
            <div>
              <strong>请仔细核对以下大差异项，确认无误后再生成调整单。</strong>
              <div style={{ marginTop: '8px' }}>
                大差异判定标准：差异率 ≥ {largeDiffThreshold}% 或差异绝对值 ≥ 50
              </div>
            </div>
          }
        />
        <Table
          columns={[
            {
              title: '商品名称',
              dataIndex: 'productName',
            },
            {
              title: 'SKU',
              dataIndex: 'productSku',
            },
            {
              title: '库位',
              dataIndex: 'locationCode',
              render: (code: string) => <Tag color="blue">{code}</Tag>,
            },
            {
              title: '系统数量',
              dataIndex: 'systemQuantity',
            },
            {
              title: '实际数量',
              dataIndex: 'actualQuantity',
            },
            {
              title: '差异数量',
              dataIndex: 'diffQuantity',
              render: (diff: number) => {
                if (diff > 0) {
                  return <span style={{ color: '#27ae60' }}>+{diff}</span>;
                } else if (diff < 0) {
                  return <span style={{ color: '#e74c3c' }}>{diff}</span>;
                }
                return '0';
              },
            },
            {
              title: '差异率',
              dataIndex: 'diffRatio',
              render: (ratio: number) => <span style={{ color: '#f53f3f' }}>{ratio.toFixed(2)}%</span>,
            },
          ]}
          data={largeDiffItemsInSelected}
          pagination={false}
          size="small"
        />
      </Modal>

      <Modal
        title="调整单详情"
        visible={adjustmentOrderDetailVisible}
        onOk={() => setAdjustmentOrderDetailVisible(false)}
        onCancel={() => setAdjustmentOrderDetailVisible(false)}
        style={{ width: 900 }}
        footer={null}
      >
        {selectedAdjustmentOrder && (
          <div>
            <Descriptions
              column={2}
              data={[
                { label: '调整单号', value: selectedAdjustmentOrder.orderNo },
                { label: '关联盘点单', value: selectedAdjustmentOrder.stocktakePlanNo },
                {
                  label: '状态',
                  value: (
                    <Tag
                      color={
                        selectedAdjustmentOrder.status === 'completed'
                          ? 'green'
                          : selectedAdjustmentOrder.status === 'confirmed'
                          ? 'blue'
                          : selectedAdjustmentOrder.status === 'pending_confirm'
                          ? 'orange'
                          : selectedAdjustmentOrder.status === 'cancelled'
                          ? 'red'
                          : 'gray'
                      }
                    >
                      {selectedAdjustmentOrder.status === 'completed'
                        ? '已完成'
                        : selectedAdjustmentOrder.status === 'confirmed'
                        ? '已确认'
                        : selectedAdjustmentOrder.status === 'pending_confirm'
                        ? '待确认'
                        : selectedAdjustmentOrder.status === 'cancelled'
                        ? '已取消'
                        : '草稿'}
                    </Tag>
                  ),
                },
                { label: '调整项数', value: selectedAdjustmentOrder.totalAdjustCount + ' 项' },
                { label: '大差异数', value: selectedAdjustmentOrder.largeDiffCount + ' 项' },
                { label: '创建人', value: selectedAdjustmentOrder.operator || '-' },
                { label: '创建时间', value: selectedAdjustmentOrder.createTime },
                { label: '确认人', value: selectedAdjustmentOrder.confirmer || '-' },
                { label: '确认时间', value: selectedAdjustmentOrder.confirmTime || '-' },
                { label: '完成时间', value: selectedAdjustmentOrder.completeTime || '-' },
                { label: '备注', value: selectedAdjustmentOrder.remark || '-', span: 2 },
              ]}
              style={{ marginBottom: '16px' }}
            />

            <h4 style={{ marginBottom: '12px' }}>调整明细</h4>
            <Table
              columns={[
                {
                  title: '商品名称',
                  dataIndex: 'productName',
                },
                {
                  title: 'SKU',
                  dataIndex: 'productSku',
                },
                {
                  title: '库位',
                  dataIndex: 'locationCode',
                  render: (code: string) => <Tag color="blue">{code}</Tag>,
                },
                {
                  title: '批次号',
                  dataIndex: 'batchNo',
                },
                {
                  title: '系统数量',
                  dataIndex: 'systemQuantity',
                },
                {
                  title: '实际数量',
                  dataIndex: 'actualQuantity',
                },
                {
                  title: '调整数量',
                  dataIndex: 'adjustQuantity',
                  render: (qty: number) => {
                    if (qty > 0) {
                      return <span style={{ color: '#27ae60' }}>+{qty}</span>;
                    } else if (qty < 0) {
                      return <span style={{ color: '#e74c3c' }}>{qty}</span>;
                    }
                    return '0';
                  },
                },
              ]}
              data={selectedAdjustmentOrder.items}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <Space>
                <Button onClick={() => setAdjustmentOrderDetailVisible(false)}>
                  关闭
                </Button>
                {selectedAdjustmentOrder.status === 'pending_confirm' && (user?.role === 'admin' || user?.role === 'manager') && (
                  <Button
                    type="primary"
                    status="success"
                    icon={<IconCheck />}
                    onClick={() => handleConfirmAdjustmentOrder(selectedAdjustmentOrder.id)}
                  >
                    确认调整单
                  </Button>
                )}
                {(selectedAdjustmentOrder.status === 'draft' || selectedAdjustmentOrder.status === 'confirmed') && (
                  <Button
                    type="primary"
                    status="success"
                    icon={<IconEdit />}
                    onClick={() => handleCompleteAdjustmentOrder(selectedAdjustmentOrder.id)}
                  >
                    执行调整
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
