import { Card, Grid, Tabs, DatePicker } from '@arco-design/web-react';
import ReactECharts from 'echarts-for-react';
import { useWarehouseStore } from '../store/warehouseStore';

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
      </Tabs>
    </div>
  );
}
