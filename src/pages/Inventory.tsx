import { useState, useMemo, useEffect } from 'react';
import { Table, Input, Select, Card, Space, Button, Tag, Tabs, Message } from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconExclamation, IconInfoCircle, IconStorage, IconList, IconRight, IconDown } from '@arco-design/web-react/icon';
import { useWarehouseStore, type InventorySummary } from '../store/warehouseStore';
import { useSearchParams } from 'react-router-dom';
import type { InventoryBatch, BatchTraceData, InventoryChangeRecord } from '../types';
import BatchTraceModal from '../components/BatchTraceModal';
import InventoryTimeline from '../components/InventoryTimeline';

const { Option } = Select;
const Search = Input.Search;
const TabPane = Tabs.TabPane;

export default function Inventory() {
  const { products, getInventorySummary, getInventoryBatches, getBatchTraceData, getInventoryChangeByProduct, getInventoryChangeByLocation } = useWarehouseStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'summary' | 'batch'>('summary');
  const [traceModalVisible, setTraceModalVisible] = useState(false);
  const [traceData, setTraceData] = useState<BatchTraceData | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [timelineData, setTimelineData] = useState<InventoryChangeRecord[]>([]);
  const [timelineTitle, setTimelineTitle] = useState('');
  const [activeExpandKey, setActiveExpandKey] = useState<string>('');

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'low' || status === 'overstock') {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const inventorySummary = useMemo(() => getInventorySummary(), [getInventorySummary]);
  const inventoryBatches = useMemo(() => getInventoryBatches(), [getInventoryBatches]);

  const filteredSummaryData = useMemo(() => {
    return inventorySummary.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchText.toLowerCase());
      const matchProduct = !filterProduct || item.productId === filterProduct;
      const matchStatus = statusFilter === 'all' || item.stockStatus === statusFilter;
      return matchSearch && matchProduct && matchStatus;
    });
  }, [inventorySummary, searchText, filterProduct, statusFilter]);

  const filteredBatchData = useMemo(() => {
    return inventoryBatches.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchText.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchText.toLowerCase());
      const matchProduct = !filterProduct || item.productId === filterProduct;
      const matchStatus = statusFilter === 'all' || item.stockStatus === statusFilter;
      return matchSearch && matchProduct && matchStatus;
    });
  }, [inventoryBatches, searchText, filterProduct, statusFilter]);

  const handleBatchClick = (batchNo: string) => {
    const data = getBatchTraceData(batchNo);
    if (data) {
      setTraceData(data);
      setTraceModalVisible(true);
    } else {
      Message.warning('未找到该批次的追溯数据');
    }
  };

  const handleRowExpand = (record: InventorySummary | InventoryBatch, type: 'product' | 'location', rowKey: string, locationId?: string, locationCode?: string) => {
    let records: InventoryChangeRecord[] = [];
    let title = '';

    if (type === 'product') {
      records = getInventoryChangeByProduct(record.productId);
      title = `${record.productName} (${record.productSku}) 库存变动时间线`;
    } else if (type === 'location' && locationId) {
      records = getInventoryChangeByLocation(locationId);
      title = `库位 ${locationCode} 库存变动时间线`;
    }

    setTimelineData(records);
    setTimelineTitle(title);
    setActiveExpandKey(rowKey);
  };

  const summaryColumns = [
    {
      title: '预警',
      width: 60,
      render: (_: unknown, record: InventorySummary) => {
        if (record.stockStatus === 'low') {
          return <IconExclamation style={{ color: '#ee4d4d', fontSize: '18px' }} />;
        } else if (record.stockStatus === 'overstock') {
          return <IconInfoCircle style={{ color: '#ff7d00', fontSize: '18px' }} />;
        }
        return null;
      },
    },
    {
      title: '展开',
      width: 60,
      render: (_: unknown, record: InventorySummary) => {
        const rowKey = record.productId;
        const isExpanded = expandedRowKeys.includes(rowKey);
        return (
          <Button
            type="text"
            size="small"
            icon={isExpanded ? <IconDown /> : <IconRight />}
            onClick={(e) => {
              e.stopPropagation();
              if (isExpanded) {
                setExpandedRowKeys(expandedRowKeys.filter(k => k !== rowKey));
              } else {
                setExpandedRowKeys([rowKey]);
                handleRowExpand(record, 'product', rowKey);
              }
            }}
          />
        );
      },
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 180,
      sorter: (a: InventorySummary, b: InventorySummary) => a.productName.localeCompare(b.productName),
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 120,
    },
    {
      title: '品类',
      dataIndex: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '合计库存',
      dataIndex: 'totalQuantity',
      width: 120,
      sorter: (a: InventorySummary, b: InventorySummary) => a.totalQuantity - b.totalQuantity,
      render: (qty: number, record: InventorySummary) => {
        let color = '#333';
        if (record.stockStatus === 'low') color = '#ee4d4d';
        else if (record.stockStatus === 'overstock') color = '#ff7d00';
        return (
          <span style={{ color, fontWeight: 600 }}>
            {qty} {record.unit}
          </span>
        );
      },
    },
    {
      title: '安全库存下限',
      dataIndex: 'safetyStockMin',
      width: 120,
    },
    {
      title: '安全库存上限',
      dataIndex: 'safetyStockMax',
      width: 120,
    },
    {
      title: '库存状态',
      dataIndex: 'stockStatus',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          normal: { color: 'green', text: '正常' },
          low: { color: 'red', text: '库存不足' },
          overstock: { color: 'orange', text: '库存积压' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '占用库位',
      dataIndex: 'locationCount',
      width: 100,
      render: (count: number) => `${count} 个`,
    },
  ];

  const handleLocationClick = (record: InventoryBatch, locationCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const location = record.locations.find(l => l.locationCode === locationCode);
    if (location) {
      const rowKey = `${record.productId}-${record.batchNo}`;
      const isExpanded = expandedRowKeys.includes(rowKey);
      const locationId = useWarehouseStore.getState().locations.find(l => l.code === locationCode)?.id || '';

      if (isExpanded && activeExpandKey === `location-${rowKey}-${locationCode}`) {
        setExpandedRowKeys([]);
        setActiveExpandKey('');
      } else {
        setExpandedRowKeys([rowKey]);
        handleRowExpand(record, 'location', rowKey, locationId, locationCode);
        setActiveExpandKey(`location-${rowKey}-${locationCode}`);
      }
    }
  };

  const batchColumns = [
    {
      title: '预警',
      width: 60,
      render: (_: unknown, record: InventoryBatch) => {
        if (record.stockStatus === 'low' || record.stockStatus === 'expired') {
          return <IconExclamation style={{ color: '#ee4d4d', fontSize: '18px' }} />;
        } else if (record.stockStatus === 'overstock' || record.stockStatus === 'expiring') {
          return <IconInfoCircle style={{ color: '#ff7d00', fontSize: '18px' }} />;
        }
        return null;
      },
    },
    {
      title: '展开',
      width: 60,
      render: (_: unknown, record: InventoryBatch) => {
        const rowKey = `${record.productId}-${record.batchNo}`;
        const isExpanded = expandedRowKeys.includes(rowKey) && activeExpandKey === rowKey;
        return (
          <Button
            type="text"
            size="small"
            icon={isExpanded ? <IconDown /> : <IconRight />}
            onClick={(e) => {
              e.stopPropagation();
              if (isExpanded) {
                setExpandedRowKeys([]);
                setActiveExpandKey('');
              } else {
                setExpandedRowKeys([rowKey]);
                handleRowExpand(record, 'product', rowKey);
                setActiveExpandKey(rowKey);
              }
            }}
          />
        );
      },
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 160,
      render: (batchNo: string) => (
        <Tag
          color="arcoblue"
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '13px',
            padding: '4px 10px',
          }}
          onClick={() => handleBatchClick(batchNo)}
        >
          {batchNo}
        </Tag>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 160,
      sorter: (a: InventoryBatch, b: InventoryBatch) => a.productName.localeCompare(b.productName),
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 120,
    },
    {
      title: '品类',
      dataIndex: 'category',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 120,
    },
    {
      title: '保质期',
      dataIndex: 'expirationDate',
      width: 120,
      render: (date: string | undefined, record: InventoryBatch) => {
        if (!date) return '-';
        let color = '#333';
        let tag = null;
        if (record.stockStatus === 'expired') {
          color = '#ee4d4d';
          tag = <Tag color="red" style={{ marginLeft: '4px' }}>已过期</Tag>;
        } else if (record.stockStatus === 'expiring') {
          color = '#ff7d00';
          tag = <Tag color="orange" style={{ marginLeft: '4px' }}>临期</Tag>;
        }
        return (
          <span style={{ color }}>
            {date}
            {tag}
          </span>
        );
      },
    },
    {
      title: '批次数量',
      dataIndex: 'totalQuantity',
      width: 120,
      sorter: (a: InventoryBatch, b: InventoryBatch) => a.totalQuantity - b.totalQuantity,
      render: (qty: number, record: InventoryBatch) => {
        let color = '#333';
        if (record.stockStatus === 'low' || record.stockStatus === 'expired') color = '#ee4d4d';
        else if (record.stockStatus === 'overstock' || record.stockStatus === 'expiring') color = '#ff7d00';
        return (
          <span style={{ color, fontWeight: 600 }}>
            {qty} {record.unit}
          </span>
        );
      },
    },
    {
      title: '库存状态',
      dataIndex: 'stockStatus',
      width: 120,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          normal: { color: 'green', text: '正常' },
          low: { color: 'red', text: '库存不足' },
          overstock: { color: 'orange', text: '库存积压' },
          expired: { color: 'red', text: '已过期' },
          expiring: { color: 'orange', text: '临期' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '存放库位',
      dataIndex: 'locations',
      width: 200,
      render: (locations: Array<{ locationCode: string; quantity: number }>, record: InventoryBatch) => {
        if (locations.length === 0) return '-';
        const rowKey = `${record.productId}-${record.batchNo}`;
        if (locations.length <= 2) {
          return (
            <Space size={4} wrap>
              {locations.map((loc) => {
                const isActive = activeExpandKey === `location-${rowKey}-${loc.locationCode}`;
                return (
                  <Tag
                    key={loc.locationCode}
                    color={isActive ? 'arcoblue' : 'gray'}
                    style={{ cursor: 'pointer' }}
                    onClick={(e: React.MouseEvent) => handleLocationClick(record, loc.locationCode, e)}
                  >
                    {loc.locationCode} ({loc.quantity})
                  </Tag>
                );
              })}
            </Space>
          );
        }
        return (
          <Space size={4} wrap>
            {locations.slice(0, 2).map((loc) => {
              const isActive = activeExpandKey === `location-${rowKey}-${loc.locationCode}`;
              return (
                <Tag
                  key={loc.locationCode}
                  color={isActive ? 'arcoblue' : 'gray'}
                  style={{ cursor: 'pointer' }}
                  onClick={(e: any) => handleLocationClick(record, loc.locationCode, e)}
                >
                  {loc.locationCode} ({loc.quantity})
                </Tag>
              );
            })}
            <Tag color="gray">+{locations.length - 2}</Tag>
          </Space>
        );
      },
    },
    {
      title: '追溯',
      width: 80,
      render: (_: unknown, record: InventoryBatch) => (
        <Button
          type="text"
          size="small"
          icon={<IconList />}
          onClick={() => handleBatchClick(record.batchNo)}
        >
          追溯
        </Button>
      ),
    },
  ];

  const totalQuantity =
    viewMode === 'summary'
      ? filteredSummaryData.reduce((sum, item) => sum + item.totalQuantity, 0)
      : filteredBatchData.reduce((sum, item) => sum + item.totalQuantity, 0);

  const rowClassName = (record: InventorySummary | InventoryBatch) => {
    if (record.stockStatus === 'low' || record.stockStatus === 'expired') {
      return 'table-row-danger';
    } else if (record.stockStatus === 'overstock' || record.stockStatus === 'expiring') {
      return 'table-row-warning';
    }
    return '';
  };

  const handleReset = () => {
    setSearchText('');
    setFilterProduct('');
    setStatusFilter('all');
    setSearchParams({});
    setExpandedRowKeys([]);
    setActiveExpandKey('');
    setTimelineData([]);
    setTimelineTitle('');
  };

  const expandedRowRender = () => {
    return (
      <div style={{ padding: '16px 24px', background: '#f7f8fa', borderRadius: '4px' }}>
        <InventoryTimeline records={timelineData} title={timelineTitle} />
      </div>
    );
  };

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space size="large" wrap>
          <Search
            placeholder="搜索商品名称/SKU/批次号"
            style={{ width: 280 }}
            value={searchText}
            onChange={setSearchText}
            searchButton={<IconSearch />}
          />
          <Select
            placeholder="筛选商品"
            style={{ width: 200 }}
            value={filterProduct}
            onChange={setFilterProduct}
            allowClear
          >
            {products.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="库存状态"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
          >
            <Option value="all">全部</Option>
            <Option value="normal">正常</Option>
            <Option value="low">库存不足</Option>
            <Option value="overstock">库存积压</Option>
            <Option value="expired">已过期</Option>
            <Option value="expiring">临期</Option>
          </Select>
          <Button icon={<IconRefresh />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <Tabs activeTab={viewMode} onChange={(v) => setViewMode(v as 'summary' | 'batch')}>
          <TabPane
            key="summary"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconStorage />
                商品汇总视图
              </div>
            }
          />
          <TabPane
            key="batch"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconList />
                批次明细视图
              </div>
            }
          />
        </Tabs>
      </Card>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#666' }}>
          共找到{' '}
          <span style={{ color: '#ff7d00', fontWeight: '600' }}>
            {viewMode === 'summary' ? filteredSummaryData.length : filteredBatchData.length}
          </span>{' '}
          {viewMode === 'summary' ? '种商品' : '个批次'}，合计库存{' '}
          <span style={{ color: '#ff7d00', fontWeight: '600' }}>{totalQuantity}</span> 件
        </div>
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                borderRadius: '2px',
              }}
            ></span>
            <span style={{ fontSize: '12px', color: '#666' }}>库存不足/过期</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: '2px',
              }}
            ></span>
            <span style={{ fontSize: '12px', color: '#666' }}>库存积压/临期</span>
          </div>
        </Space>
      </div>

      <Card>
        {viewMode === 'summary' ? (
          <Table
            columns={summaryColumns}
            data={filteredSummaryData}
            rowKey="productId"
            rowClassName={rowClassName}
            expandedRowKeys={expandedRowKeys}
            onExpandedRowsChange={(keys) => setExpandedRowKeys(keys as string[])}
            expandedRowRender={expandedRowRender}
            pagination={{
              pageSize: 20,
              showTotal: true,
              showJumper: true,
            }}
          />
        ) : (
          <Table
            columns={batchColumns}
            data={filteredBatchData}
            rowKey={(record) => `${record.productId}-${record.batchNo}`}
            rowClassName={rowClassName}
            expandedRowKeys={expandedRowKeys}
            onExpandedRowsChange={(keys) => setExpandedRowKeys(keys as string[])}
            expandedRowRender={expandedRowRender}
            pagination={{
              pageSize: 20,
              showTotal: true,
              showJumper: true,
            }}
          />
        )}
      </Card>

      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f2f3f5', borderRadius: '4px' }}>
        <span style={{ color: '#666', fontSize: '13px' }}>
          💡 提示：点击行首的展开按钮可查看商品的库存变动时间线；在「批次明细视图」中，点击<Tag color="gray">库位标签</Tag>可查看该库位的库存变动记录；点击 <Tag color="arcoblue">批次号</Tag> 或「追溯」按钮可查看该批次的完整流转记录
        </span>
      </div>

      <style>{`
        .table-row-danger {
          background-color: #fff1f0 !important;
        }
        .table-row-danger:hover > td {
          background-color: #ffccc7 !important;
        }
        .table-row-warning {
          background-color: #fffbe6 !important;
        }
        .table-row-warning:hover > td {
          background-color: #ffe58f !important;
        }
      `}</style>

      <BatchTraceModal
        visible={traceModalVisible}
        traceData={traceData}
        onCancel={() => {
          setTraceModalVisible(false);
          setTraceData(null);
        }}
      />
    </div>
  );
}
