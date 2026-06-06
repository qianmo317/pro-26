import { useState, useEffect } from 'react';
import { Form, Input, Button } from '@arco-design/web-react';
import { IconUser, IconLock, IconApps } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/Toast';

const FormItem = Form.Item;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '登录 - WMS 仓库管理系统';
  }, []);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    const success = await login(values.username, values.password);
    setLoading(false);
    if (success) {
      toast.success('登录成功！');
      navigate('/dashboard');
    } else {
      toast.error('用户名或密码错误！');
    }
  };

  return (
    <div className="login-container industrial-bg">
      <div className="gear-pattern" style={{ top: '10%', left: '10%' }}>
        ⚙
      </div>
      <div className="gear-pattern" style={{ bottom: '10%', right: '10%' }}>
        ⚙
      </div>
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ff7d00' }}>
            <IconApps />
          </div>
          <h1>仓库管理系统</h1>
          <p>Industrial Warehouse Management System</p>
        </div>
        <Form layout="vertical" onSubmit={handleSubmit}>
          <FormItem
            field="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
            initialValue="admin"
          >
            <Input
              prefix={<IconUser />}
              placeholder="请输入用户名"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </FormItem>
          <FormItem
            field="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
            initialValue="admin123"
          >
            <Input.Password
              prefix={<IconLock />}
              placeholder="请输入密码"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              long
              loading={loading}
              style={{
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px',
              }}
            >
              登 录
            </Button>
          </FormItem>
        </Form>
        <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '24px' }}>
          <p style={{ margin: '4px 0' }}>管理员: admin / admin123 (有复核权限)</p>
          <p style={{ margin: '4px 0' }}>经理: manager / manager123 (有复核权限)</p>
          <p style={{ margin: '4px 0' }}>操作员: operator / operator123 (无复核权限)</p>
        </div>
      </div>
    </div>
  );
}
