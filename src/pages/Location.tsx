import { useState } from 'react';
import { Card, Select, Tag, Modal, Table, Grid } from '@arco-design/web-react';
import { useWarehouseStore } from '../store/warehouseStore';
import type { Location } from '../types';

const { Option } = Select;
const Row = Grid.Row;
const Col = Grid.Col;

export default function LocationOverview() {
  const { locations, inventory } = useWarehouseStore();
  const [selectedZone, setSelectedZone] = useState('全部');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const zones = ['全部', ...new Set(locations.map((l) => l.zone))];

  const filteredLocations =
    selectedZone === '全部'
      ? locations
      : locations.filter((l) => l.zone === selectedZone);

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
        }
        style={{ marginTop: '24px' }}
      >
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

        <div className="location-grid">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className={`location-cell ${loc.status}`}
              onClick={() => handleLocationClick(loc)}
            >
              <div style={{ fontWeight: '500' }}>{loc.code}</div>
              <div style={{ fontSize: '10px', marginTop: '2px' }}>{loc.current}%</div>
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
