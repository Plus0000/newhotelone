import { Modal, Table, Statistic, Row, Col, Empty } from 'antd';
import type { TechInvestment } from '@/shared/stores/projectStore';

interface Props {
  open: boolean;
  investments: (TechInvestment & { techName: string })[];
  onClose: () => void;
}

export function InvestmentSummaryModal({ open, investments, onClose }: Props) {
  const totalInvestment = investments.reduce((sum, i) => sum + i.fixedInvestment, 0);
  const totalSubsidy = investments.reduce((sum, i) => sum + i.subsidyAmount, 0);
  const netInvestment = totalInvestment - totalSubsidy;

  return (
    <Modal
      title="固定投资概算汇总"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 24 }}
      destroyOnClose
    >
      {investments.length === 0 ? (
        <Empty description="请先选择需要汇总的技术" />
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <div
                style={{
                  background: '#e6f4ff',
                  borderRadius: 8,
                  padding: '20px 16px',
                  textAlign: 'center',
                }}
              >
                <Statistic
                  title="固定投资合计"
                  value={totalInvestment}
                  suffix="万元"
                  precision={2}
                />
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: '#f6ffed',
                  borderRadius: 8,
                  padding: '20px 16px',
                  textAlign: 'center',
                }}
              >
                <Statistic title="补贴合计" value={totalSubsidy} suffix="万元" precision={2} />
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #2B87C9 0%, #52c41a 100%)',
                  borderRadius: 8,
                  padding: '20px 16px',
                  textAlign: 'center',
                  color: '#fff',
                }}
              >
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
                  实际投资（扣除补贴）
                </div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{netInvestment.toFixed(2)} 万元</div>
              </div>
            </Col>
          </Row>

          <Table
            rowKey="techId"
            dataSource={investments}
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: '技术名称',
                dataIndex: 'techName',
                key: 'techName',
                onHeaderCell: () => ({ style: { textAlign: 'left' } }),
                onCell: () => ({ style: { textAlign: 'left' } }),
              },
              {
                title: '设备费用(万元)',
                key: 'equipment',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (_: unknown, r: TechInvestment) =>
                  r.equipment.reduce((s, i) => s + i.subtotal, 0).toFixed(2),
              },
              {
                title: '材料费用(万元)',
                key: 'materials',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (_: unknown, r: TechInvestment) =>
                  r.materials.reduce((s, i) => s + i.subtotal, 0).toFixed(2),
              },
              {
                title: '安装费用(万元)',
                key: 'installation',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (_: unknown, r: TechInvestment) =>
                  r.installation.reduce((s, i) => s + i.subtotal, 0).toFixed(2),
              },
              {
                title: '运维费用(万元)',
                key: 'maintenance',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (_: unknown, r: TechInvestment) =>
                  r.maintenance.reduce((s, i) => s + i.subtotal, 0).toFixed(2),
              },
              {
                title: '固定投资(万元)',
                dataIndex: 'fixedInvestment',
                key: 'fixedInvestment',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (v: number) => <span style={{ fontWeight: 600 }}>{v.toFixed(2)}</span>,
              },
              {
                title: '补贴额度',
                dataIndex: 'subsidyRate',
                key: 'subsidyRate',
                onHeaderCell: () => ({ style: { textAlign: 'right' } }),
                onCell: () => ({ style: { textAlign: 'right' } }),
                render: (v: string) => v || '-',
              },
            ]}
            components={{
              header: {
                cell: (props: any) => (
                  <th
                    {...props}
                    style={{
                      ...props.style,
                      background: '#f0f2f5',
                      fontWeight: 600,
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                    }}
                  />
                ),
              },
              body: {
                cell: (props: any) => (
                  <td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />
                ),
              },
            }}
          />
        </>
      )}
    </Modal>
  );
}
