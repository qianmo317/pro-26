import { useState } from 'react';
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
} from '@arco-design/web-react';
import { IconPlus, IconEye, IconEdit } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { StocktakePlan } from '../types';

const Row = Grid.Row;
const Col = Grid.Col;

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const { Option } = Select;
const { TextArea } = Input;

export default function Stocktake() {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StocktakePlan | null>(null);
  const [form] = Form.useForm();
  const { stocktakePlans, locations, updateStocktakeItem, completeStocktake } =
    useWarehouseStore();

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
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '操作',
      width: 180,
      render: (_: any, record: StocktakePlan) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={() => {
              setSelectedPlan(record);
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
        </Space>
      ),
    },
  ];

  const handleComplete = (id: string) => {
    completeStocktake(id);
    toast.success('盘点已完成');
  };

  const handleQuantityChange = (planId: string, itemId: string, value: number) => {
    updateStocktakeItem(planId, itemId, value);
  };

  const handleSubmit = (values: any) => {
    toast.success('盘点计划创建成功（演示模式）');
    setModalVisible(false);
    form.resetFields();
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

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>
            创建盘点计划
          </Button>
        </div>
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
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
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
        onOk={() => setDetailVisible(false)}
        onCancel={() => setDetailVisible(false)}
        style={{ width: 1000 }}
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

            <Table
              columns={detailColumns}
              data={selectedPlan.items}
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
