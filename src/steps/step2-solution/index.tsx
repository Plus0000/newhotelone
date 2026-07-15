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
import { scoreTechBoundary } from './techScoring';
import type { TechScoreResult } from './techScoring';

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
  const hospitalScale: '三级' | '二级' =
    project?.hospitalScale === '三级' ? '三级' : '二级';
  const totalArea = project?.totalArea || 0;

  // PM 文档第 142 段：取冷源和热源中最早的投产年份
  const hvacYear = useMemo(() => {
    const mep = step1Data?.mep as Record<string, unknown> | undefined;
    const hvac = mep?.hvac as Record<string, unknown> | undefined;
    if (!hvac || typeof hvac !== 'object') return new Date().getFullYear();

    const years: number[] = [];

    const coldSourceMeta = hvac.coldSourceMeta as Record<string, { year?: unknown }> | undefined;
    if (coldSourceMeta && typeof coldSourceMeta === 'object') {
      for (const m of Object.values(coldSourceMeta)) {
        const y = Number(m?.year);
        if (!isNaN(y) && y > 0) years.push(y);
      }
    }

    const heatSourceMeta = hvac.heatSourceMeta as Record<string, { year?: unknown }> | undefined;
    if (heatSourceMeta && typeof heatSourceMeta === 'object') {
      for (const m of Object.values(heatSourceMeta)) {
        const y = Number(m?.year);
        if (!isNaN(y) && y > 0) years.push(y);
      }
    }

    return years.length > 0 ? Math.min(...years) : new Date().getFullYear();
  }, [step1Data]);

  const climateZone = getClimateZone(province);

  // 技术打分：基于 techBoundaries 适用边界条件
  const techScores = useMemo(() => {
    const map = new Map<string, TechScoreResult>();
    if (!step1Data) return map;
    for (const tech of techEntries) {
      map.set(tech.id, scoreTechBoundary(tech.name, step1Data, climateZone, project));
    }
    return map;
  }, [techEntries, step1Data, climateZone, project]);

  // 综合节能率弹窗用：techId -> adaptation score
  const techAdaptationScores = useMemo(() => {
    const map = new Map<string, number>();
    for (const [id, r] of techScores) map.set(id, r.score);
    return map;
  }, [techScores]);

  // Persist selections per project whenever they change
  useEffect(() => {
    if (projectId) saveProjectStep2Data(projectId, selectedTechs);
  }, [selectedTechs, projectId, saveProjectStep2Data]);

  // 自动取消否决技术的选中
  useEffect(() => {
    const currentSelected = useProjectStore.getState().step2Data.selectedTechs;
    if (!Array.isArray(currentSelected)) return;
    const vetoedIds = new Set(
      Array.from(techScores.entries())
        .filter(([, r]) => r.isVetoed)
        .map(([id]) => id)
    );
    if (currentSelected.some((id) => vetoedIds.has(id))) {
      updateStep2Data({ selectedTechs: currentSelected.filter((id) => !vetoedIds.has(id)) });
    }
  }, [techScores, updateStep2Data]);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [detailTechId, setDetailTechId] = useState<string | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const filteredTechs = useMemo(() => {
    // PM 文档推荐原则：得分 80~100 予以推荐展示
    const SCORE_THRESHOLD = 0.8;
    return techEntries
      .filter((tech) => {
        if (searchText && !tech.name.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
        if (categoryFilter !== 'all' && tech.category !== categoryFilter) {
          return false;
        }
        // 得分低于阈值且未被否决的不展示（否决的保留展示，灰掉）
        const score = techScores.get(tech.id);
        if (score && !score.isVetoed && score.score < SCORE_THRESHOLD) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = techScores.get(a.id)?.score ?? 1;
        const sb = techScores.get(b.id)?.score ?? 1;
        return sb - sa;
      });
  }, [searchText, categoryFilter, techEntries, techScores]);

  const detailTech = useMemo(
    () => techEntries.find((t) => t.id === detailTechId) || null,
    [detailTechId, techEntries]
  );

  const handleToggle = (id: string) => {
    if (!Array.isArray(selectedTechs)) return;
    if (selectedTechs.includes(id)) {
      // Deselecting: just remove it
      const next = selectedTechs.filter((t) => t !== id);
      updateStep2Data({ selectedTechs: next });
    } else {
      // Selecting: check for mutually exclusive tech and deselect it first
      const targetTech = techEntries.find((t) => t.id === id);
      if (!targetTech) return;
      const matchedTech = techEntries.find((t) => t.name === targetTech.mutexTech);
      const mutexTechId = matchedTech ? matchedTech.id : null;
      const next = [...selectedTechs.filter((t) => t !== mutexTechId), id];
      updateStep2Data({ selectedTechs: next });
    }
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
          techScores={techScores}
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
        hospitalScale={hospitalScale}
        totalArea={totalArea}
        techAdaptationScores={techAdaptationScores}
      />
    </div>
  );
}