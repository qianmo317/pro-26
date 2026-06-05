import { Grid, Card, Table, Tag } from '@arco-design/web-react';
import { IconImport, IconExport, IconStorage, IconPlus, IconExclamation, IconInfoCircle } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';

const Row = Grid.Row;
const Col = Grid.Col;

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    locations,
    inventory,
    inboundOrders,
    outboundOrders,
    stocktakePlans,
    reportData,
    getLowStockCount,
    getOverstockCount,
  } = useWarehouseStore();

  const lowStockCount = getLowStockCount();
  const overstockCount = getOverstockCount();

  const statCards = [
    {
      title: '库位总数',
      value: locations.length,
      icon: <IconStorage />,
      type: 'primary',
      subValue: `空闲 ${locations.filter((l) => l.status === 'empty').length} 个`,
    },
    {
      title: 'SKU 总数',
      value: inventory.length,
      icon: <IconPlus />,
      type: 'success',
      subValue: `共 ${new Set(inventory.map((i) => i.productId)).size} 种商品`,
    },
    {
      title: '待处理入库',
      value: inboundOrders.filter((o) => o.status === 'pending').length,
      icon: <IconImport />,
      type: 'warning',
      subValue: `进行中 ${inboundOrders.filter((o) => o.status === 'in_progress').length} 单`,
    },
    {
      title: '待处理出库',
      value: outboundOrders.filter((o) => o.status === 'pending').length,
      icon: <IconExport />,
      type: 'info',
      subValue: `进行中 ${outboundOrders.filter((o) => o.status === 'in_progress').length} 单`,
    },
  ];

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['入库', '出库'],
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
        name: '入库',
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
              { offset: 0, color: 'rgba(255, 125, 0, 0.3)' },
              { offset: 1, color: 'rgba(255, 125, 0, 0.05)' },
            ],
          },
        },
      },
      {
        name: '出库',
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
              { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
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
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '品类分布',
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
            fontSize: 20,
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

  const recentOrdersColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 140,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (text: string) => (
        <Tag color={text === '入库' ? 'orange' : 'green'}>{text}</Tag>
      ),
    },
    {
      title: '往来单位',
      dataIndex: 'partner',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (text: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待处理' },
          in_progress: { color: 'blue', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const status = statusMap[text] || { color: 'gray', text: '未知' };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
    },
  ];

  const recentOrders = [
    ...inboundOrders.slice(0, 3).map((o) => ({
      ...o,
      type: '入库',
      partner: o.supplier,
      key: `in-${o.id}`,
    })),
    ...outboundOrders.slice(0, 3).map((o) => ({
      ...o,
      type: '出库',
      partner: o.customer,
      key: `out-${o.id}`,
    })),
  ].sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

  const handleLowStockClick = () => {
    navigate('/inventory?status=low');
  };

  const handleOverstockClick = () => {
    navigate('/inventory?status=overstock');
  };

  return (
    <div>
      <Row gutter={16}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <div className={`stat-card ${card.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{card.title}</div>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#333' }}>{card.value}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>{card.subValue}</div>
                </div>
                <div className={`stat-icon ${card.type}`}>{card.icon}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <div
            className="stat-card danger"
            onClick={handleLowStockClick}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>库存不足预警</div>
                <div style={{ fontSize: '32px', fontWeight: '600', color: '#ee4d4d' }}>{lowStockCount}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  低于安全库存下限的商品数量
                </div>
              </div>
              <div className="stat-icon danger">
                <IconExclamation style={{ fontSize: '32px' }} />
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#ee4d4d' }}>点击查看详情 →</span>
            </div>
          </div>
        </Col>
        <Col span={12}>
          <div
            className="stat-card warning"
            onClick={handleOverstockClick}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>库存积压预警</div>
                <div style={{ fontSize: '32px', fontWeight: '600', color: '#ff7d00' }}>{overstockCount}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  高于安全库存上限的商品数量
                </div>
              </div>
              <div className="stat-icon warning">
                <IconInfoCircle style={{ fontSize: '32px' }} />
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#ff7d00' }}>点击查看详情 →</span>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={16}>
          <Card title="出入库趋势" className="chart-container">
            <ReactECharts option={trendChartOption} style={{ height: '300px' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="库存品类分布" className="chart-container">
            <ReactECharts option={categoryChartOption} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="最近订单" className="chart-container">
            <Table
              columns={recentOrdersColumns}
              data={recentOrders.slice(0, 5)}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card title="进行中的盘点" className="chart-container">
            {stocktakePlans.filter((p) => p.status === 'in_progress').length > 0 ? (
              stocktakePlans
                .filter((p) => p.status === 'in_progress')
                .map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{plan.name}</span>
                      <Tag color="blue">进行中</Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      盘点项: {plan.items.filter((i) => i.status === 'counted').length} / {plan.items.length}
                    </div>
                    <div style={{ marginTop: '8px', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #ff7d00, #ff9500)',
                          width: `${(plan.items.filter((i) => i.status === 'counted').length / plan.items.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无进行中的盘点任务</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="库位利用率" className="chart-container">
            <ReactECharts
              option={{
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
                      borderRadius: [4, 4, 0, 0],
                    },
                    label: {
                      show: true,
                      position: 'top',
                      formatter: '{c}%',
                    },
                  },
                ],
              }}
              style={{ height: '280px' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
