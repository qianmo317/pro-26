import { useState, useMemo } from 'react';
import { Card, Select, Tag, Modal, Table, Grid, Radio } from '@arco-design/web-react';
import { useWarehouseStore } from '../store/warehouseStore';
import type { Location, HeatmapMode, HeatmapDimension } from '../types';

const { Option } = Select;
const { Group } = Radio;
const Row = Grid.Row;
const Col = Grid.Col;

export default function LocationOverview() {
  const { locations, inventory, getLocationActivity, getMaxActivityCount } = useWarehouseStore();
  const [selectedZone, setSelectedZone] = useState('全部');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('status');
  const [heatmapDimension, setHeatmapDimension] = useState<HeatmapDimension>('total');

  const zones = ['全部', ...new Set(locations.map((l) => l.zone))];

  const filteredLocations =
    selectedZone === '全部'
      ? locations
      : locations.filter((l) => l.zone === selectedZone);

  const maxActivity = useMemo(
    () => getMaxActivityCount(heatmapDimension),
    [heatmapDimension, getMaxActivityCount]
  );

  const getHeatmapColor = (loc: Location): React.CSSProperties => {
    if (heatmapMode === 'status') {
      return {};
    }
    const activity = getLocationActivity(loc.id);
    if (!activity) {
      return { background: '#f5f5f5', color: '#999' };
    }
    const count =
      heatmapDimension === 'inbound'
        ? activity.inboundCount
        : heatmapDimension === 'outbound'
        ? activity.outboundCount
        : activity.totalCount;
    const ratio = maxActivity > 0 ? count / maxActivity : 0;
    const alpha = 0.2 + ratio * 0.7;
    const baseColor =
      heatmapDimension === 'inbound'
        ? '255, 125, 0'
        : heatmapDimension === 'outbound'
        ? '39, 174, 96'
        : '52, 152, 219';
    return {
      background: `rgba(${baseColor}, ${alpha})`,
      color: ratio > 0.5 ? '#fff' : '#333',
      border: `1px solid rgba(${baseColor}, ${alpha + 0.2})`,
    };
  };

  const getActivityCount = (loc: Location) => {
    const activity = getLocationActivity(loc.id);
    if (!activity) return 0;
    return heatmapDimension === 'inbound'
      ? activity.inboundCount
      : heatmapDimension === 'outbound'
      ? activity.outboundCount
      : activity.totalCount;
  };

  const handleLocationClick = (loc: Location) => {
    setSelectedLocation(loc);
    setModalVisible(true);
  };

  const getLocationInventory = (locId: string) => {
    return inventory.filter((inv) => inv.locationId === locId);
  };

  const inventoryColumns = [
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
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 120,
    },
  ];

  const statData = [
    { label: '总库位数', value: locations.length, color: '#333' },
    {
      label: '空闲',
      value: locations.filter((l) => l.status === 'empty').length,
      color: '#9e9e9e',
    },
    {
      label: '正常',
      value: locations.filter((l) => l.status === 'normal').length,
      color: '#1976d2',
    },
    {
      label: '已满',
      value: locations.filter((l) => l.status === 'full').length,
      color: '#c62828',
    },
  ];

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      empty: '空闲',
      normal: '正常',
      full: '已满',
      locked: '锁定',
    };
    return map[status] || '未知';
  };

  return (
    <div>
      <Row gutter={16}>
        {statData.map((stat, idx) => (
          <Col span={6} key={idx}>
            <div
              className="stat-card"
              style={{ borderLeftColor: stat.color, padding: '16px 20px' }}
            >
              <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: stat.color }}>
                {stat.value}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Card
        title="库位可视化"
        extra={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Group value={heatmapMode} onChange={setHeatmapMode} type="button">
              <Radio value="status">占用状态</Radio>
              <Radio value="heatmap">热力图</Radio>
            </Group>
            <Select
              style={{ width: 120 }}
              value={selectedZone}
              onChange={setSelectedZone}
            >
              {zones.map((zone) => (
                <Option key={zone} value={zone}>
                  {zone}
                </Option>
              ))}
            </Select>
          </div>
        }
        style={{ marginTop: '24px' }}
      >
        {heatmapMode === 'heatmap' && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Group value={heatmapDimension} onChange={setHeatmapDimension} type="button">
              <Radio value="total">总频次</Radio>
              <Radio value="inbound">入库</Radio>
              <Radio value="outbound">出库</Radio>
            </Group>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>低</span>
              <div
                style={{
                  width: '120px',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, ${
                    heatmapDimension === 'inbound'
                      ? 'rgba(255, 125, 0, 0.2), rgba(255, 125, 0, 0.9)'
                      : heatmapDimension === 'outbound'
                      ? 'rgba(39, 174, 96, 0.2), rgba(39, 174, 96, 0.9)'
                      : 'rgba(52, 152, 219, 0.2), rgba(52, 152, 219, 0.9)'
                  })`,
                }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>高</span>
            </div>
          </div>
        )}
        {heatmapMode === 'status' && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#e0e0e0',
                }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>空闲</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#e3f2fd',
                }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>正常</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#ffebee',
                }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>已满</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#ffecb3',
                }}
              />
              <span style={{ fontSize: '12px', color: '#666' }}>锁定</span>
            </div>
          </div>
        )}

        <div className="location-grid">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className={`location-cell ${heatmapMode === 'status' ? loc.status : ''}`}
              style={heatmapMode === 'heatmap' ? getHeatmapColor(loc) : undefined}
              onClick={() => handleLocationClick(loc)}
            >
              <div style={{ fontWeight: '500' }}>{loc.code}</div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>
                {heatmapMode === 'heatmap' ? `${getActivityCount(loc)}次` : `${loc.current}%`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title="库位详情"
        visible={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
        style={{ width: 700 }}
        footer={null}
      >
        {selectedLocation && (
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
                <div style={{ color: '#666', fontSize: '12px' }}>库位编码</div>
                <div style={{ fontWeight: '500', fontSize: '18px' }}>
                  {selectedLocation.code}
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>所属区域</div>
                <div style={{ fontWeight: '500' }}>{selectedLocation.zone}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>状态</div>
                <div>
                  <Tag
                    color={
                      selectedLocation.status === 'empty'
                        ? 'gray'
                        : selectedLocation.status === 'full'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {getStatusLabel(selectedLocation.status)}
                  </Tag>
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>货架</div>
                <div style={{ fontWeight: '500' }}>
                  {selectedLocation.aisle} 通道 {selectedLocation.shelf} 货架
                </div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>层</div>
                <div style={{ fontWeight: '500' }}>第 {selectedLocation.level} 层</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: '12px' }}>容量使用率</div>
                <div style={{ fontWeight: '500' }}>{selectedLocation.current}%</div>
              </div>
            </div>

            {(() => {
              const activity = getLocationActivity(selectedLocation.id);
              if (!activity) return null;
              return (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '12px' }}>近30天活跃度</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(52, 152, 219, 0.1)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#666' }}>总频次</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#3498db' }}>
                        {activity.totalCount}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 125, 0, 0.1)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#666' }}>入库</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#ff7d00' }}>
                        {activity.inboundCount}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(39, 174, 96, 0.1)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#666' }}>出库</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#27ae60' }}>
                        {activity.outboundCount}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ marginBottom: '12px', fontWeight: '500' }}>库存商品</div>
            {getLocationInventory(selectedLocation.id).length > 0 ? (
              <Table
                columns={inventoryColumns}
                data={getLocationInventory(selectedLocation.id)}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                该库位暂无库存
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
