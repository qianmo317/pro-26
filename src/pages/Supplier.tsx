import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { Supplier } from '../types';

interface SupplierFormValues {
  code: string;
  companyName: string;
  contact: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  creditRating: 'A' | 'B' | 'C' | 'D';
}

const FormItem = Form.Item;
const { Option } = Select;

export default function Supplier() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditRatingFilter, setCreditRatingFilter] = useState<string>('all');
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } =
    useWarehouseStore();

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const statusMatch = statusFilter === 'all' || s.status === statusFilter;
      const ratingMatch =
        creditRatingFilter === 'all' || s.creditRating === creditRatingFilter;
      return statusMatch && ratingMatch;
    });
  }, [suppliers, statusFilter, creditRatingFilter]);

  const columns = [
    {
      title: '供应商编码',
      dataIndex: 'code',
      width: 140,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '地址',
      dataIndex: 'address',
    },
    {
      title: '合作状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '正常合作' },
          inactive: { color: 'gray', text: '已停用' },
        };
        const s = statusMap[status] || { color: 'gray', text: '未知' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '信用评级',
      dataIndex: 'creditRating',
      width: 100,
      render: (rating: string) => {
        const colorMap: Record<string, string> = {
          A: 'green',
          B: 'blue',
          C: 'orange',
          D: 'red',
        };
        return <Tag color={colorMap[rating] || 'gray'}>{rating}级</Tag>;
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
    },
    {
      title: '操作',
      width: 180,
      render: (_: unknown, record: Supplier) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            content="确定要删除该供应商吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" status="danger" icon={<IconDelete />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteSupplier(id);
    toast.success('删除成功');
  };

  const handleSubmit = (values: SupplierFormValues) => {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, values);
      toast.success('更新成功');
    } else {
      const newSupplier: Supplier = {
        id: String(Date.now()),
        code: values.code,
        companyName: values.companyName,
        contact: values.contact,
        phone: values.phone,
        address: values.address,
        status: values.status,
        creditRating: values.creditRating,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
      };
      addSupplier(newSupplier);
      toast.success('创建成功');
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>合作状态：</span>
            <Select
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部</Option>
              <Option value="active">正常合作</Option>
              <Option value="inactive">已停用</Option>
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666' }}>信用评级：</span>
            <Select
              style={{ width: 140 }}
              value={creditRatingFilter}
              onChange={setCreditRatingFilter}
            >
              <Option value="all">全部</Option>
              <Option value="A">A级</Option>
              <Option value="B">B级</Option>
              <Option value="C">C级</Option>
              <Option value="D">D级</Option>
            </Select>
          </div>
        </div>
        <div>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增供应商
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredSuppliers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingSupplier ? '编辑供应商' : '新增供应商'}
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem
              label="供应商编码"
              field="code"
              rules={[{ required: true, message: '请输入供应商编码' }]}
            >
              <Input placeholder="请输入供应商编码" />
            </FormItem>
            <FormItem
              label="公司名称"
              field="companyName"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input placeholder="请输入公司名称" />
            </FormItem>
            <FormItem
              label="联系人"
              field="contact"
              rules={[{ required: true, message: '请输入联系人' }]}
            >
              <Input placeholder="请输入联系人" />
            </FormItem>
            <FormItem
              label="联系电话"
              field="phone"
              rules={[
                { required: true, message: '请输入联系电话' },
                {
                  match: /^1[3-9]\d{9}$/,
                  message: '请输入正确的手机号码',
                },
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </FormItem>
            <FormItem
              label="合作状态"
              field="status"
              rules={[{ required: true, message: '请选择合作状态' }]}
              initialValue="active"
            >
              <Select placeholder="请选择合作状态">
                <Option value="active">正常合作</Option>
                <Option value="inactive">已停用</Option>
              </Select>
            </FormItem>
            <FormItem
              label="信用评级"
              field="creditRating"
              rules={[{ required: true, message: '请选择信用评级' }]}
              initialValue="B"
            >
              <Select placeholder="请选择信用评级">
                <Option value="A">A级 - 优秀</Option>
                <Option value="B">B级 - 良好</Option>
                <Option value="C">C级 - 一般</Option>
                <Option value="D">D级 - 较差</Option>
              </Select>
            </FormItem>
          </div>
          <FormItem
            label="地址"
            field="address"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="请输入详细地址" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
