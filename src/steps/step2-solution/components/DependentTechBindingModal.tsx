import { useState, useEffect, useMemo } from 'react';
import { Modal, Checkbox, Empty, Tag, Typography, Alert } from 'antd';
import type { TechEntry } from '@/data/materials';

const { Text } = Typography;

interface Props {
  open: boolean;
  /** 当前正在配置的附属技术 */
  dependentTech: TechEntry | null;
  /** 所有可选的主技术池（不含附属技术） */
  availableMainTechs: TechEntry[];
  /** 当前已选主技术 id 列表（用于显示已选状态） */
  selectedTechs: string[];
  /** 当前附属技术已绑定的主技术 id 列表 */
  boundMainTechIds: string[];
  onConfirm: (mainTechIds: string[], newlySelectedMainIds: string[]) => void;
  onCancel: () => void;
}

/**
 * 附属技术挂载主技术的弹窗。
 *
 * 用户可勾选任意主技术（包括之前未选的），确认后：
 *  - 未选主技术会被自动加入 selectedTechs
 *  - 当前附属技术会绑定到所有勾选的主技术
 */
export function DependentTechBindingModal({
  open,
  dependentTech,
  availableMainTechs,
  selectedTechs,
  boundMainTechIds,
  onConfirm,
  onCancel,
}: Props) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set(boundMainTechIds));

  // 弹窗每次打开时重置为初始绑定
  useEffect(() => {
    if (open) {
      setCheckedIds(new Set(boundMainTechIds));
    }
  }, [open, boundMainTechIds, dependentTech?.id]);

  const orderedChecked = useMemo(() => Array.from(checkedIds), [checkedIds]);

  if (!dependentTech) return null;

  const handleToggle = (mainId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(mainId);
      else next.delete(mainId);
      return next;
    });
  };

  const handleOk = () => {
    const finalIds = Array.from(checkedIds);
    // 找出之前未选、现在被勾选的主技术
    const newlySelected = finalIds.filter((id) => !selectedTechs.includes(id));
    onConfirm(finalIds, newlySelected);
  };

  return (
    <Modal
      title={`选择「${dependentTech.name}」挂载的主技术`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ disabled: checkedIds.size === 0 }}
      width={560}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        message="附属技术不能单独存在，必须挂载到至少一个主技术"
        description="勾选主技术后会自动加入已选技术；若主技术之前未选，会一并勾选。加成公式：主技术节能率 × (1 + 附属技术节能率 × 适配度)"
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>当前挂载：</Text>
        {orderedChecked.length === 0 ? (
          <Tag color="default">未挂载</Tag>
        ) : (
          orderedChecked.map((id) => {
            const t = availableMainTechs.find((m) => m.id === id);
            return (
              <Tag key={id} color="gold">{t?.name ?? id}</Tag>
            );
          })
        )}
      </div>

      {availableMainTechs.length === 0 ? (
        <Empty description="没有可选主技术" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', padding: 4 }}>
          {availableMainTechs.map((main) => {
            const isChecked = checkedIds.has(main.id);
            const isSelected = selectedTechs.includes(main.id);
            return (
              <label
                key={main.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 12px',
                  border: `1px solid ${isChecked ? '#d48806' : '#f0f0f0'}`,
                  borderRadius: 8,
                  background: isChecked ? '#fffbe6' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={(e) => handleToggle(main.id, e.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text strong style={{ fontSize: 14 }}>{main.name}</Text>
                    {!isSelected && isChecked && (
                      <Tag color="blue" style={{ fontSize: 11 }}>将自动加入已选</Tag>
                    )}
                    {isSelected && (
                      <Tag color="green" style={{ fontSize: 11 }}>已选</Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    基准节能率 {main.energySavingRate} · {main.category}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
