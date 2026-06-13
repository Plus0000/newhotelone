import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/shared/stores/authStore';
import './LoginPage.css';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string; username?: string }) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(values.email, values.password);
        if (result === 'success') {
          message.success('登录成功');
          navigate('/projects');
        } else if (result === 'not_found') {
          message.error('用户不存在，请先注册');
        } else {
          message.error(values.email.includes('@') ? '邮箱或密码错误' : '用户名或密码错误');
        }
      } else {
        if (await register(values.username!, values.email, values.password)) {
          message.success('注册成功');
          navigate('/projects');
        } else {
          message.error('注册失败，请稍后重试');
        }
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

        <div className="login-tabs">
          <button type="button" className={`login-tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>
            登录
          </button>
          <button type="button" className={`login-tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>
            注册
          </button>
          <div className={`login-tab-underline ${mode === 'login' ? 'left' : 'right'}`} />
        </div>

        <Form name="login" onFinish={onFinish} size="large" className="login-form" key={mode}>
          {mode === 'register' && (
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2位' },
                { pattern: /^[a-zA-Z0-9一-龥_-]+$/, message: '用户名只能包含中英文、数字、下划线和连字符' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
          )}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: mode === 'register' ? '请输入邮箱' : '请输入用户名或邮箱' },
              ...(mode === 'register' ? [{ type: 'email' as const, message: '请输入有效的邮箱地址' }] : []),
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder={mode === 'register' ? '请输入邮箱地址' : '请输入用户名或邮箱'} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              ...(mode === 'register' ? [{ min: 8, message: '密码至少8位' }] : [{ min: 6, message: '密码至少6位' }]),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={mode === 'register' ? '请输入密码（至少8位）' : '请输入密码'} />
          </Form.Item>
          {mode === 'register' && (
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="login-btn">
              {mode === 'login' ? '登  录' : '注  册'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 12 }}>
          {mode === 'login' ? '没有账号？点击上方「注册」创建' : '已有账号？点击上方「登录」'}
        </div>
      </div>
    </div>
  );
}
