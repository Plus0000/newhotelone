// 规范标准库 — 预置参考数据
// 汇集医院建筑国/地/行标，为节能方案制定、节能计算、用户问答提供依据

export interface StandardEntry {
  id: string;
  category: 'medical' | 'design' | 'construction' | 'operation';
  name: string;
  code: string;
  description: string;
}

export const standards: StandardEntry[] = [
  {
    id: '1',
    category: 'medical',
    name: '综合医院建筑设计规范',
    code: 'GB 51039-2014',
    description: '适用于新建、改建和扩建的综合医院建筑设计',
  },
  {
    id: '2',
    category: 'design',
    name: '公共建筑节能设计标准',
    code: 'GB 50189-2015',
    description: '适用于新建、改建和扩建的公共建筑节能设计',
  },
  {
    id: '3',
    category: 'operation',
    name: '医院建筑能耗监管系统建设技术导则',
    code: '-',
    description: '医院建筑能耗监测与管理系统的设计与实施指南',
  },
];