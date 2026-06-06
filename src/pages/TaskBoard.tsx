import { useState, useMemo } from 'react';
import { Card, Tag, Modal, Table, Statistic, Progress, Space, Empty, Button } from '@arco-design/web-react';
import { IconImport, IconExport, IconPlus, IconUser } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { Task, TaskStatus, InboundOrder, OutboundOrder, StocktakePlan, InboundItem, OutboundItem, StocktakeItem } from '../types';

const taskTypeConfig: Record<Task['type'], { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  inbound: {
    label: '入库',
    color: '#ff7d00',
    bgColor: '#fff7e6',
    icon: <IconImport />,
  },
  outbound: {
    label: '出库',
    color: '#27ae60',
    bgColor: '#e8f8f0',
    icon: <IconExport />,
  },
  stocktake: {
    label: '盘点',
    color: '#3498db',
    bgColor: '#e8f4fc',
    icon: <IconPlus />,
  },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'red' },
};

const columns: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export default function TaskBoard() {
  const { getTasks, getTaskStats, updateTaskStatus, getTaskDetail } = useWarehouseStore();
  const tasks = getTasks();
  const stats = getTaskStats();

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailData, setDetailData] = useState<{
    order: InboundOrder | OutboundOrder | StocktakePlan | null;
    items: (InboundItem | OutboundItem | StocktakeItem)[];
  } | null>(null);

  const columnTasks = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }

    try {
      updateTaskStatus(draggedTask.id, draggedTask.type, newStatus);
      toast.success('任务已更新为「' + statusConfig[newStatus].label + '」');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }

    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    const detail = getTaskDetail(task.id, task.type);
    setDetailData(detail);
    setDetailModalVisible(true);
  };

  const renderTaskCard = (task: Task) => {
    const typeConfig = taskTypeConfig[task.type];
    const isDragging = draggedTask?.id === task.id;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onClick={() => handleCardClick(task)}
        style={{
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '8px',
          backgroundColor: 'white',
          borderLeft: '4px solid ' + typeConfig.color,
          cursor: 'pointer',
          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.06)',
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <Tag
            size="small"
            style={{
              backgroundColor: typeConfig.bgColor,
              color: typeConfig.color,
              border: 'none',
              fontWeight: 500,
            }}
          >
            <span style={{ marginRight: '4px' }}>{typeConfig.icon}</span>
            {typeConfig.label}
          </Tag>
          <Tag color={statusConfig[task.status].color} size="small">
            {statusConfig[task.status].label}
          </Tag>
        </div>

        <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '8px', color: '#333' }}>
          {task.title}
        </div>

        <div style={{ fontSize: '12px', color: '#999', fontFamily: 'monospace', marginBottom: '8px' }}>
          {task.orderNo}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          <span>{task.relatedParty}</span>
          <span>{task.itemCount} 项 / {task.totalQuantity} 件</span>
        </div>

        {task.operator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#999' }}>
            <IconUser />
            <span>{task.operator}</span>
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px' }}>
          {task.createTime}
        </div>
      </div>
    );
  };

  const renderDetailContent = () => {
    if (!detailData || !selectedTask) return null;

    const getDetailColumns = () => {
      if (selectedTask.type === 'inbound') {
        const order = detailData.order as InboundOrder;
        const items = detailData.items as InboundItem[];
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Space direction="vertical" size="large">
                <div><strong>供应商：</strong>{order.supplier}</div>
                <div><strong>创建时间：</strong>{order.createTime}</div>
                <div><strong>更新时间：</strong>{order.updateTime}</div>
                <div><strong>操作员：</strong>{order.operator || '-'}</div>
                {order.remark && <div><strong>备注：</strong>{order.remark}</div>}
              </Space>
            </div>
            <Table
              data={items}
              columns={[
                { title: '商品名称', dataIndex: 'productName' },
                { title: 'SKU', dataIndex: 'productSku' },
                { title: '计划数量', dataIndex: 'planQuantity' },
                { title: '实际数量', dataIndex: 'actualQuantity' },
                { title: '库位', dataIndex: 'locationCode' },
                { title: '批次号', dataIndex: 'batchNo' },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        );
      }

      if (selectedTask.type === 'outbound') {
        const order = detailData.order as OutboundOrder;
        const items = detailData.items as OutboundItem[];
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Space direction="vertical" size="large">
                <div><strong>客户：</strong>{order.customer}</div>
                <div><strong>收货地址：</strong>{order.shippingAddress}</div>
                <div><strong>创建时间：</strong>{order.createTime}</div>
                <div><strong>更新时间：</strong>{order.updateTime}</div>
                <div><strong>操作员：</strong>{order.operator || '-'}</div>
                {order.remark && <div><strong>备注：</strong>{order.remark}</div>}
              </Space>
            </div>
            <Table
              data={items}
              columns={[
                { title: '商品名称', dataIndex: 'productName' },
                { title: 'SKU', dataIndex: 'productSku' },
                { title: '计划数量', dataIndex: 'planQuantity' },
                { title: '实际数量', dataIndex: 'actualQuantity' },
                { title: '库位', dataIndex: 'locationCode' },
                { title: '批次号', dataIndex: 'batchNo' },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        );
      }

      if (selectedTask.type === 'stocktake') {
        const plan = detailData.order as StocktakePlan;
        const items = detailData.items as StocktakeItem[];
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Space direction="vertical" size="large">
                <div><strong>盘点类型：</strong>{plan.type === 'full' ? '全盘' : plan.type === 'partial' ? '部分盘点' : '周期盘点'}</div>
                <div><strong>创建时间：</strong>{plan.createTime}</div>
                {plan.startTime && <div><strong>开始时间：</strong>{plan.startTime}</div>}
                {plan.endTime && <div><strong>结束时间：</strong>{plan.endTime}</div>}
                <div><strong>操作员：</strong>{plan.operator || '-'}</div>
                {plan.remark && <div><strong>备注：</strong>{plan.remark}</div>}
              </Space>
            </div>
            <Table
              data={items}
              columns={[
                { title: '商品名称', dataIndex: 'productName' },
                { title: 'SKU', dataIndex: 'productSku' },
                { title: '库位', dataIndex: 'locationCode' },
                { title: '系统数量', dataIndex: 'systemQuantity' },
                { title: '实际数量', dataIndex: 'actualQuantity' },
                {
                  title: '差异数量',
                  dataIndex: 'diffQuantity',
                  render: (value: number) => (
                    <span style={{ color: value > 0 ? '#f53f3f' : value < 0 ? '#00b42a' : '#333' }}>
                      {value > 0 ? '+' + value : value}
                    </span>
                  ),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => (
                    <Tag color={value === 'counted' ? 'green' : value === 'adjusted' ? 'blue' : 'orange'}>
                      {value === 'counted' ? '已盘点' : value === 'adjusted' ? '已调整' : '待盘点'}
                    </Tag>
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        );
      }

      return null;
    };

    return getDetailColumns();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Card bordered={false} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  今日待处理任务
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#ff7d00' }}>
                  {stats.totalPending}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Tag color="#ff7d00" size="small">入库</Tag>
                    <span style={{ fontSize: '14px', color: '#666' }}>{stats.typeBreakdown.inbound} 个</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>({stats.typeRatio.inbound}%)</span>
                  </div>
                  <Progress percent={stats.typeRatio.inbound} color="#ff7d00" size="small" showText={false} />
                </div>

                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Tag color="#27ae60" size="small">出库</Tag>
                    <span style={{ fontSize: '14px', color: '#666' }}>{stats.typeBreakdown.outbound} 个</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>({stats.typeRatio.outbound}%)</span>
                  </div>
                  <Progress percent={stats.typeRatio.outbound} color="#27ae60" size="small" showText={false} />
                </div>

                <div style={{ minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Tag color="#3498db" size="small">盘点</Tag>
                    <span style={{ fontSize: '14px', color: '#666' }}>{stats.typeBreakdown.stocktake} 个</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>({stats.typeRatio.stocktake}%)</span>
                  </div>
                  <Progress percent={stats.typeRatio.stocktake} color="#3498db" size="small" showText={false} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Statistic title="进行中" value={stats.totalInProgress} style={{ color: '#3498db' }} />
              <Statistic title="已完成" value={stats.totalCompleted} style={{ color: '#27ae60' }} />
              <Statistic title="已取消" value={stats.totalCancelled} style={{ color: '#f53f3f' }} />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {columns.map((status) => {
          const config = statusConfig[status];
          const tasksInColumn = columnTasks[status];
          const isDragOver = dragOverColumn === status;

          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
              style={{
                backgroundColor: isDragOver ? '#e6f7ff' : '#f5f7fa',
                borderRadius: '8px',
                padding: '16px',
                minHeight: '400px',
                border: isDragOver ? '2px dashed #3498db' : '2px dashed transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: config.color === 'orange' ? '#ff7d00' : config.color === 'blue' ? '#3498db' : config.color === 'green' ? '#27ae60' : '#f53f3f',
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{config.label}</span>
                </div>
                <Tag color={config.color}>{tasksInColumn.length}</Tag>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', paddingRight: '4px' }}>
                {tasksInColumn.length > 0 ? (
                  tasksInColumn.map((task) => renderTaskCard(task))
                ) : (
                  <Empty description="暂无任务" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedTask && (
              <>
                <Tag
                  style={{
                    backgroundColor: selectedTask ? taskTypeConfig[selectedTask.type].bgColor : 'transparent',
                    color: selectedTask ? taskTypeConfig[selectedTask.type].color : 'inherit',
                    border: 'none',
                  }}
                >
                  {selectedTask ? taskTypeConfig[selectedTask.type].label : ''}
                </Tag>
                <span>{selectedTask?.title}</span>
              </>
            )}
          </div>
        }
        visible={detailModalVisible}
        onOk={() => setDetailModalVisible(false)}
        onCancel={() => setDetailModalVisible(false)}
        style={{ width: 900 }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedTask && (
          <div style={{ marginBottom: '16px', fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
            单号：{selectedTask.orderNo}
          </div>
        )}
        {renderDetailContent()}
      </Modal>
    </div>
  );
}
