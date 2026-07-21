import { useEffect, useState, useMemo } from 'react';
import { Form, Typography, Tag, Empty, Row, Col } from 'antd';
import { LinkOutlined, EnvironmentOutlined, ThunderboltOutlined, FireOutlined, ExperimentOutlined, HeatMapOutlined } from '@ant-design/icons';
import {
  getEnergyPriceInfo,
  queryEnergyPolicies,
  querySubsidyPolicies,
  type PolicyEntry,
} from '@/data/policies';
import { energyPriceReferences } from '@/data/materials';
import { formatLocation } from '@/data/regions';
import { useProjectStore } from '@/shared/stores/projectStore';

const { Paragraph } = Typography;

/** 政策卡片 */
function PolicyCard({ policy }: { policy: PolicyEntry }) {
  const levelLabel: Record<string, string> = {
    national: '国家',
    municipality: '直辖市',
    province: '省级',
    city: '市级',
    district: '区级',
  };
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        background: 'var(--bg-nested)',
        borderRadius: 8,
        border: '1px solid var(--border-section)',
      }}
    >
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Tag color="blue" style={{ fontSize: 11, marginRight: 0 }}>
          政策名称
        </Tag>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>
          {policy.name}
        </span>
      </div>
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Tag color="geekblue" style={{ fontSize: 11, marginRight: 0 }}>{levelLabel[policy.level] ?? policy.level}</Tag>
        <Tag color="purple" style={{ fontSize: 11, marginRight: 0 }}>{policy.policyType}</Tag>
        {policy.publishYear && (
          <Tag style={{ fontSize: 11, marginRight: 0, color: '#8c8c8c', borderColor: '#d9d9d9' }}>{policy.publishYear}年</Tag>
        )}
        {policy.validPeriod && (
          <span style={{ fontSize: 11, color: '#8c8c8c' }}>有效期：{policy.validPeriod}</span>
        )}
      </div>
      {policy.url && (
        <div style={{ marginBottom: 10 }}>
          <Tag color="cyan" style={{ fontSize: 11, marginRight: 8 }}>
            政策链接
          </Tag>
          <a
            href={policy.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, wordBreak: 'break-all' }}
          >
            <LinkOutlined style={{ marginRight: 4 }} />
            {policy.url}
          </a>
        </div>
      )}
      <div>
        <Tag color="green" style={{ fontSize: 11, marginRight: 8 }}>
          政策详情
        </Tag>
        <Paragraph
          style={{
            fontSize: 12,
            color: '#595959',
            lineHeight: 1.7,
            marginBottom: 0,
            marginTop: 6,
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: 4,
          }}
        >
          {policy.summary}
        </Paragraph>
      </div>
      {policy.remark && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#8c8c8c', lineHeight: 1.6 }}>
          备注：{policy.remark}
        </div>
      )}
    </div>
  );
}

