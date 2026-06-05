import { useState, useMemo } from 'react';
import { Timeline, Tag, Select, Empty, Space } from '@arco-design/web-react';
import {
  IconImport,
  IconExport,
  IconSwap,
  IconEdit,
} from '@arco-design/web-react/icon';
import type { InventoryChangeRecord, InventoryChangeType } from '../types';

const { Option } = Select;

interface InventoryTimelineProps {
  records: InventoryChangeRecord[];
  title?: string;
}

const getTypeIcon = (type: InventoryChangeType, color: string) => {
  const style = { color, fontSize: '16px' };
  switch (type) {
    case 'inbound':
      return <IconImport style={style} />;
    case 'outbound':
      return <IconExport style={style} />;
    case 'transfer':
      return <IconSwap style={style} />;
    case 'adjust':
      return <IconEdit style={style} />;
    default:
      return null;
  }
};

const typeConfig: Record<InventoryChangeType, { label: string; color: string }> = {
  inbound: { label: '入库', color: '#00b42a' },
  outbound: { label: '出库', color: '#ee4d4d' },
  transfer: { label: '调拨', color: '#165dff' },
  adjust: { label: '调整', color: '#ff7d00' },
};

export default function InventoryTimeline({ records, title }: InventoryTimelineProps) {
  const [filterType, setFilterType] = useState<InventoryChangeType | 'all'>('all');

  const filteredRecords = useMemo(() => {
    if (filterType === 'all') return records;
    return records.filter((r) => r.type === filterType);
  }, [records, filterType]);

  if (records.length === 0) {
    return (
      <div style={{ padding: '40px 0' }}>
        <Empty description="暂无库存变动记录" />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        {title && (
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            {title}
          </span>
        )}
        <Select
          placeholder="筛选变动类型"
          style={{ width: 150 }}
          value={filterType}
          onChange={(v) => setFilterType(v as InventoryChangeType | 'all')}
          allowClear
        >
          <Option value="all">全部类型</Option>
          <Option value="inbound">入库</Option>
          <Option value="outbound">出库</Option>
          <Option value="transfer">调拨</Option>
          <Option value="adjust">调整</Option>
        </Select>
      </div>

      {filteredRecords.length === 0 ? (
        <Empty description="暂无符合条件的记录" />
      ) : (
        <Timeline
          style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}
        >
          {filteredRecords.map((record) => {
            const config = typeConfig[record.type];
            const quantityColor = record.quantity > 0 ? '#00b42a' : '#ee4d4d';
            const quantityPrefix = record.quantity > 0 ? '+' : '';

            return (
              <Timeline.Item
                key={record.id}
                dot={getTypeIcon(record.type, config.color)}
                lineColor={config.color}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px',
                  }}
                >
                  <Space size="small">
                    <Tag color={config.color}>{config.label}</Tag>
                    <span style={{ fontWeight: 600 }}>{record.productName}</span>
                    <span style={{ color: '#86909c' }}>{record.productSku}</span>
                  </Space>
                  <span style={{ color: quantityColor, fontSize: '16px', fontWeight: 600 }}>
                    {quantityPrefix}
                    {record.quantity}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px 16px',
                    fontSize: '13px',
                    color: '#4e5969',
                    marginBottom: '4px',
                  }}
                >
                  <div>
                    <span style={{ color: '#86909c' }}>库位：</span>
                    {record.locationCode}
                  </div>
                  <div>
                    <span style={{ color: '#86909c' }}>批次：</span>
                    {record.batchNo}
                  </div>
                  <div>
                    <span style={{ color: '#86909c' }}>关联单号：</span>
                    <Tag color="gray" style={{ margin: 0 }}>
                      {record.orderNo}
                    </Tag>
                  </div>
                  <div>
                    <span style={{ color: '#86909c' }}>结存：</span>
                    <span style={{ fontWeight: 600 }}>{record.balanceAfter}</span>
                  </div>
                  <div>
                    <span style={{ color: '#86909c' }}>操作人：</span>
                    {record.operator}
                  </div>
                  <div>
                    <span style={{ color: '#86909c' }}>时间：</span>
                    {record.operateTime}
                  </div>
                </div>

                {record.remark && (
                  <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
                    💬 {record.remark}
                  </div>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      )}
    </div>
  );
}
