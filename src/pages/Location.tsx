import { useState, useMemo } from 'react';
import { Card, Select, Tag, Modal, Table, Grid, Radio, Button, Space, Form, Input, Checkbox, Tooltip } from '@arco-design/web-react';
import { IconLock, IconUnlock, IconCheck } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { Location, HeatmapMode, HeatmapDimension } from '../types';

const { Option } = Select;
const { Group } = Radio;
const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const { TextArea } = Input;

type BatchAction = 'lock' | 'unlock' | null;

export default function LocationOverview() {
  const { locations, inventory, getLocationActivity, getMaxActivityCount, lockLocations, unlockLocations } = useWarehouseStore();
  const [selectedZone, setSelectedZone] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('status');
  const [heatmapDimension, setHeatmapDimension] = useState<HeatmapDimension>('total');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchAction, setBatchAction] = useState<BatchAction>(null);
  const [batchForm] = Form.useForm();

  const zones = ['全部', ...new Set(locations.map((l) => l.zone))];
  const statusOptions = [
    { value: '全部', label: '全部' },
    { value: 'empty', label: '空闲' },
    { value: 'normal', label: '正常' },
    { value: 'full', label: '已满' },
    { value: 'locked', label: '锁定' },
  ];

  const filteredLocations = useMemo(() => {
    return locations.filter((l) => {
      const zoneMatch = selectedZone === '全部' || l.zone === selectedZone;
      const statusMatch = selectedStatus === '全部' || l.status === selectedStatus;
      return zoneMatch && statusMatch;
    });
  }, [locations, selectedZone, selectedStatus]);

  const maxActivity = useMemo(
    () => getMaxActivityCount(heatmapDimension),
    [heatmapDimension, getMaxActivityCount]
  );

  const allSelected = filteredLocations.length > 0 && filteredLocations.every((l) => selectedIds.has(l.id));
  const someSelected = filteredLocations.some((l) => selectedIds.has(l.id));

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
    {
      label: '锁定',
      value: locations.filter((l) => l.status === 'locked').length,
      color: '#ff9800',
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

  const handleLocationClick = (loc: Location, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.location-checkbox')) return;
    setSelectedLocation(loc);
    setModalVisible(true);
  };

  const handleSelectToggle = (locId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(locId)) {
      newSelected.delete(locId);
    } else {
      newSelected.add(locId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedIds);
      filteredLocations.forEach((l) => newSelected.delete(l.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      filteredLocations.forEach((l) => newSelected.add(l.id));
      setSelectedIds(newSelected);
    }
  };

  const handleBatchAction = (action: BatchAction) => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择库位');
      return;
    }
    setBatchAction(action);
    setBatchModalVisible(true);
  };

  const handleBatchSubmit = (values: { reason: string }) => {
    if (!batchAction) return;
    const operator = '当前用户';
    const idList = Array.from(selectedIds);

    try {
      let count = 0;
      if (batchAction === 'lock') {
        count = lockLocations(idList, values.reason, operator);
        toast.success(`成功锁定 ${count} 个库位`);
      } else if (batchAction === 'unlock') {
        count = unlockLocations(idList, values.reason, operator);
        toast.success(`成功解锁 ${count} 个库位`);
      }
      setBatchModalVisible(false);
      batchForm.resetFields();
      setSelectedIds(new Set());
      setBatchAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    }
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

  const canBatchLock = selectedIds.size > 0 && Array.from(selectedIds).some((id) => {
    const loc = locations.find((l) => l.id === id);
    return loc && loc.status !== 'locked';
  });

  const canBatchUnlock = selectedIds.size > 0 && Array.from(selectedIds).some((id) => {
    const loc = locations.find((l) => l.id === id);
    return loc && loc.status === 'locked';
  });

  return (
    <div>
      <Row gutter={16}>
        {statData.map((stat, idx) => (
          <Col span={4.8} key={idx}>
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            <Select
              style={{ width: 120 }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </div>
        }
        style={{ marginTop: '24px' }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Space>
            <Checkbox
              indeterminate={someSelected && !allSelected}
              checked={allSelected}
              onChange={handleSelectAll}
            >
              全选当前筛选结果 ({filteredLocations.length} 个)
            </Checkbox>
            {selectedIds.size > 0 && (
              <span style={{ color: '#666', fontSize: '13px' }}>
                已选择 <strong style={{ color: 'var(--primary-color)' }}>{selectedIds.size}</strong> 个库位
              </span>
            )}
          </Space>
          <Space style={{ marginLeft: 'auto' }}>
            <Tooltip content={canBatchLock ? '' : '没有可锁定的库位'}>
              <Button
                type="primary"
                status="warning"
                icon={<IconLock />}
                onClick={() => handleBatchAction('lock')}
                disabled={!canBatchLock}
              >
                批量锁定
              </Button>
            </Tooltip>
            <Tooltip content={canBatchUnlock ? '' : '没有可解锁的库位'}>
              <Button
                type="primary"
                status="success"
                icon={<IconUnlock />}
                onClick={() => handleBatchAction('unlock')}
                disabled={!canBatchUnlock}
              >
                批量解锁
              </Button>
            </Tooltip>
          </Space>
        </div>

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
          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
              className={`location-cell ${heatmapMode === 'status' ? loc.status : ''} ${selectedIds.has(loc.id) ? 'selected' : ''}`}
              style={{
                ...(heatmapMode === 'heatmap' ? getHeatmapColor(loc) : undefined),
                position: 'relative',
              }}
              onClick={(e) => handleLocationClick(loc, e)}
            >
              <div
                className="location-checkbox"
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  zIndex: 1,
                }}
                onClick={(e) => handleSelectToggle(loc.id, e)}
              >
                <Checkbox checked={selectedIds.has(loc.id)} />
              </div>
              {loc.status === 'locked' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    fontSize: '10px',
                    color: '#ff9800',
                    zIndex: 1,
                  }}
                >
                  <IconLock />
                </div>
              )}
              <div style={{ fontWeight: '500', marginTop: '16px' }}>{loc.code}</div>
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
                        : selectedLocation.status === 'locked'
                        ? 'orange'
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

            {selectedLocation.status === 'locked' && (
              <div
                style={{
                  background: '#fff8e6',
                  border: '1px solid #ffd591',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '8px', color: '#d46b08' }}>
                  <IconLock style={{ marginRight: '4px' }} />
                  库位已锁定
                </div>
                {selectedLocation.lockReason && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    锁定原因：{selectedLocation.lockReason}
                  </div>
                )}
                {selectedLocation.lockOperator && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    操作人：{selectedLocation.lockOperator}
                  </div>
                )}
                {selectedLocation.lockTime && (
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    锁定时间：{selectedLocation.lockTime}
                  </div>
                )}
              </div>
            )}

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

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {batchAction === 'lock' ? <IconLock /> : <IconUnlock />}
            {batchAction === 'lock' ? '批量锁定库位' : '批量解锁库位'}
          </div>
        }
        visible={batchModalVisible}
        onOk={() => batchForm.submit()}
        onCancel={() => {
          setBatchModalVisible(false);
          batchForm.resetFields();
          setBatchAction(null);
        }}
        okText={batchAction === 'lock' ? '确认锁定' : '确认解锁'}
        okButtonProps={{
          status: batchAction === 'lock' ? 'warning' : 'success',
        }}
        style={{ width: 500 }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
            即将对以下 <strong style={{ color: 'var(--primary-color)' }}>{selectedIds.size}</strong> 个库位执行{batchAction === 'lock' ? '锁定' : '解锁'}操作：
          </div>
          <div
            style={{
              background: '#f5f7fa',
              padding: '12px',
              borderRadius: '6px',
              maxHeight: '120px',
              overflowY: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {Array.from(selectedIds).map((id) => {
              const loc = locations.find((l) => l.id === id);
              return (
                <Tag key={id} color="blue">
                  {loc?.code || id}
                </Tag>
              );
            })}
          </div>
          {batchAction === 'lock' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: '#fff8e6',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#d46b08',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <IconCheck />
              锁定后库位禁止新商品入库，但已有商品可以正常出库
            </div>
          )}
        </div>
        <Form form={batchForm} layout="vertical" onSubmit={handleBatchSubmit}>
          <FormItem
            label="操作原因"
            field="reason"
            rules={[{ required: true, message: '请填写操作原因' }]}
          >
            <TextArea
              placeholder={`请填写${batchAction === 'lock' ? '锁定' : '解锁'}原因，如：库存盘点、库位维护等`}
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
