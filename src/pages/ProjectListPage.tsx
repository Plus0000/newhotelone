import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emptyStateImg from '@/assets/empty-state.png';
import {
  Button,
  Card,
  Typography,
  Space,
  Table,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Drawer,
  Descriptions,
  Badge,
  Empty,
  Modal,
  Dropdown,
  message,
  Skeleton,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  BankOutlined,
  FileTextOutlined,
  UserOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,

  CalendarOutlined,
} from '@ant-design/icons';
import { formatLocation } from '@/data/regions';
import { useAuthStore } from '@/shared/stores/authStore';
import { useProjectStore, type Project } from '@/shared/stores/projectStore';

const { Text } = Typography;

function StepGuideItem({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: '#e8f0fe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#2B87C9', fontWeight: 620, fontSize: 13, flexShrink: 0, marginTop: 1,
      }}>
        {number}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{desc}</div>
      </div>
    </div>
  );
}

const AUDIT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '未核算', color: 'default' },
  completed: { label: '已核算', color: 'green' },
};

const STEP_LABELS: Record<number, string> = {
  0: '建筑基本信息',
  1: '节能方案筛选',
  2: '机电系统孪生管理',
  3: '节能计算与数据分析',
};

export default function ProjectListPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const userName = useAuthStore((s) => s.user) || '管理员';
  const projects = useProjectStore((s) => s.projects);
  const hydrated = useProjectStore((s) => s.hydrated);
  const hydrating = useProjectStore((s) => s.hydrating);
  const resetCurrentProject = useProjectStore((s) => s.resetCurrentProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const addProject = useProjectStore((s) => s.addProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const hydrateFromServer = useProjectStore((s) => s.hydrateFromServer);
  const uploadRef = useRef<HTMLInputElement>(null);

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      Modal.confirm({
        title: '确认退出',
        content: '确定要退出登录吗？',
        okText: '退出',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          logout();
          message.success('已退出登录');
        },
      });
    }
  };

  useEffect(() => {
    if (!hydrated) hydrateFromServer();
  }, [hydrated, hydrateFromServer]);

  const [filters, setFilters] = useState({
    projectName: '',
    hospitalName: '',
    hospitalNature: '',
    auditStatus: '',
  });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!hydrating && hydrated && projects.length === 0 && !localStorage.getItem('onboarding-done')) {
      setWelcomeOpen(true);
    }
  }, [hydrating, hydrated, projects.length]);

  const handleCloseWelcome = () => {
    setWelcomeOpen(false);
    localStorage.setItem('onboarding-done', '1');
  };

  const handleNewProject = () => {
    resetCurrentProject();
    const id = Date.now().toString();
    addProject({
      id,
      projectName: '新建项目',
      hospitalName: '',
      location: [],
      projectStage: '',
      buildingType: '',
      hospitalLevel: '',
      hospitalNature: '',
      hospitalScale: '',
      totalArea: 0,
      author: '',
      fillDate: new Date().toISOString().slice(0, 10),
      department: '',
      currentStep: 0,
      auditStatus: 'pending',
      createdAt: new Date().toISOString(),
    });
    navigate(`/projects/${id}/stepper`);
  };

  const handleEdit = (record: Project) => {
    loadProject(record.id);
    useProjectStore.getState().loadProjectStepsFromServer(record.id);
    navigate(`/projects/${record.id}/stepper/1`);
  };

  const handleView = (record: Project) => {
    setViewingProject(record);
    setDrawerVisible(true);
  };

  const handleReset = () => {
    setFilters({
      projectName: '',
      hospitalName: '',
      hospitalNature: '',
      auditStatus: '',
    });
  };

  const handleDelete = (record: Project) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目「${record.projectName || record.hospitalName || '未命名'}」吗？删除后不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteProject(record.id);
        message.success('项目已删除');
      },
    });
  };

  const handleBatchDelete = () => {
    const count = selectedRowKeys.length;
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${count} 个项目吗？删除后不可恢复。`,
      okText: '全部删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        selectedRowKeys.forEach((key) => deleteProject(key as string));
        setSelectedRowKeys([]);
        message.success(`已删除 ${count} 个项目`);
      },
    });
  };

  const handleDownloadTemplate = () => {
    const headers = '项目名称,医院名称,所在地,项目阶段,项目属性,建筑类型,医院类型,医院性质,医院等级,医院规模,总建筑面积(㎡),普通病房(床),重症监护病床(床),洁净手术室(间),业务负责人,所属业务部门,联系电话';
    const row = '示例项目,示例医院,北京市,新建,自有,综合医疗建筑,综合医院,公立医院,三甲,500床以上,50000,300,30,10,张三,节能部,13800138000';
    const csv = '﻿' + headers + '\n' + row;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '医院节能方案_导入模板.csv';
    a.click();
    URL.revokeObjectURL(url);
    message.success('模板已下载');
  };

  const handleUploadTemplate = () => {
    uploadRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          message.error('模板文件内容为空');
          return;
        }
        const values = lines[1].split(',');
        const id = Date.now().toString();
        addProject({
          id,
          projectName: values[0] || '',
          hospitalName: values[1] || '',
          location: values[2] ? [values[2]] : [],
          projectStage: values[3] || '',
          buildingType: values[5] || '',
          hospitalLevel: values[8] || '',
          hospitalNature: values[7] || '',
          hospitalScale: values[9] || '',
          totalArea: Number(values[10]) || 0,
          author: values[14] || '',
          fillDate: new Date().toISOString().slice(0, 10),
          department: values[15] || '',
          currentStep: 0,
          auditStatus: 'pending',
          createdAt: new Date().toISOString(),
        });
        message.success('模板导入成功');
      } catch {
        message.error('模板解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.projectName && !p.projectName.includes(filters.projectName)) return false;
      if (filters.hospitalName && !p.hospitalName.includes(filters.hospitalName)) return false;
      if (filters.hospitalNature && p.hospitalNature !== filters.hospitalNature) return false;
      if (filters.auditStatus && p.auditStatus !== filters.auditStatus) return false;
      return true;
    });
  }, [projects, filters]);

  const isEmpty = projects.length === 0;

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (text: string) => (
        <Text strong style={{ color: '#1a1a2e' }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: '医院名称',
      dataIndex: 'hospitalName',
      key: 'hospitalName',
      ellipsis: true,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (text: string) => text || '-',
    },
    {
      title: '医院性质',
      dataIndex: 'hospitalNature',
      key: 'hospitalNature',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (text: string) => (
        <Tag
          color={text === '公立医院' ? 'blue' : text === '民营医院' ? 'orange' : 'default'}
          style={{ borderRadius: 4 }}
        >
          {text || '-'}
        </Tag>
      ),
    },
    {
      title: '核算状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      onCell: () => ({ style: { textAlign: 'center' as const } }),
      render: (status: string) => {
        const config = AUDIT_STATUS_MAP[status] || AUDIT_STATUS_MAP.pending;
        return (
          <Tag color={config.color} style={{ borderRadius: 4 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '所在地',
      dataIndex: 'location',
      key: 'location',
      width: 90,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (text: string[]) => (
        <Space size={4} style={{ whiteSpace: 'nowrap' }}>
          <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <span style={{ whiteSpace: 'nowrap' }}>{Array.isArray(text) ? formatLocation(text) : text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '填写人',
      dataIndex: 'author',
      key: 'author',
      width: 80,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (text: string) => text || '-',
    },
    {
      title: '填写时间',
      dataIndex: 'fillDate',
      key: 'fillDate',
      width: 110,
      onHeaderCell: () => ({ style: { textAlign: 'left' as const } }),
      onCell: () => ({ style: { textAlign: 'left' as const } }),
      render: (d: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>{d || '-'}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      onHeaderCell: () => ({ style: { textAlign: 'center' as const } }),
      onCell: () => ({ style: { textAlign: 'center' as const } }),
      render: (_: unknown, record: Project) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 8px' }}>|</span>}>
          <a onClick={() => handleEdit(record)} style={{ color: '#2B87C9', cursor: 'pointer', fontSize: 13 }}>
            编辑
          </a>
          <Dropdown
            menu={{
              items: [
                { key: 'view', icon: <EyeOutlined />, label: '查看' },
                { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'view') handleView(record);
                if (key === 'delete') handleDelete(record);
              },
            }}
            trigger={['click']}
          >
            <a style={{ color: '#2B87C9', cursor: 'pointer', fontSize: 13 }}>
              更多
            </a>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-layout)',
      }}
    >
      <input
        ref={uploadRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      {/* Top bar */}
      <div
        style={{
          background: 'var(--bg-container)',
          borderBottom: '1px solid var(--border-section)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 32px',
            height: 56,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/nav-title.png" alt="节能方案助手" style={{ height: 32, objectFit: 'contain' }} />
          </div>
          <Space size={16} align="center">
            <Badge count={0} size="small">
              <Button shape="circle" icon={<BellOutlined />} style={{ border: 'none', background: 'transparent' }} />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <Space size={8} style={{ cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: '#333' }}>{userName}</span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#e6f0f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserOutlined style={{ color: '#2B87C9', fontSize: 14 }} />
                </div>
              </Space>
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {/* Filter card */}
        <Card
          bordered={false}
          style={{
            marginBottom: 20,
            borderRadius: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
          }}
          title={
            <Space size={8}>
              <SearchOutlined style={{ color: '#2B87C9' }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>医院建筑基本信息</span>
            </Space>
          }
        >
          <Row gutter={[20, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  项目名称
                </Text>
              </div>
              <Input
                placeholder="请输入项目名称"
                value={filters.projectName}
                onChange={(e) => setFilters((f) => ({ ...f, projectName: e.target.value }))}
                allowClear
                prefix={<FileTextOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  医院名称
                </Text>
              </div>
              <Input
                placeholder="请输入医院名称"
                value={filters.hospitalName}
                onChange={(e) => setFilters((f) => ({ ...f, hospitalName: e.target.value }))}
                allowClear
                prefix={<BankOutlined style={{ color: '#bfbfbf' }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  医院性质
                </Text>
              </div>
              <Select
                placeholder="请选择"
                value={filters.hospitalNature || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, hospitalNature: v || '' }))}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: '公立医院', value: '公立医院' },
                  { label: '民营医院', value: '民营医院' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  核算状态
                </Text>
              </div>
              <Select
                placeholder="请选择"
                value={filters.auditStatus || undefined}
                onChange={(v) => setFilters((f) => ({ ...f, auditStatus: v || '' }))}
                allowClear
                style={{ width: '100%' }}
                options={[
                  { label: '未核算', value: 'pending' },
                  { label: '已核算', value: 'completed' },
                ]}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                /* filter via useMemo, no-op needed */
              }}
            >
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </div>
        </Card>

        {/* Project table */}
        {hydrating ? (
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        ) : isEmpty ? (
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ textAlign: 'center', padding: '80px 0 72px' }}>
              <img
                src={emptyStateImg}
                alt="暂无项目"
                style={{ width: 200, height: 'auto', marginBottom: 24 }}
              />
              <div style={{ fontSize: 16, color: '#262626', fontWeight: 500, marginBottom: 6 }}>暂无项目</div>
              <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 24 }}>
                点击下方按钮，创建您的第一个节能方案
              </div>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNewProject}>
                新增项目
              </Button>
            </div>
          </Card>
        ) : (
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '0 24px 24px' }}
          >
            <div
              style={{
                padding: '14px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space size={8}>
                <FileTextOutlined style={{ color: '#2B87C9' }} />
                <Text strong style={{ fontSize: 14 }}>
                  项目列表
                </Text>
                <Tag style={{ borderRadius: 10, background: 'var(--bg-section)', border: 'none' }}>
                  {filteredProjects.length} 个项目
                </Tag>
              </Space>
              <Space size={8}>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                  模板下载
                </Button>
                <Button icon={<UploadOutlined />} onClick={handleUploadTemplate}>
                  模板上传
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject}>
                  新增项目
                </Button>
              </Space>
            </div>
            {selectedRowKeys.length > 0 && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 16px',
                  background: '#e6f7ff',
                  borderRadius: 6,
                  border: '1px solid #91d5ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#1890ff', fontSize: 14 }}>
                  已选择 <strong>{selectedRowKeys.length}</strong> 项
                </span>
                <Space size={12}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setSelectedRowKeys([])}
                    style={{ color: '#999' }}
                  >
                    取消选择
                  </Button>
                  <Button
                    type="primary"
                    danger
                    onClick={handleBatchDelete}
                    style={{ borderRadius: 4 }}
                  >
                    全部删除
                  </Button>
                </Space>
              </div>
            )}
            <Table
              dataSource={filteredProjects}
              columns={columns}
              rowKey="id"
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              tableLayout="auto"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个项目`,
                style: { marginTop: 12 },
              }}
              locale={{ emptyText: <Empty description="未匹配到项目，请调整筛选条件" /> }}
              style={{ marginTop: 4 }}
            />
          </Card>
        )}
      </div>

      {/* View Drawer */}
      <Drawer
        title={
          <Space size={8}>
            <EyeOutlined style={{ color: '#2B87C9' }} />
            <span style={{ fontWeight: 600 }}>项目详情</span>
          </Space>
        }
        placement="right"
        width={520}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setViewingProject(null);
        }}
        extra={
          viewingProject && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setDrawerVisible(false);
                navigate(`/projects/${viewingProject.id}/stepper/1`);
              }}
            >
              编辑
            </Button>
          )
        }
      >
        {viewingProject && (
          <div>
            {/* Status badge */}
            <div style={{ marginBottom: 24 }}>
              <Badge
                status={viewingProject.auditStatus === 'completed' ? 'success' : 'default'}
                text={
                  <Text strong style={{ fontSize: 14 }}>
                    {viewingProject.auditStatus === 'completed' ? '已核算' : '未核算'}
                  </Text>
                }
              />
              <Tag
                style={{ marginLeft: 8, borderRadius: 4 }}
                color="blue"
              >
                {STEP_LABELS[viewingProject.currentStep] || 'Step 1'}
              </Tag>
            </div>

            <Descriptions
              column={2}
              bordered
              size="small"
              labelStyle={{
                fontWeight: 500,
                background: 'var(--bg-nested)',
                width: 110,
              }}
              contentStyle={{ background: '#fff' }}
            >
              <Descriptions.Item label="项目名称" span={2}>
                <Text strong>{viewingProject.projectName || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="医院名称" span={2}>
                {viewingProject.hospitalName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所在地">
                <Space size={4}>
                  <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                  {Array.isArray(viewingProject.location) ? formatLocation(viewingProject.location) : viewingProject.location || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="医院性质">
                <Tag
                  color={
                    viewingProject.hospitalNature === '公立医院'
                      ? 'blue'
                      : viewingProject.hospitalNature === '民营医院'
                        ? 'orange'
                        : 'default'
                  }
                >
                  {viewingProject.hospitalNature || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="医院等级">
                {viewingProject.hospitalLevel || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="建筑类型">
                {viewingProject.buildingType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="项目阶段">
                {viewingProject.projectStage || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总建筑面积">
                {viewingProject.totalArea ? `${viewingProject.totalArea.toLocaleString()} ㎡` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="填写人">
                <Space size={4}>
                  <UserOutlined style={{ color: '#8c8c8c' }} />
                  {viewingProject.author || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="填写时间">
                <Space size={4}>
                  <CalendarOutlined style={{ color: '#8c8c8c' }} />
                  {viewingProject.fillDate || '-'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="业务部门" span={2}>
                {viewingProject.department || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* Welcome onboarding modal */}
      <Modal
        title={null}
        open={welcomeOpen}
        onCancel={handleCloseWelcome}
        footer={null}
        width={480}
        closable={false}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <img src="/images/nav-title.png" alt="节能方案助手" style={{ height: 40, marginBottom: 16 }} />
          <div style={{ fontSize: 20, fontWeight: 620, color: '#1a1a2e', marginBottom: 8 }}>
            欢迎使用
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
            本工具帮助您完成医院建筑节能方案的全流程编制，
            <br />
            只需五步即可生成专业的节能评估报告。
          </div>

          <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
            <StepGuideItem number="1" title="建筑基本信息" desc="填写医院概况、建筑规模、机电系统等基础数据" />
            <StepGuideItem number="2" title="节能方案筛选" desc="从技术库中选择适配的节能技术，估算综合节能率" />
            <StepGuideItem number="3" title="机电系统投资概算" desc="逐项录入设备、材料、安装、运维费用" />
            <StepGuideItem number="4" title="节能计算与数据分析" desc="设定运行参数，计算节能效益与投资回报" />
            <StepGuideItem number="5" title="辅助决策" desc="横向对比多方案，一键生成决策报告" />
          </div>

          <Button type="primary" size="large" onClick={handleCloseWelcome} style={{ minWidth: 200 }}>
            开始使用
          </Button>
        </div>
      </Modal>
    </div>
  );
}