import { useState } from 'react';
import { Table, Input, Select, Card, Space, Button, Tag } from '@arco-design/web-react';
import { IconSearch, IconRefresh } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';

const { Option } = Select;
const Search = Input.Search;

export default function Inventory() {
  const { inventory, products, locations } = useWarehouseStore();
  const [searchText, setSearchText] = useState('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');

  const filteredData = inventory.filter((item) => {
    const matchSearch =
      item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.productSku.toLowerCase().includes(searchText.toLowerCase()) ||
      item.locationCode.toLowerCase().includes(searchText.toLowerCase());
    const matchProduct = !filterProduct || item.productId === filterProduct;
    const matchLocation = !filterLocation || item.locationId === filterLocation;
    return matchSearch && matchProduct && matchLocation;
  });

  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 180,
      sorter: (a: any, b: any) => a.productName.localeCompare(b.productName),
    },
    {
      title: 'SKU',
      dataIndex: 'productSku',
      width: 120,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      width: 100,
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      width: 140,
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      width: 120,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      render: (time: string) => {
        try {
          return new Date(time).toLocaleString();
        } catch {
          return time;
        }
      },
    },
  ];

  const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space size="large">
          <Search
            placeholder="搜索商品名称/SKU/库位"
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
            placeholder="筛选库位"
            style={{ width: 150 }}
            value={filterLocation}
            onChange={setFilterLocation}
            allowClear
          >
            {locations.slice(0, 50).map((l) => (
              <Option key={l.id} value={l.id}>
                {l.code}
              </Option>
            ))}
          </Select>
          <Button icon={<IconRefresh />} onClick={() => {
            setSearchText('');
            setFilterProduct('');
            setFilterLocation('');
          }}>
            重置
          </Button>
        </Space>
      </Card>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ color: '#666' }}>
          共找到 <span style={{ color: '#ff7d00', fontWeight: '600' }}>{filteredData.length}</span> 条记录，
          合计库存 <span style={{ color: '#ff7d00', fontWeight: '600' }}>{totalQuantity}</span> 件
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showTotal: true,
            showJumper: true,
          }}
        />
      </Card>
    </div>
  );
}
