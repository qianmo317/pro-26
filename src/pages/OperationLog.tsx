import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Space,
  Tag,
  Descriptions,
  Card,
  Grid,
} from '@arco-design/web-react';
import { IconEye, IconRefresh, IconFilter } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import type { OperationLog, OperationLogFilter, OperationLogFieldChange, OperationLogType } from '../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Row, Col } = Grid;
const FormItem = Form.Item;
const { Option } = Select;

const operationTypeColors: Record<string, string> = {
  login: 'green',
  logout: 'gray',
  inbound_create: 'blue',
  inbound_status_change: 'cyan',
  outbound_create: 'orange',
  outbound_status_change: 'red',
  inventory_adjust: 'purple',
  stocktake_result_edit: 'pink',
  transfer_create: 'arcoblue',
  transfer_status_change: 'gold',
  stocktake_create: 'lime',
  stocktake_status_change: 'magenta',
};

const targetTypeLabels: Record<string, string> = {
  user: '用户',
  inbound: '入库单',
  outbound: '出库单',
  stocktake: '盘点计划',
  stocktake_item: '盘点明细',
  inventory: '库存',
  transfer: '调拨单',
};

export default function OperationLogPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);
  const [form] = Form.useForm<OperationLogFilter>();
  const user = useAuthStore((state) => state.user);
  const { getOperationLogs, getOperationTypes, getOperators } = useWarehouseStore();

  const [filters, setFilters] = useState<OperationLogFilter>({});

  const operationTypes = useMemo(() => getOperationTypes(), [getOperationTypes]);
  const operators = useMemo(() => getOperators(), [getOperators]);

  const logs = useMemo(() => {
    return getOperationLogs(filters, user);
  }, [filters, user, getOperationLogs]);

  const handleSearch = (values: { timeRange?: [Date, Date]; operatorId?: string; operationType?: string }) => {
    const newFilters: OperationLogFilter = {};
    
    if (values.timeRange && values.timeRange.length === 2) {
      newFilters.startTime = dayjs(values.timeRange[0]).format('YYYY-MM-DD');
      newFilters.endTime = dayjs(values.timeRange[1]).format('YYYY-MM-DD');
    }
    if (values.operatorId) {
      newFilters.operatorId = values.operatorId;
    }
    if (values.operationType) {
      newFilters.operationType = values.operationType as OperationLogType;
    }
    
    setFilters(newFilters);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
  };

  const handleViewDetail = (log: OperationLog) => {
    setSelectedLog(log);
    setDetailVisible(true);
  };

  const formatValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    return String(value);
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 120,
      render: (text: string, record: OperationLog) => (
        <Space direction="vertical" size={2}>
          <span>{text}</span>
          <Tag size="small" color="gray">
            {record.operatorRole}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'operationTypeName',
      width: 140,
      render: (_text: string, record: OperationLog) => (
        <Tag color={operationTypeColors[record.operationType] || 'blue'}>
          {record.operationTypeName}
        </Tag>
      ),
    },
    {
      title: '操作对象',
      dataIndex: 'targetName',
      width: 180,
      render: (text: string, record: OperationLog) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {targetTypeLabels[record.targetType] || record.targetType}
          </span>
        </Space>
      ),
    },
    {
      title: '变更摘要',
      dataIndex: 'fieldChanges',
      render: (changes: OperationLogFieldChange[]) => {
        if (!changes || changes.length === 0) {
          return <span style={{ color: '#999' }}>无字段变更</span>;
        }
        return (
          <Space wrap size={4}>
            {changes.slice(0, 3).map((change, idx) => (
              <Tag key={idx} size="small">
                {change.fieldName}: {formatValue(change.oldValue)} → {formatValue(change.newValue)}
              </Tag>
            ))}
            {changes.length > 3 && (
              <Tag size="small" color="gray">
                +{changes.length - 3} 项变更
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', color: '#666' }}>{text || '-'}</span>
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: OperationLog) => (
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onSubmit={handleSearch}
          style={{ width: '100%' }}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={8}>
              <FormItem label="操作时间" field="timeRange">
                <RangePicker
                  style={{ width: '100%' }}
                  allowClear
                  format="YYYY-MM-DD"
                />
              </FormItem>
            </Col>
            <Col span={5}>
              <FormItem label="操作人" field="operatorId">
                <Select
                  placeholder="请选择操作人"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {operators.map((op) => (
                    <Option key={op.value} value={op.value}>
                      {op.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={5}>
              <FormItem label="操作类型" field="operationType">
                <Select
                  placeholder="请选择操作类型"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {operationTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={operationTypeColors[type.value]} size="small">
                        {type.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<IconFilter />}>
                    筛选
                  </Button>
                  <Button onClick={handleReset} icon={<IconRefresh />}>
                    重置
                  </Button>
                </Space>
              </FormItem>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#666' }}>
              共 <strong style={{ color: '#ff7d00' }}>{logs.length}</strong> 条记录
            </span>
            {user && user.role !== 'admin' && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                仅显示您的操作记录
              </Tag>
            )}
          </div>
        </div>
        <Table
          columns={columns}
          data={logs}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showTotal: true,
            pageSizeChangeResetCurrent: true,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      <Modal
        title="操作日志详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        style={{ width: 700 }}
      >
        {selectedLog && (
          <div>
            <Descriptions
              column={2}
              title="基本信息"
              data={[
                {
                  label: '操作时间',
                  value: (
                    <span style={{ fontFamily: 'monospace' }}>
                      {selectedLog.operateTime}
                    </span>
                  ),
                },
                {
                  label: '操作人',
                  value: (
                    <Space>
                      <span>{selectedLog.operatorName}</span>
                      <Tag size="small">{selectedLog.operatorRole}</Tag>
                    </Space>
                  ),
                },
                {
                  label: '操作类型',
                  value: (
                    <Tag color={operationTypeColors[selectedLog.operationType]}>
                      {selectedLog.operationTypeName}
                    </Tag>
                  ),
                },
                {
                  label: '操作对象',
                  value: (
                    <Space direction="vertical" size={2}>
                      <span style={{ fontWeight: 500 }}>{selectedLog.targetName}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {targetTypeLabels[selectedLog.targetType] || selectedLog.targetType}
                      </span>
                    </Space>
                  ),
                },
                {
                  label: 'IP地址',
                  value: (
                    <span style={{ fontFamily: 'monospace' }}>
                      {selectedLog.ipAddress || '-'}
                    </span>
                  ),
                },
                {
                  label: '浏览器',
                  value: <span style={{ fontSize: '12px' }}>{selectedLog.userAgent || '-'}</span>,
                },
              ]}
              style={{ marginBottom: 16 }}
            />

            {selectedLog.remark && (
              <Card
                size="small"
                title="操作备注"
                style={{ marginBottom: 16 }}
                bodyStyle={{ background: '#f7f8fa' }}
              >
                {selectedLog.remark}
              </Card>
            )}

            {selectedLog.fieldChanges && selectedLog.fieldChanges.length > 0 && (
              <Card size="small" title="字段变更详情">
                <Table
                  columns={[
                    {
                      title: '字段名',
                      dataIndex: 'fieldName',
                      width: 150,
                      render: (text: string) => (
                        <span style={{ fontWeight: 500 }}>{text}</span>
                      ),
                    },
                    {
                      title: '变更前',
                      dataIndex: 'oldValue',
                      width: 180,
                      render: (value: string | number | boolean | null | undefined) => (
                        <span style={{ 
                          color: '#cb2634', 
                          fontFamily: 'monospace',
                          background: '#fff1f0',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          {formatValue(value)}
                        </span>
                      ),
                    },
                    {
                      title: '变更后',
                      dataIndex: 'newValue',
                      width: 180,
                      render: (value: string | number | boolean | null | undefined) => (
                        <span style={{ 
                          color: '#00b42a', 
                          fontFamily: 'monospace',
                          background: '#f0ffec',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          {formatValue(value)}
                        </span>
                      ),
                    },
                  ]}
                  data={selectedLog.fieldChanges}
                  rowKey="field"
                  pagination={false}
                  size="small"
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
