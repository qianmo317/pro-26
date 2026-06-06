import { Card, Grid, Tabs, DatePicker, Select, Table, Button, Statistic, Tag, Space, Message } from '@arco-design/web-react';
import ReactECharts from 'echarts-for-react';
import { useState, useMemo } from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import type { StockAgeFilter } from '../types';

const Row = Grid.Row;
const Col = Grid.Col;
const TabPane = Tabs.TabPane;
const RangePicker = DatePicker.RangePicker;

export default function Report() {
  const { reportData } = useWarehouseStore();

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['入库量', '出库量'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: reportData.inboundTrend.map((d) => d.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        smooth: true,
        data: reportData.inboundTrend.map((d) => d.count),
        itemStyle: { color: '#ff7d00' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 125, 0, 0.4)' },
              { offset: 1, color: 'rgba(255, 125, 0, 0.05)' },
            ],
          },
        },
      },
      {
        name: '出库量',
        type: 'line',
        smooth: true,
        data: reportData.outboundTrend.map((d) => d.count),
        itemStyle: { color: '#27ae60' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(39, 174, 96, 0.4)' },
              { offset: 1, color: 'rgba(39, 174, 96, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const categoryChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '品类分布',
        type: 'pie',
        radius: ['50%', '70%'],
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
            fontSize: '20',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: reportData.categoryStats,
        color: ['#ff7d00', '#27ae60', '#3498db', '#9b59b6', '#e74c3c'],
      },
    ],
  };

  const utilizationChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: reportData.locationUtilization.map((d) => d.zone),
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        name: '利用率',
        type: 'bar',
        data: reportData.locationUtilization.map((d) => d.utilization),
        itemStyle: {
          color: (params: any) => {
            const colors = ['#ff7d00', '#27ae60', '#3498db', '#9b59b6'];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [8, 8, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
        },
        barWidth: '50%',
      },
    ],
  };

  const topProductsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: [...reportData.topProducts].reverse().map((d) => d.name),
    },
    series: [
      {
        name: '出入库次数',
        type: 'bar',
        data: [...reportData.topProducts].reverse().map((d) => d.quantity),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#ff7d00' },
              { offset: 1, color: '#ff9500' },
            ],
          },
          borderRadius: [0, 8, 8, 0],
        },
        label: {
          show: true,
          position: 'right',
        },
      },
    ],
  };

  const stockTurnoverOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['库存周转率', '库存周转天数'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: [
      {
        type: 'value',
        name: '周转率',
        position: 'left',
      },
      {
        type: 'value',
        name: '周转天数',
        position: 'right',
      },
    ],
    series: [
      {
        name: '库存周转率',
        type: 'bar',
        data: [2.5, 3.2, 2.8, 3.5, 4.0, 3.8],
        itemStyle: { color: '#3498db', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '库存周转天数',
        type: 'line',
        yAxisIndex: 1,
        data: [12, 9, 11, 8, 7, 8],
        itemStyle: { color: '#e74c3c' },
        smooth: true,
      },
    ],
  };

  const [stockAgeFilter, setStockAgeFilter] = useState<StockAgeFilter>({
    categories: [],
    zones: [],
  });

  const { getStockAgeData, getCategories, getZones, exportOverageItems } = useWarehouseStore();
  const categories = getCategories();
  const zones = getZones();

  const stockAgeData = useMemo(() => {
    const filter: StockAgeFilter = {
      categories: stockAgeFilter.categories.length > 0 ? stockAgeFilter.categories : [],
      zones: stockAgeFilter.zones.length > 0 ? stockAgeFilter.zones : [],
    };
    return getStockAgeData(filter);
  }, [stockAgeFilter, getStockAgeData]);

  const stockAgeBarOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const paramArray = params as Array<{ marker: string; seriesName: string; value: number; axisValue: string }>;
        let result = `${paramArray[0].axisValue}<br/>`;
        paramArray.forEach((p) => {
          result += `${p.marker}${p.seriesName}: ${p.value.toLocaleString()}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: ['商品数量', '库存金额'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: stockAgeData.stats.map((s) => s.label),
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left',
      },
      {
        type: 'value',
        name: '金额(元)',
        position: 'right',
      },
    ],
    series: [
      {
        name: '商品数量',
        type: 'bar',
        data: stockAgeData.stats.map((s) => s.quantity),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3498db' },
              { offset: 1, color: '#2980b9' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}\n({d}%)',
        },
        barWidth: '30%',
      },
      {
        name: '库存金额',
        type: 'bar',
        yAxisIndex: 1,
        data: stockAgeData.stats.map((s) => s.amount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#ff7d00' },
              { offset: 1, color: '#e67e22' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: { value: number; dataIndex: number }) => {
            return `${params.value.toLocaleString()}\n(${stockAgeData.stats[params.dataIndex].amountRatio}%)`;
          },
        },
        barWidth: '30%',
      },
    ],
  };

  const overagePieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '超龄占比',
        type: 'pie',
        radius: ['40%', '70%'],
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
            fontSize: '20',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: stockAgeData.totalQuantity - stockAgeData.overageQuantity,
            name: '正常库存',
            itemStyle: { color: '#27ae60' },
          },
          {
            value: stockAgeData.overageQuantity,
            name: '超龄库存(90天以上)',
            itemStyle: { color: '#e74c3c' },
          },
        ],
      },
    ],
  };

  const overageItems = useMemo(() => {
    return stockAgeData.items.filter((item) => item.ageRange === '90+');
  }, [stockAgeData]);

  const handleExport = () => {
    if (overageItems.length === 0) {
      Message.warning('没有超龄商品可导出');
      return;
    }
    exportOverageItems(overageItems);
    Message.success('超龄商品列表导出成功');
  };

  const columns = [
    {
      title: '商品SKU',
      dataIndex: 'productSku',
      width: 120,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 120,
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '区域',
      dataIndex: 'zone',
      width: 80,
      render: (text: string) => <Tag color="arcoblue">{text}</Tag>,
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
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 80,
      align: 'right' as const,
    },
    {
      title: '单价(元)',
      dataIndex: 'price',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 120,
    },
    {
      title: '库龄(天)',
      dataIndex: 'stockDays',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <Tag color={value > 90 ? 'red' : value > 60 ? 'orange' : value > 30 ? 'gold' : 'green'}>
          {value}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <RangePicker style={{ width: 280 }} placeholder={['开始日期', '结束日期']} />
      </div>

      <Tabs defaultActiveTab="trend">
        <TabPane key="trend" title="出入库趋势">
          <Card title="出入库趋势分析" className="chart-container">
            <ReactECharts option={trendChartOption} style={{ height: '400px' }} />
          </Card>
        </TabPane>
        <TabPane key="category" title="品类分析">
          <Card title="库存品类分布" className="chart-container">
            <ReactECharts option={categoryChartOption} style={{ height: '400px' }} />
          </Card>
        </TabPane>
        <TabPane key="location" title="库位分析">
          <Card title="各区域库位利用率" className="chart-container">
            <ReactECharts option={utilizationChartOption} style={{ height: '400px' }} />
          </Card>
        </TabPane>
        <TabPane key="product" title="商品分析">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="热门商品排行" className="chart-container">
                <ReactECharts option={topProductsOption} style={{ height: '400px' }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="库存周转分析" className="chart-container">
                <ReactECharts option={stockTurnoverOption} style={{ height: '400px' }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
        <TabPane key="stockAge" title="库龄分析">
          <Card
            title="库龄分析"
            extra={
              <Space>
                <span style={{ color: '#86909c' }}>商品类别:</span>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="全部"
                  style={{ width: 200 }}
                  value={stockAgeFilter.categories}
                  onChange={(value) => setStockAgeFilter({ ...stockAgeFilter, categories: value as string[] })}
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
                <span style={{ color: '#86909c', marginLeft: 16 }}>区域:</span>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="全部"
                  style={{ width: 200 }}
                  value={stockAgeFilter.zones}
                  onChange={(value) => setStockAgeFilter({ ...stockAgeFilter, zones: value as string[] })}
                >
                  {zones.map((zone) => (
                    <Select.Option key={zone} value={zone}>
                      {zone}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title="总库存数量"
                    value={stockAgeData.totalQuantity}
                    suffix="件"
                    style={{ color: '#3498db' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title="总库存金额"
                    value={stockAgeData.totalAmount}
                    suffix="元"
                    precision={2}
                    style={{ color: '#ff7d00' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title="超龄商品数量"
                    value={stockAgeData.overageQuantity}
                    suffix={`件 (${stockAgeData.overageQuantityRatio}%)`}
                    style={{ color: '#e74c3c' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title="超龄商品金额"
                    value={stockAgeData.overageAmount}
                    suffix={`元 (${stockAgeData.overageAmountRatio}%)`}
                    precision={2}
                    style={{ color: '#e67e22' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={16}>
                <Card title="库龄分布（按数量/金额）" className="chart-container">
                  <ReactECharts option={stockAgeBarOption} style={{ height: '400px' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="超龄商品占比" className="chart-container">
                  <ReactECharts option={overagePieOption} style={{ height: '400px' }} />
                </Card>
              </Col>
            </Row>

            <Card
              title={`超龄商品列表（90天以上）- 共 ${overageItems.length} 条记录`}
              extra={
                <Button type="primary" status="danger" onClick={handleExport}>
                  一键导出
                </Button>
              }
            >
              <Table
                columns={columns}
                data={overageItems}
                pagination={{
                  pageSize: 10,
                  showTotal: true,
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
