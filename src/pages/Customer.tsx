import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Tag,
  Popconfirm,
  Tooltip,
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconInfoCircle } from '@arco-design/web-react/icon';
import { useWarehouseStore } from '../store/warehouseStore';
import { toast } from '../components/Toast';
import type { Customer } from '../types';

interface CustomerFormValues {
  code: string;
  companyName: string;
  shippingAddress: string;
  contact: string;
  phone: string;
  paymentTerms: number;
  status: 'active' | 'inactive';
}

const FormItem = Form.Item;
const { Option } = Select;

export default function Customer() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentTermsFilter, setPaymentTermsFilter] = useState<string>('all');
  const { customers, addCustomer, updateCustomer, deleteCustomer, getCustomerStats } =
    useWarehouseStore();

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const statusMatch = statusFilter === 'all' || c.status === statusFilter;
      let termsMatch = true;
      if (paymentTermsFilter !== 'all') {
        const terms = parseInt(paymentTermsFilter);
        termsMatch = c.paymentTerms === terms;
      }
      return statusMatch && termsMatch;
    });
  }, [customers, statusFilter, paymentTermsFilter]);

  const columns = [
    {
      title: '客户编码',
      dataIndex: 'code',
      width: 140,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      render: (text: string, record: Customer) => {
        const stats = getCustomerStats(record.id);
        return (
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              累计出库: <span style={{ color: '#ff7d00', fontWeight: '500' }}>¥{stats.totalOutboundAmount.toLocaleString()}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: '收货地址',
      dataIndex: 'shippingAddress',
      width: 220,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip content={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '账期',
      dataIndex: 'paymentTerms',
      width: 100,
      render: (terms: number) => (
        <Tag color="blue">{terms}天</Tag>
      ),
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
      title: '最近出库',
      dataIndex: 'id',
      width: 180,
      render: (id: string) => {
        const stats = getCustomerStats(id);
        return stats.lastOutboundTime;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_: unknown, record: Customer) => (
        <Space>
          <Tooltip content="查看详情">
            <Button
              type="text"
              size="small"
              icon={<IconInfoCircle />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
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
            content="确定要删除该客户吗？"
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

  const handleViewDetail = (customer: Customer) => {
    const stats = getCustomerStats(customer.id);
    Modal.info({
      title: '客户详情',
      style: { width: 500 },
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>客户编码</div>
            <div style={{ fontWeight: '500' }}>{customer.code}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>公司名称</div>
            <div style={{ fontWeight: '500' }}>{customer.companyName}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系人</div>
            <div style={{ fontWeight: '500' }}>{customer.contact}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>联系电话</div>
            <div style={{ fontWeight: '500' }}>{customer.phone}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>收货地址</div>
            <div style={{ fontWeight: '500' }}>{customer.shippingAddress}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>账期</div>
            <div style={{ fontWeight: '500' }}>{customer.paymentTerms}天</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>合作状态</div>
            <Tag color={customer.status === 'active' ? 'green' : 'gray'}>
              {customer.status === 'active' ? '正常合作' : '已停用'}
            </Tag>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>历史出库总金额</div>
            <div style={{ fontWeight: '500', color: '#ff7d00' }}>¥{stats.totalOutboundAmount.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>最近出库时间</div>
            <div style={{ fontWeight: '500' }}>{stats.lastOutboundTime}</div>
          </div>
        </div>
      ),
    });
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteCustomer(id);
    toast.success('删除成功');
  };

  const handleSubmit = (values: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, values);
      toast.success('更新成功');
    } else {
      const newCustomer: Customer = {
        id: String(Date.now()),
        code: values.code,
        companyName: values.companyName,
        shippingAddress: values.shippingAddress,
        contact: values.contact,
        phone: values.phone,
        paymentTerms: values.paymentTerms,
        status: values.status,
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString(),
      };
      addCustomer(newCustomer);
      toast.success('创建成功');
    }
    setModalVisible(false);
    form.resetFields();
  };

  const paymentTermsOptions = [
    { value: 'all', label: '全部' },
    { value: '15', label: '15天' },
    { value: '30', label: '30天' },
    { value: '45', label: '45天' },
    { value: '60', label: '60天' },
    { value: '90', label: '90天' },
  ];

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
            <span style={{ color: '#666' }}>账期：</span>
            <Select
              style={{ width: 140 }}
              value={paymentTermsFilter}
              onChange={setPaymentTermsFilter}
            >
              {paymentTermsOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增客户
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredCustomers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormItem
              label="客户编码"
              field="code"
              rules={[{ required: true, message: '请输入客户编码' }]}
            >
              <Input placeholder="请输入客户编码，如 CUS001" />
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
              <Input placeholder="请输入联系人姓名" />
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
              label="账期(天)"
              field="paymentTerms"
              rules={[{ required: true, message: '请输入账期' }]}
              initialValue={30}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={365}
                placeholder="请输入账期天数"
              />
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
          </div>
          <FormItem
            label="收货地址"
            field="shippingAddress"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input placeholder="请输入详细收货地址" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
