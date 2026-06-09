import { useEffect, useState } from 'react';
import { Form, Typography, Tag, Empty, Space } from 'antd';
import { LinkOutlined, EnvironmentOutlined } from '@ant-design/icons';
import {
  getEnergyPriceInfo,
  queryEnergyPolicies,
  querySubsidyPolicies,
  type PolicyEntry,
} from '@/data/policies';
import { formatLocation } from '@/data/regions';
import { useProjectStore } from '@/shared/stores/projectStore';

const { Paragraph } = Typography;

/** 政策卡片 */
function PolicyCard({ policy }: { policy: PolicyEntry }) {
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
      <div style={{ marginBottom: 10 }}>
        <Tag color="blue" style={{ fontSize: 11, marginRight: 8 }}>
          政策名称
        </Tag>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
          {policy.name}
        </span>
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
            style={{ fontSize: 12 }}
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
    </div>
  );
}

export default function SubStep5Policy() {
  const form = Form.useFormInstance();
  const step1Data = useProjectStore((s) => s.step1Data);
  const location = (step1Data.location as string[]) || [];
  const locationStr = formatLocation(location);

  const [energyPrice, setEnergyPrice] = useState<{ peakValleyPriceDiff: number; valleyHours: number } | null>(null);
  const [energyPolicies, setEnergyPolicies] = useState<PolicyEntry[]>([]);
  const [subsidyPolicies, setSubsidyPolicies] = useState<PolicyEntry[]>([]);

  // 根据所在地自动查询并填充政策数据
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

      {/* 峰谷电政策 */}
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
        峰谷电政策
      </div>
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
        根据项目所在地联动展示，用于节能技术适配度计算
      </Paragraph>

      {/* 隐藏的表单字段，用于保存数据 */}
      <Form.Item name={['energyPeakValley', 'peakValleyDiff']} hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name={['energyPeakValley', 'valleyHours']} hidden>
        <input type="hidden" />
      </Form.Item>

      {energyPrice ? (
        <Space size={48} style={{ marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              峰谷电价差
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
              {energyPrice.peakValleyPriceDiff}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>
                元/kWh
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              夜间谷电时长
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
              {energyPrice.valleyHours}
              <span style={{ fontSize: 13, fontWeight: 400, color: '#8c8c8c', marginLeft: 4 }}>
                h
              </span>
            </div>
          </div>
        </Space>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            locationStr
              ? '该地区暂无峰谷电政策数据'
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
