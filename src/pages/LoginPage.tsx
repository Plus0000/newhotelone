import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/shared/stores/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      // 先尝试登录
      let ok = await login(values.email, values.password);
      if (ok) {
        message.success('登录成功');
        navigate('/projects');
        return;
      }

      // 登录失败 → 尝试注册（自动创建账号）
      ok = await register(values.email, values.password);
      if (ok) {
        message.success('注册成功');
        navigate('/projects');
      } else {
        message.error('密码错误');
      }
    } catch {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-welcome">
          <div className="login-welcome-title">欢迎使用</div>
          <div className="login-welcome-sub">医院建筑节能方案助手</div>
        </div>

        <Form name="login" onFinish={onFinish} size="large" className="login-form">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（至少6位）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="login-btn">
              进 入
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 12 }}>
          首次使用将自动创建账号
        </div>
      </div>
    </div>
  );
}
