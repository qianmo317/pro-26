import { Card, Grid, Tabs, DatePicker, Select, Table, Button, Statistic, Tag, Space, Message, Tooltip } from '@arco-design/web-react';
import ReactECharts from 'echarts-for-react';
import { useState, useMemo } from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import type { StockAgeFilter, ABCAnalysisFilter, ABCAnalysisItem, ABCClass } from '../types';
import { IconDownload } from '@arco-design/web-react/icon';

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

  const [abcDateRange, setAbcDateRange] = useState<[string, string] | undefined>(undefined);
  const [abcFilter, setAbcFilter] = useState<ABCAnalysisFilter>({
    categories: [],
    abcClasses: [],
  });

  const { getABCAnalysisData, exportABCAnalysis } = useWarehouseStore();
  const abcCategories = getCategories();

  const abcData = useMemo(() => {
    const [startDate, endDate] = abcDateRange || [undefined, undefined];
    return getABCAnalysisData(startDate, endDate, abcFilter);
  }, [abcDateRange, abcFilter, getABCAnalysisData]);

  const abcScatterOption = useMemo(() => {
    const classColors: Record<ABCClass, string> = {
      A: '#e74c3c',
      B: '#f39c12',
      C: '#27ae60',
    };

    const seriesData: Record<ABCClass, Array<[number, number, ABCAnalysisItem]>> = {
      A: [],
      B: [],
      C: [],
    };

    abcData.items.forEach((item) => {
      seriesData[item.abcClass].push([item.totalTransactionCount, item.totalAmount, item]);
    });

    const series = (['A', 'B', 'C'] as const).map((abcClass) => ({
      name: `${abcClass}类`,
      type: 'scatter',
      data: seriesData[abcClass],
      symbolSize: (data: [number, number, ABCAnalysisItem]) => {
        const size = Math.max(15, Math.min(40, data[2].amountRatio * 3 + 15));
        return size;
      },
      itemStyle: {
        color: classColors[abcClass],
        opacity: 0.7,
      },
      emphasis: {
        itemStyle: {
          opacity: 1,
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: { data: [number, number, ABCAnalysisItem] }) => {
          const item = params.data[2];
          return `
            <div style="font-weight: bold; margin-bottom: 8px;">${item.productName} (${item.productSku})</div>
            <div>ABC分类: <span style="color: ${classColors[item.abcClass]}; font-weight: bold;">${item.abcClass}类</span></div>
            <div>类别: ${item.category}</div>
            <div>库存金额: ${item.totalAmount.toLocaleString()} 元 (${item.amountRatio}%)</div>
            <div>出入库频次: ${item.totalTransactionCount} 次 (${item.frequencyRatio}%)</div>
            <div>金额维度: ${item.amountClass}类 | 频次维度: ${item.frequencyClass}类</div>
          `;
        },
      },
      legend: {
        data: ['A类', 'B类', 'C类'],
        top: 0,
        formatter: (name: string) => {
          const classDesc: Record<string, string> = {
            'A类': 'A类 - 重点管理（高价值/高频）',
            'B类': 'B类 - 一般管理（中价值/中频）',
            'C类': 'C类 - 粗放管理（低价值/低频）',
          };
          return classDesc[name] || name;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '出入库频次（次）',
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '库存金额（元）',
        nameLocation: 'middle',
        nameGap: 50,
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      series,
    };
  }, [abcData]);

  const abcColumns = [
    {
      title: 'ABC分类',
      dataIndex: 'abcClass',
      width: 100,
      fixed: 'left' as const,
      render: (value: ABCClass) => {
        const colorMap: Record<ABCClass, string> = { A: 'red', B: 'orange', C: 'green' };
        const descMap: Record<ABCClass, string> = { A: 'A类-重点', B: 'B类-一般', C: 'C类-粗放' };
        return <Tag color={colorMap[value]}>{descMap[value]}</Tag>;
      },
    },
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
      title: '单价(元)',
      dataIndex: 'price',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '库存数量',
      dataIndex: 'totalQuantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '库存金额(元)',
      dataIndex: 'totalAmount',
      width: 130,
      align: 'right' as const,
      sorter: (a: ABCAnalysisItem, b: ABCAnalysisItem) => a.totalAmount - b.totalAmount,
      render: (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: '金额占比(%)',
      dataIndex: 'amountRatio',
      width: 110,
      align: 'right' as const,
      render: (value: number, record: ABCAnalysisItem) => (
        <div>
          <div>{value.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#86909c' }}>累计: {record.cumulativeAmountRatio.toFixed(2)}%</div>
        </div>
      ),
    },
    {
      title: '入库次数',
      dataIndex: 'inboundCount',
      width: 90,
      align: 'right' as const,
    },
    {
      title: '出库次数',
      dataIndex: 'outboundCount',
      width: 90,
      align: 'right' as const,
    },
    {
      title: '总频次',
      dataIndex: 'totalTransactionCount',
      width: 90,
      align: 'right' as const,
      sorter: (a: ABCAnalysisItem, b: ABCAnalysisItem) => a.totalTransactionCount - b.totalTransactionCount,
    },
    {
      title: '频次占比(%)',
      dataIndex: 'frequencyRatio',
      width: 110,
      align: 'right' as const,
      render: (value: number, record: ABCAnalysisItem) => (
        <div>
          <div>{value.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#86909c' }}>累计: {record.cumulativeFrequencyRatio.toFixed(2)}%</div>
        </div>
      ),
    },
    {
      title: '分类维度',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: ABCAnalysisItem) => (
        <Space>
          <Tag color={record.amountClass === 'A' ? 'red' : record.amountClass === 'B' ? 'orange' : 'green'}>
            金额:{record.amountClass}
          </Tag>
          <Tag color={record.frequencyClass === 'A' ? 'red' : record.frequencyClass === 'B' ? 'orange' : 'green'}>
            频次:{record.frequencyClass}
          </Tag>
        </Space>
      ),
    },
  ];

  const handleABCExport = () => {
    if (abcData.items.length === 0) {
      Message.warning('没有数据可导出');
      return;
    }
    exportABCAnalysis(abcData);
    Message.success('ABC分析报表导出成功');
  };

  const handleABCFilterChange = (field: keyof ABCAnalysisFilter, value: string[]) => {
    setAbcFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
        <TabPane key="abc" title="ABC分析">
          <Card
            title="ABC 分类分析"
            extra={
              <Space>
                <span style={{ color: '#86909c' }}>分析时间段:</span>
                <RangePicker
                  style={{ width: 280 }}
                  placeholder={['开始日期', '结束日期']}
                  value={abcDateRange}
                  onChange={(value) => setAbcDateRange(value as [string, string] | undefined)}
                />
                <span style={{ color: '#86909c', marginLeft: 16 }}>商品类别:</span>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="全部"
                  style={{ width: 200 }}
                  value={abcFilter.categories}
                  onChange={(value) => handleABCFilterChange('categories', value as string[])}
                >
                  {abcCategories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
                <span style={{ color: '#86909c', marginLeft: 16 }}>ABC分类:</span>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="全部"
                  style={{ width: 200 }}
                  value={abcFilter.abcClasses}
                  onChange={(value) => handleABCFilterChange('abcClasses', value as ABCClass[])}
                >
                  <Select.Option value="A">A类 - 重点管理</Select.Option>
                  <Select.Option value="B">B类 - 一般管理</Select.Option>
                  <Select.Option value="C">C类 - 粗放管理</Select.Option>
                </Select>
              </Space>
            }
          >
            <div style={{ marginBottom: 16, color: '#86909c' }}>
              分析时间范围: <b>{abcData.timeRange.start}</b> 至 <b>{abcData.timeRange.end}</b>
              <span style={{ marginLeft: 24 }}>计算时间: {abcData.calculateTime}</span>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title={<span style={{ color: '#e74c3c' }}>A类商品（重点管理）</span>}
                    value={abcData.summary.classA.count}
                    suffix={`件 (${abcData.summary.classA.countRatio}%)`}
                    style={{ color: '#e74c3c' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>金额占比: <b>{abcData.summary.classA.amountRatio}%</b></div>
                    <div>频次占比: <b>{abcData.summary.classA.frequencyRatio}%</b></div>
                    <div style={{ color: '#86909c', marginTop: 4 }}>建议: 每周盘点，严格控制库存</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title={<span style={{ color: '#f39c12' }}>B类商品（一般管理）</span>}
                    value={abcData.summary.classB.count}
                    suffix={`件 (${abcData.summary.classB.countRatio}%)`}
                    style={{ color: '#f39c12' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>金额占比: <b>{abcData.summary.classB.amountRatio}%</b></div>
                    <div>频次占比: <b>{abcData.summary.classB.frequencyRatio}%</b></div>
                    <div style={{ color: '#86909c', marginTop: 4 }}>建议: 每月盘点，常规库存管理</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title={<span style={{ color: '#27ae60' }}>C类商品（粗放管理）</span>}
                    value={abcData.summary.classC.count}
                    suffix={`件 (${abcData.summary.classC.countRatio}%)`}
                    style={{ color: '#27ae60' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>金额占比: <b>{abcData.summary.classC.amountRatio}%</b></div>
                    <div>频次占比: <b>{abcData.summary.classC.frequencyRatio}%</b></div>
                    <div style={{ color: '#86909c', marginTop: 4 }}>建议: 每季度盘点，简化管理流程</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card bordered>
                  <Statistic
                    title="商品总数"
                    value={abcData.summary.totalProducts}
                    suffix="件"
                    style={{ color: '#3498db' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>总库存金额: <b>{abcData.summary.totalAmount.toLocaleString()}</b> 元</div>
                    <div>总出入库频次: <b>{abcData.summary.totalFrequency}</b> 次</div>
                    <div style={{ color: '#86909c', marginTop: 4 }}>
                      分类规则: 累计占比≤70%→A类，≤90%→B类，其余→C类
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card
                  title="商品分布散点图（X轴：出入库频次，Y轴：库存金额，气泡大小：金额占比）"
                  extra={
                    <Tooltip content="点击图例可显示/隐藏对应分类，鼠标悬停气泡可查看详细信息">
                      <Button type="text">使用说明</Button>
                    </Tooltip>
                  }
                  className="chart-container"
                >
                  <ReactECharts option={abcScatterOption} style={{ height: '450px' }} />
                </Card>
              </Col>
            </Row>

            <Card
              title={`ABC 分类明细 - 共 ${abcData.items.length} 条记录`}
              extra={
                <Space>
                  <Tag color="red">A类: 高价值/高频商品，需要重点管理</Tag>
                  <Tag color="orange">B类: 中价值/中频商品，需要一般管理</Tag>
                  <Tag color="green">C类: 低价值/低频商品，可以粗放管理</Tag>
                  <Button
                    type="primary"
                    icon={<IconDownload />}
                    onClick={handleABCExport}
                  >
                    导出报表
                  </Button>
                </Space>
              }
            >
              <Table
                columns={abcColumns}
                data={abcData.items}
                pagination={{
                  pageSize: 10,
                  showTotal: true,
                }}
                scroll={{ x: 1400 }}
                rowClassName={(record: ABCAnalysisItem) => {
                  const classBg: Record<ABCClass, string> = {
                    A: 'table-row-class-a',
                    B: 'table-row-class-b',
                    C: 'table-row-class-c',
                  };
                  return classBg[record.abcClass];
                }}
              />
            </Card>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
