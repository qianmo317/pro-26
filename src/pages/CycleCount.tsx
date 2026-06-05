import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Card,
  Descriptions,
  Badge,
  Alert,
  Grid,
  Tooltip,
  Empty,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconPause,
  IconRefresh,
  IconEye,
  IconList,
  IconCheck,
} from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { CycleCountConfig, CycleCountRecommendation, CycleCountPeriod } from '../types';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const { Option } = Select;
const { TextArea } = Input;

export default function CycleCount() {
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendVisible, setRecommendVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CycleCountConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<CycleCountConfig | null>(null);
  const [recommendation, setRecommendation] = useState<CycleCountRecommendation | null>(null);
  const [form] = Form.useForm();
  const [scope, setScope] = useState<'zone' | 'category' | 'abc'>('zone');

  const {
    cycleCountConfigs,
    products,
    locations,
    addCycleCountConfig,
    updateCycleCountConfig,
    deleteCycleCountConfig,
    toggleCycleCountConfig,
    getCycleCountRecommendation,
    generateStocktakePlanFromConfig,
    checkAndGenerateAutoPlans,
  } = useWarehouseStore();

  useEffect(() => {
    const timer = setInterval(() => {
      const generatedPlans = checkAndGenerateAutoPlans();
      if (generatedPlans.length > 0) {
        toast.success(`系统自动生成了 ${generatedPlans.length} 个周期盘点计划`);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [checkAndGenerateAutoPlans]);

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const zones = Array.from(new Set(locations.map((l) => l.zone)));

  const periodMap: Record<string, { text: string; color: string }> = {
    weekly: { text: '每周', color: 'green' },
    monthly: { text: '每月', color: 'blue' },
    quarterly: { text: '每季度', color: 'orange' },
    yearly: { text: '每年', color: 'purple' },
  };

  const scopeMap: Record<string, string> = {
    zone: '按区域',
    category: '按商品类别',
    abc: '按ABC分类',
  };

  const columns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      width: 200,
      render: (text: string, record: CycleCountConfig) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.autoGenerate && <Tag color="gold">自动生成</Tag>}
        </Space>
      ),
    },
    {
      title: '盘点周期',
      dataIndex: 'period',
      width: 100,
      render: (period: string) => {
        const p = periodMap[period];
        return <Tag color={p?.color}>{p?.text}</Tag>;
      },
    },
    {
      title: '盘点范围',
      dataIndex: 'scope',
      width: 120,
      render: (scopeVal: string, record: CycleCountConfig) => {
        let values: string[] = [];
        if (scopeVal === 'zone') values = record.zoneValues || [];
        else if (scopeVal === 'category') values = record.categoryValues || [];
        else if (scopeVal === 'abc') values = record.abcValues || [];
        return (
          <div>
            <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>
              {scopeMap[scopeVal]}
            </div>
            <Space wrap>
              {values.slice(0, 3).map((v) => (
                <Tag key={v} size="small">
                  {v}
                </Tag>
              ))}
              {values.length > 3 && <Tag size="small">+{values.length - 3}</Tag>}
            </Space>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '已启用' : '已停用'} />
      ),
    },
    {
      title: '上次生成',
      dataIndex: 'lastGenerateTime',
      width: 180,
      render: (time?: string) => time || '-',
    },
    {
      title: '下次生成',
      dataIndex: 'nextGenerateTime',
      width: 180,
      render: (time: string | undefined, record: CycleCountConfig) => {
        if (!record.autoGenerate) return <span style={{ color: '#999' }}>未开启</span>;
        if (!time) return '-';
        const nextDate = new Date(time);
        const now = new Date();
        const diffHours = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return (
          <div>
            <div>{time}</div>
            {diffHours < 24 && diffHours > 0 && (
              <Tag color="orange" size="small">
                {Math.round(diffHours)}小时后
              </Tag>
            )}
            {diffHours <= 0 && <Tag color="red" size="small">已过期</Tag>}
          </div>
        );
      },
    },
    {
      title: '操作',
      width: 280,
      render: (_: unknown, record: CycleCountConfig) => (
        <Space>
          <Tooltip content="查看推荐">
            <Button
              type="text"
              size="small"
              icon={<IconEye />}
              onClick={() => handleViewRecommendation(record)}
            >
              推荐
            </Button>
          </Tooltip>
          <Tooltip content="生成盘点计划">
            <Button
              type="text"
              size="small"
              status="success"
              icon={<IconList />}
              onClick={() => handleGeneratePlan(record)}
            >
              生成
            </Button>
          </Tooltip>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Tooltip content={record.enabled ? '停用' : '启用'}>
            <Button
              type="text"
              size="small"
              icon={record.enabled ? <IconPause /> : <IconCheck />}
              status={record.enabled ? 'warning' : 'success'}
              onClick={() => handleToggle(record.id)}
            >
              {record.enabled ? '停用' : '启用'}
            </Button>
          </Tooltip>
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<IconDelete />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewRecommendation = (config: CycleCountConfig) => {
    const rec = getCycleCountRecommendation(config.id);
    setRecommendation(rec);
    setSelectedConfig(config);
    setRecommendVisible(true);
  };

  const handleGeneratePlan = (config: CycleCountConfig) => {
    Modal.confirm({
      title: '确认生成',
      content: `确定要根据配置"${config.name}"生成盘点计划吗？`,
      onOk: () => {
        const plan = generateStocktakePlanFromConfig(config.id);
        if (plan) {
          toast.success(`盘点计划"${plan.name}"生成成功`);
        } else {
          toast.warning('暂无可盘点的库存项');
        }
      },
    });
  };

  const handleEdit = (config: CycleCountConfig) => {
    setEditingConfig(config);
    setScope(config.scope);
    form.setFieldsValue({
      name: config.name,
      period: config.period,
      scope: config.scope,
      zoneValues: config.zoneValues,
      categoryValues: config.categoryValues,
      abcValues: config.abcValues,
      autoGenerate: config.autoGenerate,
      remark: config.remark,
    });
    setModalVisible(true);
  };

  const handleToggle = (id: string) => {
    toggleCycleCountConfig(id);
    toast.success('状态已更新');
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该周期盘点配置吗？此操作不可撤销。',
      onOk: () => {
        deleteCycleCountConfig(id);
        toast.success('删除成功');
      },
    });
  };

  const handleSubmit = (values: {
    name: string;
    period: CycleCountPeriod;
    scope: 'zone' | 'category' | 'abc';
    zoneValues?: string[];
    categoryValues?: string[];
    abcValues?: Array<'A' | 'B' | 'C'>;
    autoGenerate: boolean;
    remark?: string;
  }) => {
    const configData = {
      name: values.name,
      period: values.period,
      scope: values.scope,
      enabled: true,
      autoGenerate: values.autoGenerate,
      zoneValues: values.scope === 'zone' ? values.zoneValues : undefined,
      categoryValues: values.scope === 'category' ? values.categoryValues : undefined,
      abcValues: values.scope === 'abc' ? values.abcValues : undefined,
      remark: values.remark,
      operator: '当前用户',
    };

    if (editingConfig) {
      updateCycleCountConfig(editingConfig.id, configData);
      toast.success('配置更新成功');
    } else {
      addCycleCountConfig(configData);
      toast.success('配置创建成功');
    }

    setModalVisible(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const handleManualCheck = () => {
    const generatedPlans = checkAndGenerateAutoPlans();
    if (generatedPlans.length > 0) {
      toast.success(`检测并生成了 ${generatedPlans.length} 个盘点计划`);
    } else {
      toast.info('暂无需要生成的盘点计划');
    }
  };

  const recommendColumns = [
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
      title: '所属区域',
      dataIndex: 'zone',
      width: 100,
    },
    {
      title: '商品类别',
      dataIndex: 'category',
      width: 120,
    },
    {
      title: 'ABC分类',
      dataIndex: 'abcClass',
      width: 100,
      render: (abc: string) => {
        const colorMap: Record<string, string> = { A: 'red', B: 'orange', C: 'green' };
        return <Tag color={colorMap[abc]}>类{abc}</Tag>;
      },
    },
    {
      title: '上次盘点',
      dataIndex: 'lastStocktakeTime',
      width: 180,
      render: (time?: string) => time || '从未盘点',
    },
    {
      title: '距上次天数',
      dataIndex: 'daysSinceLastStocktake',
      width: 120,
      render: (days: number) => {
        let color = '#333';
        if (days >= 60) color = '#e74c3c';
        else if (days >= 30) color = '#f39c12';
        return <span style={{ color, fontWeight: 500 }}>{days} 天</span>;
      },
    },
  ];

  const getDescriptionData = () => {
    if (!selectedConfig || !recommendation) return [];
    return [
      {
        label: '配置名称',
        value: selectedConfig.name,
      },
      {
        label: '盘点周期',
        value: periodMap[selectedConfig.period]?.text,
      },
      {
        label: '盘点范围',
        value: recommendation.recommendedScope,
      },
      {
        label: '推荐盘点项数',
        value: (
          <span style={{ color: '#ff7d00', fontWeight: 600 }}>
            {recommendation.recommendedItems.length} 项
          </span>
        ),
      },
      {
        label: '自动生成',
        value: selectedConfig.autoGenerate ? '已开启' : '未开启',
      },
      {
        label: '下次生成时间',
        value: selectedConfig.nextGenerateTime || '-',
      },
    ];
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => {
            setEditingConfig(null);
            setScope('zone');
            form.resetFields();
            setModalVisible(true);
          }}>
            新建周期盘点
          </Button>
          <Button icon={<IconRefresh />} onClick={handleManualCheck}>
            检测自动生成
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              配置总数
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>{cycleCountConfigs.length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              已启用
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#00b42a' }}>
              {cycleCountConfigs.filter((c) => c.enabled).length}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              自动生成
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff7d00' }}>
              {cycleCountConfigs.filter((c) => c.autoGenerate).length}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              待生成
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#f53f3f' }}>
              {cycleCountConfigs.filter((c) => {
                if (!c.enabled || !c.autoGenerate || !c.nextGenerateTime) return false;
                return new Date(c.nextGenerateTime) <= new Date();
              }).length}
            </div>
          </Card>
        </Col>
      </Row>

      <Table
        columns={columns}
        data={cycleCountConfigs}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingConfig ? '编辑周期盘点配置' : '新建周期盘点配置'}
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          setEditingConfig(null);
          form.resetFields();
        }}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <FormItem label="配置名称" field="name" rules={[{ required: true }]}>
            <Input placeholder="请输入配置名称，如：A类商品月度盘点" />
          </FormItem>

          <FormItem label="盘点周期" field="period" rules={[{ required: true }]}>
            <Select placeholder="请选择盘点周期">
              <Option value="weekly">每周</Option>
              <Option value="monthly">每月</Option>
              <Option value="quarterly">每季度</Option>
              <Option value="yearly">每年</Option>
            </Select>
          </FormItem>

          <FormItem label="盘点范围类型" field="scope" rules={[{ required: true }]}>
            <Select
              placeholder="请选择盘点范围类型"
              onChange={(v) => setScope(v as 'zone' | 'category' | 'abc')}
            >
              <Option value="zone">按区域</Option>
              <Option value="category">按商品类别</Option>
              <Option value="abc">按ABC分类</Option>
            </Select>
          </FormItem>

          {scope === 'zone' && (
            <FormItem label="盘点区域" field="zoneValues" rules={[{ required: true }]}>
              <Select placeholder="请选择盘点区域" mode="multiple">
                {zones.map((zone) => (
                  <Option key={zone} value={zone}>
                    {zone}
                  </Option>
                ))}
              </Select>
            </FormItem>
          )}

          {scope === 'category' && (
            <FormItem label="商品类别" field="categoryValues" rules={[{ required: true }]}>
              <Select placeholder="请选择商品类别" mode="multiple">
                {categories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </FormItem>
          )}

          {scope === 'abc' && (
            <FormItem label="ABC分类" field="abcValues" rules={[{ required: true }]}>
              <Select placeholder="请选择ABC分类" mode="multiple">
                <Option value="A">A类（高价值）</Option>
                <Option value="B">B类（中价值）</Option>
                <Option value="C">C类（低价值）</Option>
              </Select>
            </FormItem>
          )}

          <FormItem label="自动生成盘点计划" field="autoGenerate" initialValue={true}>
            <Switch />
          </FormItem>

          <FormItem label="备注" field="remark">
            <TextArea placeholder="请输入备注信息" rows={3} />
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <span>智能推荐盘点范围</span>
            {selectedConfig && <Tag color="blue">{selectedConfig.name}</Tag>}
          </Space>
        }
        visible={recommendVisible}
        onOk={() => setRecommendVisible(false)}
        onCancel={() => setRecommendVisible(false)}
        style={{ width: 1100 }}
        footer={() => (
          <Space>
            {selectedConfig && (
              <Button
                type="primary"
                onClick={() => {
                  handleGeneratePlan(selectedConfig);
                  setRecommendVisible(false);
                }}
              >
                立即生成盘点计划
              </Button>
            )}
            <Button onClick={() => setRecommendVisible(false)}>关闭</Button>
          </Space>
        )}
      >
        {recommendation ? (
          <div>
            <Alert type="info" content={recommendation.reason} style={{ marginBottom: '16px' }} />

            {selectedConfig && (
              <Card size="small" style={{ marginBottom: '16px' }}>
                <Descriptions column={3} data={getDescriptionData()} />
              </Card>
            )}

            {recommendation.recommendedItems.length > 0 ? (
              <Table
                columns={recommendColumns}
                data={recommendation.recommendedItems}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ y: 400 }}
              />
            ) : (
              <Empty description="暂无可推荐的盘点项" />
            )}
          </div>
        ) : (
          <Empty description="暂无推荐数据" />
        )}
      </Modal>
    </div>
  );
}
