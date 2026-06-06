import { useState } from 'react';
import { Grid, Card, Table, Tag, Radio } from '@arco-design/web-react';
import {
  IconImport,
  IconExport,
  IconStorage,
  IconPlus,
  IconExclamation,
  IconInfoCircle,
  IconFire,
  IconMinus,
  IconArrowRight,
} from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { HeatmapDimension } from '../types';

const Row = Grid.Row;
const Col = Grid.Col;
const { Group } = Radio;

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
    getTopActiveLocations,
    getTopInactiveLocations,
  } = useWarehouseStore();

  const [rankDimension, setRankDimension] = useState<HeatmapDimension>('total');

  const lowStockCount = getLowStockCount();
  const overstockCount = getOverstockCount();

  const pendingInboundCount = inboundOrders.filter((o) => o.status === 'pending').length;
  const pendingOutboundCount = outboundOrders.filter((o) => o.status === 'pending').length;
  const pendingStocktakeCount = stocktakePlans.filter((p) => p.status === 'pending').length;

  const taskCards = [
    {
      title: '待处理入库',
      count: pendingInboundCount,
      type: 'inbound' as const,
      icon: <IconImport style={{ fontSize: '32px' }} />,
      color: '#ff7d00',
      bgColor: 'rgba(255, 125, 0, 0.1)',
      borderColor: 'rgba(255, 125, 0, 0.3)',
      page: '/inbound',
    },
    {
      title: '待处理出库',
      count: pendingOutboundCount,
      type: 'outbound' as const,
      icon: <IconExport style={{ fontSize: '32px' }} />,
      color: '#27ae60',
      bgColor: 'rgba(39, 174, 96, 0.1)',
      borderColor: 'rgba(39, 174, 96, 0.3)',
      page: '/outbound',
    },
    {
      title: '待处理盘点',
      count: pendingStocktakeCount,
      type: 'stocktake' as const,
      icon: <IconPlus style={{ fontSize: '32px' }} />,
      color: '#3498db',
      bgColor: 'rgba(52, 152, 219, 0.1)',
      borderColor: 'rgba(52, 152, 219, 0.3)',
      page: '/stocktake',
    },
  ];

  const handleTaskClick = (page: string) => {
    navigate(page);
  };

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
        <Col span={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconExclamation style={{ color: '#ff7d00' }} />
                <span>待处理任务</span>
              </div>
            }
            className="chart-container"
          >
            <Row gutter={16}>
              {taskCards.map((card, index) => (
                <Col span={8} key={index}>
                  <div
                    onClick={() => handleTaskClick(card.page)}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: card.bgColor,
                      border: `1px solid ${card.borderColor}`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '-20px',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: card.color,
                        opacity: 0.1,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                          {card.title}
                        </div>
                        <div
                          style={{
                            color: card.color,
                            fontSize: '40px',
                            fontWeight: '700',
                            lineHeight: '1.2',
                          }}
                        >
                          {card.count}
                        </div>
                        <div
                          style={{
                            marginTop: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '13px',
                            color: card.color,
                            fontWeight: '500',
                          }}
                        >
                          <span>点击查看</span>
                          <IconArrowRight style={{ fontSize: '14px' }} />
                        </div>
                      </div>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: card.color,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      >
                        {card.icon}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
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

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>库位活跃度排行榜</span>
                <Group value={rankDimension} onChange={setRankDimension} type="button" size="small">
                  <Radio value="total">总频次</Radio>
                  <Radio value="inbound">入库</Radio>
                  <Radio value="outbound">出库</Radio>
                </Group>
              </div>
            }
            className="chart-container"
          >
            <Row gutter={16}>
              <Col span={12}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'linear-gradient(90deg, rgba(255, 125, 0, 0.1), transparent)',
                    borderRadius: '8px',
                  }}
                >
                  <IconFire style={{ fontSize: '20px', color: '#ff7d00' }} />
                  <span style={{ fontWeight: '600', color: '#ff7d00' }}>最活跃库位 TOP10</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {getTopActiveLocations(rankDimension, 10).map((loc, index) => (
                    <div
                      key={loc.locationId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: index < 3 ? 'rgba(255, 125, 0, 0.05)' : '#fafafa',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 125, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index < 3 ? 'rgba(255, 125, 0, 0.05)' : '#fafafa';
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background:
                            index === 0
                              ? 'linear-gradient(135deg, #ffd700, #ffb800)'
                              : index === 1
                              ? 'linear-gradient(135deg, #c0c0c0, #a0a0a0)'
                              : index === 2
                              ? 'linear-gradient(135deg, #cd7f32, #a0522d)'
                              : '#e0e0e0',
                          color: index < 3 ? '#fff' : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{loc.locationCode}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{loc.zone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', color: '#ff7d00', fontSize: '16px' }}>
                          {rankDimension === 'inbound'
                            ? loc.inboundCount
                            : rankDimension === 'outbound'
                            ? loc.outboundCount
                            : loc.totalCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>次</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.1), transparent)',
                    borderRadius: '8px',
                  }}
                >
                  <IconMinus style={{ fontSize: '20px', color: '#3498db' }} />
                  <span style={{ fontWeight: '600', color: '#3498db' }}>最冷门库位 TOP10</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {getTopInactiveLocations(rankDimension, 10).map((loc, index) => (
                    <div
                      key={loc.locationId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        background: index < 3 ? 'rgba(52, 152, 219, 0.05)' : '#fafafa',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 152, 219, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index < 3 ? 'rgba(52, 152, 219, 0.05)' : '#fafafa';
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background:
                            index === 0
                              ? 'linear-gradient(135deg, #3498db, #2980b9)'
                              : index === 1
                              ? 'linear-gradient(135deg, #5dade2, #3498db)'
                              : index === 2
                              ? 'linear-gradient(135deg, #85c1e9, #5dade2)'
                              : '#e0e0e0',
                          color: index < 3 ? '#fff' : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '12px',
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{loc.locationCode}</div>
                        <div style={{ fontSize: '11px', color: '#999' }}>{loc.zone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', color: '#3498db', fontSize: '16px' }}>
                          {rankDimension === 'inbound'
                            ? loc.inboundCount
                            : rankDimension === 'outbound'
                            ? loc.outboundCount
                            : loc.totalCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999' }}>次</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