export default function SubStep5Policy() {
  const form = Form.useFormInstance();
  const step1Data = useProjectStore((s) => s.step1Data);
  const location = (step1Data.location as string[]) || [];
  const locationStr = formatLocation(location);

  const [_energyPrice, setEnergyPrice] = useState<{ peakValleyPriceDiff: number; valleyHours: number } | null>(null);
  const [energyPolicies, setEnergyPolicies] = useState<PolicyEntry[]>([]);
  const [subsidyPolicies, setSubsidyPolicies] = useState<PolicyEntry[]>([]);

  // 根据所在地查询能源价格参考（与 Step 4 helpers.ts 的 getEnergyPricesByLocation 逻辑一致）
  const MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市'];
  const DEFAULT_PRICES = { comprehensivePrice: 0.72, gasPrice: 2.76, waterPrice: 7.53 };
  const energyPriceRef = useMemo(() => {
    if (!location || location.length < 2) return null;
    const province = location[0];
    const city = MUNICIPALITIES.includes(province) ? province : location[1];
    const key = `${province}-${city}`;
    const ref = energyPriceReferences.find((r) => r.location === key);
    if (ref) return ref;
    return { location: key, peakPrice: 0, flatPrice: 0, valleyPrice: 0, ...DEFAULT_PRICES, heatingScope: '' } as typeof energyPriceReferences[number];
  }, [location]);
  useEffect(() => {
    if (!location || location.length === 0) {
      setEnergyPrice(null);
      setEnergyPolicies([]);
      setSubsidyPolicies([]);
      form.setFieldsValue({
        energyPeakValley: undefined,
        energyPolicies: [],
        renewableSubsidies: [],
      });
      return;
    }

    const price = getEnergyPriceInfo(location);
    const policies = queryEnergyPolicies(location);
    const subsidies = querySubsidyPolicies(location);

    setEnergyPrice(price);
    setEnergyPolicies(policies);
    setSubsidyPolicies(subsidies);

    form.setFieldsValue({
      energyPeakValley: price || undefined,
      energyPolicies: policies,
      renewableSubsidies: subsidies,
    });
  }, [location, form]);

  return (
    <>
      {/* 项目所在地提示 */}
      {locationStr && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            background: '#f0f5ff',
            borderRadius: 6,
            border: '1px solid #d6e4ff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <EnvironmentOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>
            当前项目所在地：{locationStr}
          </span>
        </div>
      )}

      {/* 市政能源 */}
      <div
        style={{
          marginBottom: 16,
          fontWeight: 600,
          fontSize: 15,
          padding: '10px 16px',
          background: 'var(--bg-section)',
          borderRadius: 6,
          border: '1px solid var(--border-section)',
        }}
      >
        市政能源
      </div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示当前市区水电燃气价格
      </Paragraph>

      {/* 隐藏的表单字段，用于保存数据 */}
      <Form.Item name={['energyPeakValley', 'peakValleyDiff']} hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name={['energyPeakValley', 'valleyHours']} hidden>
        <input type="hidden" />
      </Form.Item>

      {energyPriceRef ? (
        <Row gutter={14} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <div style={{
              background: '#fffff5', borderRadius: 8, border: '1px solid #fff3d6',
              padding: '14px 16px', height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ThunderboltOutlined style={{ color: '#faad14', fontSize: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>工商业电价</span>
                <span style={{ fontSize: 11, color: '#595959' }}>元/kWh</span>
              </div>
              <Row gutter={[8, 10]}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>高峰</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{energyPriceRef.peakPrice}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>平段</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{energyPriceRef.flatPrice}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>低谷</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{energyPriceRef.valleyPrice}</div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>综合</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1677ff' }}>{energyPriceRef.comprehensivePrice}</div>
                </Col>
                <Col span={24}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>峰谷差</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fa8c16' }}>{(energyPriceRef.peakPrice - energyPriceRef.valleyPrice).toFixed(4)}</div>
                </Col>
              </Row>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              background: '#fff7fa', borderRadius: 8, border: '1px solid #ffdce8',
              padding: '14px 16px', height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FireOutlined style={{ color: '#eb2f96', fontSize: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>工商业天然气价</span>
                <span style={{ fontSize: 11, color: '#595959' }}>元/Nm³</span>
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>天然气价</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{energyPriceRef.gasPrice}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              background: '#f0fbff', borderRadius: 8, border: '1px solid #d6f0ff',
              padding: '14px 16px', height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ExperimentOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>工商业用水价格</span>
                <span style={{ fontSize: 11, color: '#595959' }}>元/m³</span>
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>自来水价</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{energyPriceRef.waterPrice}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{
              background: '#f5fff7', borderRadius: 8, border: '1px solid #d6ffe0',
              padding: '14px 16px', height: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <HeatMapOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>市政热力</span>
              </div>
              {energyPriceRef.heatingScope ? (
                <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.8 }}>
                  {energyPriceRef.heatingScope}
                </div>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700, color: '#999' }}>-</div>
              )}
            </div>
          </Col>
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            locationStr
              ? '该地区暂无市政能源价格数据'
              : '请先选择项目所在地'
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 能源政策 */}
      <div
        style={{
          margin: '24px 0 16px',
          fontWeight: 600,
          fontSize: 15,
          padding: '10px 16px',
          background: 'var(--bg-section)',
          borderRadius: 6,
          border: '1px solid var(--border-section)',
        }}
      >
        能源政策
      </div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，用于节能技术适配度计算
      </Paragraph>

      {/* 隐藏的表单字段，用于保存数据 */}
      <Form.Item name="energyPolicies" hidden>
        <input type="hidden" />
      </Form.Item>

      {energyPolicies.length > 0 ? (
        energyPolicies.map((p: PolicyEntry) => (
          <PolicyCard key={p.id} policy={p} />
        ))
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            locationStr
              ? '该地区暂无能源政策数据'
              : '请先选择项目所在地'
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 可再生能源利用专项补贴 */}
      <div
        style={{
          margin: '24px 0 16px',
          fontWeight: 600,
          fontSize: 15,
          padding: '10px 16px',
          background: 'var(--bg-section)',
          borderRadius: 6,
          border: '1px solid var(--border-section)',
        }}
      >
        可再生能源利用专项补贴
      </div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，用于判断节能技术适配度。投资概算时提取具体补贴数值用于计算。
      </Paragraph>

      {/* 隐藏的表单字段，用于保存数据 */}
      <Form.Item name="renewableSubsidies" hidden>
        <input type="hidden" />
      </Form.Item>

      {subsidyPolicies.length > 0 ? (
        subsidyPolicies.map((p: PolicyEntry) => (
          <PolicyCard key={p.id} policy={p} />
        ))
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            locationStr
              ? '该地区暂无可再生能源补贴政策'
              : '请先选择项目所在地'
          }
          style={{ marginBottom: 24 }}
        />
      )}
    </>
  );
}
