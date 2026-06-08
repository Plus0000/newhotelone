import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/shared/stores/authStore';
import './LoginPage.css';


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      const ok = login(values.username, values.password);
      setLoading(false);
      if (ok) {
        message.success('登录成功');
        navigate('/projects');
      } else {
        message.error('请输入用户名和密码');
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-welcome">
          <div className="login-welcome-title">
            {tab === 'login' ? '欢迎回来！' : '创建账号'}
          </div>
          <div className="login-welcome-sub">
            {tab === 'login' ? '请登录您的账号以继续使用' : '注册新账号开始使用'}
          </div>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            登录
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => setTab('register')}
          >
            注册
          </button>
          <div className={`login-tab-underline ${tab === 'login' ? 'left' : 'right'}`} />
        </div>

        <Form name="login" onFinish={onFinish} size="large" className="login-form">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          {tab === 'register' && (
            <Form.Item name="confirmPassword" rules={[{ required: true, message: '请确认密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="login-btn">
              {tab === 'login' ? '登 录' : '注 册'}
            </Button>
          </Form.Item>
        </Form>

        {tab === 'login' && (
          <div className="login-extra">
            <a className="login-link">忘记密码？</a>
          </div>
        )}
      </div>
    </div>
  );
}
