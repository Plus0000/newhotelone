import { Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TechEntry } from '@/data/materials';
import { CATEGORY_LABELS, CATEGORY_COLORS, TECH_COLUMNS } from '../constants';

interface Props {
  techs: TechEntry[];
  selectedTechs: string[];
  onSelectionChange: (ids: string[]) => void;
  onDetail: (id: string) => void;
}

export function TechTableView({ techs, selectedTechs, onSelectionChange, onDetail }: Props) {
  const COL_ALIGN: Record<string, React.CSSProperties['textAlign']> = {
    name: 'left',
    category: 'left',
    affectedSystems: 'left',
    energyType: 'center',
    energySavingRate: 'center',
    investmentIndex: 'right',
    annualEnergy: 'right',
    paybackPeriod: 'center',
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
      if (col.key === 'affectedSystems') {
        return {
          ...col,
          ...alignProps,
          render: (systems: string[]) => (
            <span style={{ fontSize: 12 }}>{(systems || []).join('、')}</span>
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
