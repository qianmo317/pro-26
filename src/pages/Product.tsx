import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
} from '@arco-design/web-react';
import { IconEdit, IconSearch } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { Product } from '../types';

const FormItem = Form.Item;
const { Option } = Select;
const Search = Input.Search;

interface ProductFormValues {
  safetyStockMin: number;
  safetyStockMax: number;
}

export default function Product() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { products, updateProductSafetyStock, getInventorySummary } = useWarehouseStore();

  const inventorySummary = useMemo(() => getInventorySummary(), [getInventorySummary]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, searchText, categoryFilter]);

  const getStockStatus = (productId: string) => {
    const summary = inventorySummary.find((s) => s.productId === productId);
    return summary?.stockStatus || 'normal';
  };

  const getTotalQuantity = (productId: string) => {
    const summary = inventorySummary.find((s) => s.productId === productId);
    return summary?.totalQuantity || 0;
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 120,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '品类',
      dataIndex: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
    },
    {
      title: '单价',
      dataIndex: 'price',
      width: 100,
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '当前库存',
      width: 100,
      render: (_: unknown, record: Product) => {
        const status = getStockStatus(record.id);
        const qty = getTotalQuantity(record.id);
        let color = '#333';
        if (status === 'low') color = '#ee4d4d';
        else if (status === 'overstock') color = '#ff7d00';
        return <span style={{ color, fontWeight: 600 }}>{qty}</span>;
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
      width: 100,
      render: (_: unknown, record: Product) => {
        const status = getStockStatus(record.id);
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
      title: '操作',
      width: 120,
      render: (_: unknown, record: Product) => (
        <Button
          type="text"
          size="small"
          icon={<IconEdit />}
          onClick={() => handleEdit(record)}
        >
          设置库存
        </Button>
      ),
    },
  ];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      safetyStockMin: product.safetyStockMin,
      safetyStockMax: product.safetyStockMax,
    });
    setModalVisible(true);
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (!editingProduct) return;
    if (values.safetyStockMin >= values.safetyStockMax) {
      toast.error('安全库存下限必须小于上限');
      return;
    }
    updateProductSafetyStock(editingProduct.id, values.safetyStockMin, values.safetyStockMax);
    toast.success('安全库存设置成功');
    setModalVisible(false);
    form.resetFields();
  };

  return (
    <div>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Search
            placeholder="搜索商品名称/SKU"
            style={{ width: 280 }}
            value={searchText}
            onChange={setSearchText}
            searchButton={<IconSearch />}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>品类：</span>
            <Select style={{ width: 140 }} value={categoryFilter} onChange={setCategoryFilter}>
              <Option value="all">全部</Option>
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredProducts}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? `设置安全库存 - ${editingProduct.name}` : '设置安全库存'}
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 500 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem
              label="安全库存下限"
              field="safetyStockMin"
              rules={[
                { required: true, message: '请输入安全库存下限' },
                { type: 'number', min: 0, message: '库存下限不能小于0' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入下限" min={0} />
            </FormItem>
            <FormItem
              label="安全库存上限"
              field="safetyStockMax"
              rules={[
                { required: true, message: '请输入安全库存上限' },
                { type: 'number', min: 1, message: '库存上限不能小于1' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入上限" min={1} />
            </FormItem>
          </div>
          <div style={{ color: '#86909c', fontSize: '12px', marginTop: '8px' }}>
            提示：当库存低于下限时会标红预警，高于上限时会标黄提示积压。
          </div>
        </Form>
      </Modal>
    </div>
  );
}
