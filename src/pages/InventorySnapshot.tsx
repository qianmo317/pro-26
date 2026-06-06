import { useState, useMemo } from 'react';
import { Table, DatePicker, Card, Space, Button, Tag, Statistic, Input, Select, Grid } from '@arco-design/web-react';
import { toast } from '../components/Toast';
import {
  IconSearch,
  IconRefresh,
  IconDownload,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconCalendar,
} from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import type { InventorySnapshotData, InventorySnapshotItem } from '../types';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const Search = Input.Search;
const Row = Grid.Row;
const Col = Grid.Col;

export default function InventorySnapshot() {
  const {
    products,
    getInventorySnapshot,
    exportInventorySnapshotToExcel,
    getCategories,
    getZones,
  } = useWarehouseStore();

  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(
    dayjs().subtract(7, 'day')
  );
  const [snapshotData, setSnapshotData] = useState<InventorySnapshotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterZone, setFilterZone] = useState<string>('');
  const [trendFilter, setTrendFilter] = useState<string>('all');

  const categories = useMemo(() => getCategories(), [getCategories]);
  const zones = useMemo(() => getZones(), [getZones]);

  const handleQuery = () => {
    const targetDate = selectedDate.format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');

    if (dayjs(targetDate).isAfter(dayjs(today))) {
      toast.warning('查询日期不能晚于当前日期');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const data = getInventorySnapshot(targetDate);
      setSnapshotData(data);
      setLoading(false);
      toast.success(`已查询 ${targetDate} 的库存快照`);
    }, 500);
  };

  const handleExport = () => {
    if (!snapshotData) {
      toast.warning('请先查询库存快照');
      return;
    }
    exportInventorySnapshotToExcel(snapshotData);
    toast.success('导出成功');
  };

  const handleReset = () => {
    setSelectedDate(dayjs().subtract(7, 'day'));
    setSnapshotData(null);
    setSearchText('');
    setFilterProduct('');
    setFilterCategory('');
    setFilterZone('');
    setTrendFilter('all');
  };

  const filteredItems = useMemo(() => {
    if (!snapshotData) return [];

    return snapshotData.items.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchText.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchText.toLowerCase()) ||
        item.locationCode.toLowerCase().includes(searchText.toLowerCase());

      const matchProduct = !filterProduct || item.productId === filterProduct;
      const matchCategory = !filterCategory || item.category === filterCategory;
      const matchZone = !filterZone || item.zone === filterZone;

      let matchTrend = true;
      if (trendFilter === 'increased') matchTrend = item.quantityDiff > 0;
      else if (trendFilter === 'decreased') matchTrend = item.quantityDiff < 0;
      else if (trendFilter === 'unchanged') matchTrend = item.quantityDiff === 0;

      return matchSearch && matchProduct && matchCategory && matchZone && matchTrend;
    });
  }, [snapshotData, searchText, filterProduct, filterCategory, filterZone, trendFilter]);

  const trendChartOption = useMemo(() => {
    if (!snapshotData) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['历史库存', '当前库存'],
        bottom: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: filteredItems.slice(0, 10).map((i) => `${i.productName.slice(0, 6)}`),
        axisLabel: {
          rotate: 30,
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        name: '数量',
      },
      series: [
        {
          name: '历史库存',
          type: 'bar',
          data: filteredItems.slice(0, 10).map((i) => i.historicalQuantity),
          itemStyle: { color: '#3498db' },
        },
        {
          name: '当前库存',
          type: 'bar',
          data: filteredItems.slice(0, 10).map((i) => i.currentQuantity),
          itemStyle: { color: '#27ae60' },
        },
      ],
    };
  }, [snapshotData, filteredItems]);

  const pieChartOption = useMemo(() => {
    if (!snapshotData) return {};

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 项 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: snapshotData.increasedCount,
              name: '库存增加',
              itemStyle: { color: '#27ae60' },
            },
            {
              value: snapshotData.decreasedCount,
              name: '库存减少',
              itemStyle: { color: '#e74c3c' },
            },
            {
              value: snapshotData.unchangedCount,
              name: '库存不变',
              itemStyle: { color: '#95a5a6' },
            },
          ],
        },
      ],
    };
  }, [snapshotData]);

  const columns = [
    {
      title: '商品SKU',
      dataIndex: 'productSku',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '品类',
      dataIndex: 'category',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '区域',
      dataIndex: 'zone',
      width: 80,
      render: (zone: string) => <Tag color="cyan">{zone}</Tag>,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 100,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 160,
      render: (batchNo: string) => (
        <Tag color="arcoblue" style={{ fontFamily: 'monospace' }}>
          {batchNo}
        </Tag>
      ),
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 110,
    },
    {
      title: `${snapshotData?.snapshotDate || '历史'} 库存`,
      dataIndex: 'historicalQuantity',
      width: 120,
      sorter: (a: InventorySnapshotItem, b: InventorySnapshotItem) =>
        a.historicalQuantity - b.historicalQuantity,
      render: (qty: number, record: InventorySnapshotItem) => (
        <span style={{ fontWeight: 600, color: '#3498db' }}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: `${snapshotData?.currentDate || '当前'} 库存`,
      dataIndex: 'currentQuantity',
      width: 120,
      sorter: (a: InventorySnapshotItem, b: InventorySnapshotItem) =>
        a.currentQuantity - b.currentQuantity,
      render: (qty: number, record: InventorySnapshotItem) => (
        <span style={{ fontWeight: 600, color: '#27ae60' }}>
          {qty} {record.unit}
        </span>
      ),
    },
    {
      title: '变动数量',
      dataIndex: 'quantityDiff',
      width: 120,
      sorter: (a: InventorySnapshotItem, b: InventorySnapshotItem) =>
        a.quantityDiff - b.quantityDiff,
      render: (diff: number, record: InventorySnapshotItem) => {
        const renderIcon = () => {
          if (diff > 0) return <IconArrowUp style={{ color: '#27ae60' }} />;
          if (diff < 0) return <IconArrowDown style={{ color: '#e74c3c' }} />;
          return <IconMinus style={{ color: '#95a5a6' }} />;
        };
        const getColor = () => {
          if (diff > 0) return '#27ae60';
          if (diff < 0) return '#e74c3c';
          return '#95a5a6';
        };
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: getColor() }}>
            {renderIcon()}
            {diff > 0 ? `+${diff}` : diff} {record.unit}
          </span>
        );
      },
    },
    {
      title: '变动比例',
      dataIndex: 'quantityDiffPercent',
      width: 120,
      sorter: (a: InventorySnapshotItem, b: InventorySnapshotItem) =>
        a.quantityDiffPercent - b.quantityDiffPercent,
      render: (percent: number) => {
        let color = '#333';
        if (percent > 0) color = '#27ae60';
        else if (percent < 0) color = '#e74c3c';
        return (
          <Tag color={color}>
            {percent > 0 ? '+' : ''}
            {percent}%
          </Tag>
        );
      },
    },
  ];

  const rowClassName = (record: InventorySnapshotItem) => {
    if (record.quantityDiff > 0) return 'snapshot-row-increased';
    if (record.quantityDiff < 0) return 'snapshot-row-decreased';
    return '';
  };

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space size="large" wrap align="center">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCalendar style={{ fontSize: '18px', color: '#ff7d00' }} />
            <span style={{ fontWeight: 500 }}>查询日期：</span>
            <DatePicker
              style={{ width: 200 }}
              value={selectedDate}
              onChange={(_dateString, date) => setSelectedDate(date)}
              disabledDate={(date) => dayjs(date).isAfter(dayjs(), 'day')}
              placeholder="选择历史日期"
              allowClear={false}
            />
          </div>
          <Button
            type="primary"
            onClick={handleQuery}
            loading={loading}
            style={{ background: '#ff7d00' }}
          >
            查询快照
          </Button>
          <Button icon={<IconRefresh />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      {snapshotData && (
        <>
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title={`${snapshotData.snapshotDate} 总库存`}
                  value={snapshotData.totalHistoricalQuantity}
                  suffix="件"
                  style={{ color: '#3498db' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title={`${snapshotData.currentDate} 总库存`}
                  value={snapshotData.totalCurrentQuantity}
                  suffix="件"
                  style={{ color: '#27ae60' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <Statistic
                  title="总变动数量"
                  value={snapshotData.totalDiffQuantity}
                  suffix="件"
                  style={{
                    color:
                      snapshotData.totalDiffQuantity > 0
                        ? '#27ae60'
                        : snapshotData.totalDiffQuantity < 0
                        ? '#e74c3c'
                        : '#95a5a6',
                  }}
                  prefix={
                    snapshotData.totalDiffQuantity > 0 ? (
                      <IconArrowUp style={{ marginRight: '4px' }} />
                    ) : snapshotData.totalDiffQuantity < 0 ? (
                      <IconArrowDown style={{ marginRight: '4px' }} />
                    ) : null
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Statistic
                    title="增加"
                    value={snapshotData.increasedCount}
                    suffix="项"
                    style={{ color: '#27ae60' }}
                  />
                  <Statistic
                    title="减少"
                    value={snapshotData.decreasedCount}
                    suffix="项"
                    style={{ color: '#e74c3c' }}
                  />
                  <Statistic
                    title="不变"
                    value={snapshotData.unchangedCount}
                    suffix="项"
                    style={{ color: '#95a5a6' }}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={14}>
              <Card title="库存对比趋势图 (前10项)">
                <ReactECharts
                  option={trendChartOption}
                  style={{ height: 300 }}
                  notMerge
                  lazyUpdate
                />
              </Card>
            </Col>
            <Col span={10}>
              <Card title="库存变动分布">
                <ReactECharts
                  option={pieChartOption}
                  style={{ height: 300 }}
                  notMerge
                  lazyUpdate
                />
              </Card>
            </Col>
          </Row>

          <Card style={{ marginBottom: '16px' }}>
            <Space size="large" wrap>
              <Search
                placeholder="搜索商品名称/SKU/批次/库位"
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
                    {p.name} ({p.sku})
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="筛选品类"
                style={{ width: 150 }}
                value={filterCategory}
                onChange={setFilterCategory}
                allowClear
              >
                {categories.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="筛选区域"
                style={{ width: 150 }}
                value={filterZone}
                onChange={setFilterZone}
                allowClear
              >
                {zones.map((z) => (
                  <Option key={z} value={z}>
                    {z}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="变动趋势"
                style={{ width: 150 }}
                value={trendFilter}
                onChange={setTrendFilter}
                allowClear
              >
                <Option value="all">全部</Option>
                <Option value="increased">库存增加</Option>
                <Option value="decreased">库存减少</Option>
                <Option value="unchanged">库存不变</Option>
              </Select>
              <Button
                type="primary"
                icon={<IconDownload />}
                onClick={handleExport}
                style={{ background: '#27ae60' }}
              >
                导出 Excel
              </Button>
            </Space>
          </Card>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#666' }}>
              共找到 <span style={{ color: '#ff7d00', fontWeight: 600 }}>{filteredItems.length}</span> 条记录
              {filteredItems.length !== snapshotData.items.length && (
                <span style={{ marginLeft: '8px', color: '#999' }}>
                  (共 {snapshotData.items.length} 条)
                </span>
              )}
              ，涉及 <span style={{ color: '#ff7d00', fontWeight: 600 }}>{snapshotData.productCount}</span> 种商品，
              <span style={{ color: '#ff7d00', fontWeight: 600 }}>{snapshotData.locationCount}</span> 个库位
            </div>
            <Space>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#e8f5e9',
                    border: '1px solid #a5d6a7',
                    borderRadius: '2px',
                  }}
                ></span>
                <span style={{ fontSize: '12px', color: '#666' }}>库存增加</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#ffebee',
                    border: '1px solid #ef9a9a',
                    borderRadius: '2px',
                  }}
                ></span>
                <span style={{ fontSize: '12px', color: '#666' }}>库存减少</span>
              </div>
            </Space>
          </div>

          <Card>
            <Table
              columns={columns}
              data={filteredItems}
              rowKey="id"
              rowClassName={rowClassName}
              loading={loading}
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 20,
                showTotal: true,
                showJumper: true,
                sizeCanChange: true,
              }}
            />
          </Card>

          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f2f3f5', borderRadius: '4px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>
              💡 说明：库存快照基于历史库存变动记录反向推算得出，展示所选日期结束时的库存状态。
              蓝色列为历史日期库存，绿色列为当前库存，红色表示库存减少，绿色表示库存增加。
            </span>
          </div>
        </>
      )}

      {!snapshotData && (
        <Card style={{ textAlign: 'center', padding: '80px 20px' }}>
          <IconCalendar style={{ fontSize: '64px', color: '#ccc' }} />
          <div style={{ marginTop: '16px', fontSize: '16px', color: '#666' }}>
            请选择日期并点击「查询快照」查看历史库存状态
          </div>
        </Card>
      )}

      <style>{`
        .snapshot-row-increased {
          background-color: #e8f5e9 !important;
        }
        .snapshot-row-increased:hover > td {
          background-color: #c8e6c9 !important;
        }
        .snapshot-row-decreased {
          background-color: #ffebee !important;
        }
        .snapshot-row-decreased:hover > td {
          background-color: #ffcdd2 !important;
        }
      `}</style>
    </div>
  );
}
