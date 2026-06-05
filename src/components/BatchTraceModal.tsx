import { Modal, Timeline, Table, Tag, Statistic, Grid, Card, Descriptions, Empty } from '@arco-design/web-react';
import { IconImport, IconSend, IconSwap, IconList } from '@arco-design/web-react/icon';
import type { BatchTraceData } from '../types';
import dayjs from 'dayjs';

const { Row, Col } = Grid;

interface BatchTraceModalProps {
  visible: boolean;
  traceData: BatchTraceData | null;
  onCancel: () => void;
}

export default function BatchTraceModal({ visible, traceData, onCancel }: BatchTraceModalProps) {
  if (!traceData) return null;

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <IconImport style={{ color: '#00b42a', fontSize: '16px' }} />;
      case 'outbound':
        return <IconSend style={{ color: '#ee4d4d', fontSize: '16px' }} />;
      case 'transfer':
        return <IconSwap style={{ color: '#165dff', fontSize: '16px' }} />;
      case 'stocktake':
        return <IconList style={{ color: '#ff7d00', fontSize: '16px' }} />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inbound':
        return '入库';
      case 'outbound':
        return '出库';
      case 'transfer':
        return '移库';
      case 'stocktake':
        return '盘点';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inbound':
        return 'green';
      case 'outbound':
        return 'red';
      case 'transfer':
        return 'blue';
      case 'stocktake':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const locationColumns = [
    {
      title: '库位编码',
      dataIndex: 'locationCode',
      width: 150,
    },
    {
      title: '当前数量',
      dataIndex: 'quantity',
      width: 120,
      render: (qty: number) => (
        <span style={{ fontWeight: 600, color: '#165dff' }}>
          {qty} {traceData.unit}
        </span>
      ),
    },
  ];

  const outboundColumns = [
    {
      title: '出库单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (no: string) => <Tag color="red">{no}</Tag>,
    },
    {
      title: '客户',
      dataIndex: 'customer',
      width: 200,
    },
    {
      title: '出库时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '出库库位',
      dataIndex: 'locationCode',
      width: 120,
    },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      width: 120,
      render: (qty: number) => (
        <span style={{ color: '#ee4d4d', fontWeight: 600 }}>
          -{qty} {traceData.unit}
        </span>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 100,
    },
  ];

  const transferColumns = [
    {
      title: '移库单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (no: string) => <Tag color="blue">{no}</Tag>,
    },
    {
      title: '源库位',
      dataIndex: 'sourceLocation',
      width: 120,
    },
    {
      title: '目标库位',
      dataIndex: 'targetLocation',
      width: 120,
    },
    {
      title: '移库时间',
      dataIndex: 'createTime',
      width: 180,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (qty: number) => (
        <span style={{ fontWeight: 600 }}>
          {qty} {traceData.unit}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          待处理: 'gold',
          运输中: 'blue',
          已完成: 'green',
          已取消: 'gray',
        };
        return <Tag color={colorMap[status] || 'gray'}>{status}</Tag>;
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      width: 100,
    },
  ];

  const isExpiringSoon = traceData.expirationDate
    ? dayjs(traceData.expirationDate).diff(dayjs(), 'day') <= 30
    : false;
  const isExpired = traceData.expirationDate
    ? dayjs(traceData.expirationDate).isBefore(dayjs())
    : false;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>批次追溯</span>
          <Tag color="arcoblue" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {traceData.batchNo}
          </Tag>
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      onOk={onCancel}
      okText="关闭"
      cancelButtonProps={{ style: { display: 'none' } }}
      style={{ top: '5vh', width: '1000px', maxWidth: '95vw' }}
    >
      <Card style={{ marginBottom: '16px' }}>
        <Descriptions
          column={3}
          data={[
            {
              label: '商品名称',
              value: traceData.productName,
            },
            {
              label: 'SKU',
              value: traceData.productSku,
            },
            {
              label: '品类',
              value: <Tag color="blue">{traceData.category}</Tag>,
            },
            {
              label: '生产日期',
              value: traceData.productionDate,
            },
            {
              label: '保质期',
              value: traceData.expirationDate ? (
                <span style={{ color: isExpired ? '#ee4d4d' : isExpiringSoon ? '#ff7d00' : '#333' }}>
                  {traceData.expirationDate}
                  {isExpired && <Tag color="red" style={{ marginLeft: '8px' }}>已过期</Tag>}
                  {!isExpired && isExpiringSoon && <Tag color="orange" style={{ marginLeft: '8px' }}>临期</Tag>}
                </span>
              ) : (
                '-'
              ),
            },
            {
              label: '单位',
              value: traceData.unit,
            },
          ]}
        />
      </Card>

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总入库数量"
              value={traceData.totalInbound}
              suffix={traceData.unit}
              styleValue={{ color: '#00b42a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总出库数量"
              value={traceData.totalOutbound}
              suffix={traceData.unit}
              styleValue={{ color: '#ee4d4d' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前剩余数量"
              value={traceData.remainingQuantity}
              suffix={traceData.unit}
              styleValue={{ color: '#165dff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="入库来源" style={{ marginBottom: '16px' }}>
        {traceData.inboundOrder ? (
          <Descriptions
            column={2}
            data={[
              {
                label: '入库单号',
                value: <Tag color="green">{traceData.inboundOrder.orderNo}</Tag>,
              },
              {
                label: '供应商',
                value: traceData.inboundOrder.supplier,
              },
              {
                label: '入库时间',
                value: traceData.inboundOrder.createTime,
              },
              {
                label: '入库数量',
                value: (
                  <span style={{ color: '#00b42a', fontWeight: 600 }}>
                    {traceData.inboundOrder.quantity} {traceData.unit}
                  </span>
                ),
              },
              {
                label: '操作人',
                value: traceData.inboundOrder.operator || '-',
              },
            ]}
          />
        ) : (
          <Empty description="未找到入库记录" />
        )}
      </Card>

      <Card title="当前库存分布" style={{ marginBottom: '16px' }}>
        {traceData.currentLocations.length > 0 ? (
          <Table
            columns={locationColumns}
            data={traceData.currentLocations}
            pagination={false}
            rowKey="locationCode"
          />
        ) : (
          <Empty description="该批次已无库存" />
        )}
      </Card>

      {traceData.outboundRecords.length > 0 && (
        <Card title="出库记录" style={{ marginBottom: '16px' }}>
          <Table
            columns={outboundColumns}
            data={traceData.outboundRecords}
            pagination={{ pageSize: 5, showTotal: true }}
            rowKey="orderNo"
          />
        </Card>
      )}

      {traceData.transferRecords.length > 0 && (
        <Card title="移库记录" style={{ marginBottom: '16px' }}>
          <Table
            columns={transferColumns}
            data={traceData.transferRecords}
            pagination={{ pageSize: 5, showTotal: true }}
            rowKey="orderNo"
          />
        </Card>
      )}

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>流转时间线</span>
            <Tag color="gray">{traceData.timeline.length} 条记录</Tag>
          </div>
        }
      >
        {traceData.timeline.length > 0 ? (
          <Timeline>
            {traceData.timeline.map((event, index) => (
              <Timeline.Item
                key={index}
                dot={getTimelineIcon(event.type)}
              >
                <div style={{ marginBottom: '4px' }}>
                  <Tag color={getTypeColor(event.type) as any} style={{ marginRight: '8px' }}>
                    {getTypeLabel(event.type)}
                  </Tag>
                  <span style={{ fontWeight: 600 }}>{event.description}</span>
                </div>
                <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>
                  {event.time}
                </div>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  {event.orderNo && <span style={{ marginRight: '16px' }}>单号: {event.orderNo}</span>}
                  {event.locationCode && <span style={{ marginRight: '16px' }}>库位: {event.locationCode}</span>}
                  <span>
                    数量: {event.quantity > 0 ? '+' : ''}
                    {event.quantity} {traceData.unit}
                  </span>
                  {event.operator && <span style={{ marginLeft: '16px' }}>操作人: {event.operator}</span>}
                </div>
                {event.remark && (
                  <div style={{ color: '#ff7d00', fontSize: '12px', marginTop: '4px' }}>
                    备注: {event.remark}
                  </div>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="暂无流转记录" />
        )}
      </Card>
    </Modal>
  );
}
