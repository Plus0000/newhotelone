import { useState, useMemo, useEffect } from 'react';
import { Input, Select, Segmented, Button, Typography, Card, Row, Col, message } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined, CalculatorOutlined, SearchOutlined } from '@ant-design/icons';
import { useProjectStore } from '@/shared/stores/projectStore';
import { useMergedTechEntries } from '@/features/knowledge-base/store';
import { TechCardGrid } from './components/TechCardGrid';
import { TechTableView } from './components/TechTableView';
import { TechDetailModal } from './components/TechDetailModal';
import { ComprehensiveRateModal } from './components/ComprehensiveRateModal';
import { CATEGORY_FILTER_OPTIONS } from './constants';
import { getClimateZone } from '@/data/climateZoneMap';

const { Title, Text } = Typography;

export default function Step2Solution() {
  const selectedTechs = useProjectStore((s) => s.step2Data.selectedTechs);
  const updateStep2Data = useProjectStore((s) => s.updateStep2Data);
  const projectId = useProjectStore((s) => s.projectId);
  const saveProjectStep2Data = useProjectStore((s) => s.saveProjectStep2Data);
  const setProjectStep2RateCompleted = useProjectStore((s) => s.setProjectStep2RateCompleted);
  const techEntries = useMergedTechEntries();

  const projects = useProjectStore((s) => s.projects);
  const step1Data = useProjectStore((s) =>
    s.projectId ? s.projectsStep1Data[s.projectId] : undefined
  );

  // 从 project 读省份/等级/面积
  const project = projects.find((p) => p.id === projectId);
  const province = project?.location?.[0] || '';
  const hospitalLevel: '三级' | '二级' =
    project?.hospitalLevel === '三级' ? '三级' : '二级';
  const totalArea = project?.totalArea || 0;

  // 从 step1Data.mep.hvac.coldSourceMeta 取冷源最早投产年份
  const hvacYear = useMemo(() => {
    const coldSourceMeta = (step1Data?.mep as any)?.hvac?.coldSourceMeta;
    if (!coldSourceMeta || typeof coldSourceMeta !== 'object') return new Date().getFullYear();
    const years = Object.values(coldSourceMeta)
      .map((m: any) => Number(m?.year))
      .filter((y) => !isNaN(y) && y > 0);
    return years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  }, [step1Data]);

  const climateZone = getClimateZone(province);

  // Persist selections per project whenever they change
  useEffect(() => {
    if (projectId) saveProjectStep2Data(projectId, selectedTechs);
  }, [selectedTechs, projectId, saveProjectStep2Data]);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [detailTechId, setDetailTechId] = useState<string | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const filteredTechs = useMemo(() => {
    return techEntries.filter((tech) => {
      if (searchText && !tech.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== 'all' && tech.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [searchText, categoryFilter, techEntries]);

  const detailTech = useMemo(
    () => techEntries.find((t) => t.id === detailTechId) || null,
    [detailTechId, techEntries]
  );

  const handleToggle = (id: string) => {
    if (!Array.isArray(selectedTechs)) return;
    const next = selectedTechs.includes(id)
      ? selectedTechs.filter((t) => t !== id)
      : [...selectedTechs, id];
    updateStep2Data({ selectedTechs: next });
  };

  const handleSelectionChange = (ids: string[]) => {
    updateStep2Data({ selectedTechs: Array.isArray(ids) ? ids : [] });
  };

  const handleEstimate = () => {
    if (selectedTechs.length === 0) {
      message.warning('请先选择节能技术');
      return;
    }
    setRateModalOpen(true);
  };

  const handleRateConfirm = () => {
    updateStep2Data({ comprehensiveRateCompleted: true });
    if (projectId) {
      setProjectStep2RateCompleted(projectId, true);
      saveProjectStep2Data(projectId, [...selectedTechs]);
    }
    setRateModalOpen(false);
    message.success('综合节能率估算已完成');
  };

  const selectedTechEntries = useMemo(
    () => techEntries.filter((t) => selectedTechs.includes(t.id)),
    [selectedTechs, techEntries]
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 4 }}>节能方案筛选</Title>
        <Text type="secondary">根据建筑基本信息匹配到以下节能技术方案，请选择适用的技术</Text>
      </div>

      <Card
        style={{
          marginBottom: 16,
          border: '1px solid #e8ecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        bodyStyle={{ padding: '12px 20px' }}
      >
        <Row gutter={[20, 12]} align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>技术名称</span>
              <Input
                placeholder="请输入"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 180 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', whiteSpace: 'nowrap', fontWeight: 500 }}>技术分类</span>
              <Select
                placeholder="请选择"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={CATEGORY_FILTER_OPTIONS}
                allowClear
                style={{ width: 140 }}
              />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={() => { setSearchText(''); setCategoryFilter('all'); }}
              >
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />}>查询</Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        style={{
          border: '1px solid #e8ecf0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Text style={{ fontSize: 13, color: '#8c8c8c' }}>
            共 {techEntries.length} 项技术，筛选到 <Text strong style={{ color: '#1a1a2e' }}>{filteredTechs.length}</Text> 项
            {selectedTechs.length > 0 && (
              <span style={{ marginLeft: 12 }}>
                ，已选 <Text strong style={{ color: '#2B87C9' }}>{selectedTechs.length}</Text> 项
              </span>
            )}
          </Text>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'card' | 'table')}
            options={[
              { label: '图标显示', value: 'card', icon: <AppstoreOutlined /> },
              { label: '列表显示', value: 'table', icon: <UnorderedListOutlined /> },
            ]}
          />
        </div>

        {filteredTechs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
            没有匹配的技术方案
        </div>
        ) : viewMode === 'card' ? (
        <TechCardGrid
          techs={filteredTechs}
          selectedTechs={selectedTechs}
          onToggle={handleToggle}
          onDetail={setDetailTechId}
        />
        ) : (
        <TechTableView
          techs={filteredTechs}
          selectedTechs={selectedTechs}
          onSelectionChange={handleSelectionChange}
          onDetail={setDetailTechId}
        />
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<CalculatorOutlined />}
            disabled={selectedTechs.length === 0}
            onClick={handleEstimate}
          >
            综合节能率估算
          </Button>
        </div>
      </Card>

      <TechDetailModal
        tech={detailTech}
        open={detailTechId !== null}
        selected={detailTechId !== null && selectedTechs.includes(detailTechId)}
        onClose={() => setDetailTechId(null)}
        onToggle={handleToggle}
      />

      <ComprehensiveRateModal
        open={rateModalOpen}
        selectedTechs={selectedTechEntries}
        onClose={() => setRateModalOpen(false)}
        onConfirm={handleRateConfirm}
        climateZone={climateZone}
        hvacYear={hvacYear}
        province={province}
        hospitalLevel={hospitalLevel}
        totalArea={totalArea}
      />
    </div>
  );
}