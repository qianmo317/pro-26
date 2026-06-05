import { useState, useMemo, useEffect } from 'react';
import { Table, Input, Select, Card, Space, Button, Tag } from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconExclamation, IconInfoCircle } from '@arco-design/web-react/icon';
import { useWarehouseStore, type InventorySummary } from '../store/warehouseStore';
import { useSearchParams } from 'react-router-dom';

const { Option } = Select;
const Search = Input.Search;

export default function Inventory() {
  const { products, getInventorySummary } = useWarehouseStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'low' || status === 'overstock') {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const inventorySummary = useMemo(() => getInventorySummary(), [getInventorySummary]);

  const filteredData = useMemo(() => {
    return inventorySummary.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchText.toLowerCase());
      const matchProduct = !filterProduct || item.productId === filterProduct;
      const matchStatus = statusFilter === 'all' || item.stockStatus === statusFilter;
      return matchSearch && matchProduct && matchStatus;
    });
  }, [inventorySummary, searchText, filterProduct, statusFilter]);

  const columns = [
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

  const totalQuantity = filteredData.reduce((sum, item) => sum + item.totalQuantity, 0);

  const rowClassName = (record: InventorySummary) => {
    if (record.stockStatus === 'low') {
      return 'table-row-danger';
    } else if (record.stockStatus === 'overstock') {
      return 'table-row-warning';
    }
    return '';
  };

  const handleReset = () => {
    setSearchText('');
    setFilterProduct('');
    setStatusFilter('all');
    setSearchParams({});
  };

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space size="large" wrap>
          <Search
            placeholder="搜索商品名称/SKU"
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
          </Select>
          <Button icon={<IconRefresh />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#666' }}>
          共找到 <span style={{ color: '#ff7d00', fontWeight: '600' }}>{filteredData.length}</span> 种商品，
          合计库存 <span style={{ color: '#ff7d00', fontWeight: '600' }}>{totalQuantity}</span> 件
        </div>
        <Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '12px', color: '#666' }}>库存不足</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '12px', color: '#666' }}>库存积压</span>
          </div>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          data={filteredData}
          rowKey="productId"
          rowClassName={rowClassName}
          pagination={{
            pageSize: 20,
            showTotal: true,
            showJumper: true,
          }}
        />
      </Card>

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
    </div>
  );
}
