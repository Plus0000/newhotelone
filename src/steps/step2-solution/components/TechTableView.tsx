import { Table, Tag, Progress, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, CATEGORY_COLORS, RATING_STARS, TECH_COLUMNS } from '../constants';

interface Props {
  techs: TechEntry[];
  selectedTechs: string[];
  onSelectionChange: (ids: string[]) => void;
  onDetail: (id: string) => void;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1890ff';
  return '#faad14';
};

export function TechTableView({ techs, selectedTechs, onSelectionChange, onDetail }: Props) {
  const COL_ALIGN: Record<string, React.CSSProperties['textAlign']> = {
    name: 'left',
    category: 'left',
    score: 'right',
    rating: 'left',
    energySavingRate: 'right',
    investmentIndex: 'right',
    annualEnergy: 'right',
    paybackPeriod: 'right',
  };
  const columns: ColumnsType<TechEntry> = [
    ...TECH_COLUMNS.map((col) => {
      const align = COL_ALIGN[col.key] || 'left';
      const alignProps = {
        onHeaderCell: () => ({ style: { textAlign: align } }),
        onCell: () => ({ style: { textAlign: align } }),
      };
      if (col.key === 'category') {
        return {
          ...col,
          ...alignProps,
          render: (cat: string) => (
            <Tag
              style={{
                border: 0,
                borderRadius: 4,
                padding: '2px 10px',
                fontWeight: 500,
              }}
              color={CATEGORY_COLORS[cat]}
            >
              {CATEGORY_LABELS[cat]}
            </Tag>
          ),
        };
      }
      if (col.key === 'score') {
        return {
          ...col,
          ...alignProps,
          render: (score: number) => (
            <Progress
              percent={score}
              size="small"
              strokeColor={SCORE_COLOR(score)}
              style={{ width: 100 }}
            />
          ),
        };
      }
      if (col.key === 'rating') {
        return {
          ...col,
          ...alignProps,
          render: (rating: number) => (
            <span style={{ color: '#faad14', letterSpacing: 1, fontSize: 13 }}>
              {RATING_STARS[rating]}
            </span>
          ),
        };
      }
      return { ...col, ...alignProps, render: undefined };
    }),
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_: unknown, record: TechEntry) => (
        <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); onDetail(record.id); }}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="hide-scrollbar-table">
      <Table<TechEntry>
        rowKey="id"
        dataSource={techs}
        columns={columns}
        pagination={false}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedTechs,
          onChange: (keys) => onSelectionChange(keys as string[]),
        }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.ant-checkbox-wrapper') || target.closest('td.ant-table-selection-column')) {
              return;
            }
            onDetail(record.id);
          },
        })}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
        components={{
          header: {
            cell: (props: any) => (
              <th {...props} style={{ ...props.style, background: '#f0f2f5', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }} />
            ),
          },
          body: {
            cell: (props: any) => (
              <td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
            ),
          },
        }}
      />
    </div>
  );
}