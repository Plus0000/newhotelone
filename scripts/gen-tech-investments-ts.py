#!/usr/bin/env python3
"""把 /tmp/tech_investments.json 转为 TS 代码片段，输出到 stdout。"""

import json

with open("/tmp/tech_investments.json", encoding="utf-8") as f:
    data = json.load(f)


def fmt_row(row, indent="      "):
    parts = [f"name: {ts_str(row['name'])}"]
    if row.get("category"):
        parts.append(f"category: {ts_str(row['category'])}")
    parts.append(f"specification: {ts_str(row.get('specification', ''))}")
    parts.append(f"unit: {ts_str(row['unit'])}")
    parts.append(f"quantity: {fmt_num(row['quantity'])}")
    # 元 -> 万元
    unit_price_wan = row['unitPrice'] / 10000
    parts.append(f"unitPrice: {fmt_num(unit_price_wan)}")
    if row.get("isMainEquipment"):
        parts.append("isMainEquipment: true")
    if row.get("powerKw"):
        parts.append(f"powerKw: {fmt_num(row['powerKw'])}")
    if row.get("remark"):
        parts.append(f"remark: {ts_str(row['remark'])}")
    if row.get("maintenanceCategory"):
        cat = row["maintenanceCategory"]
        cost_type = "labor" if "人工" in cat else "repair"
        parts.append(f"costType: '{cost_type}' as const")
    if row.get("maintenanceYears"):
        parts.append(f"maintenanceYears: {fmt_num(row['maintenanceYears'])}")
    if row.get("totalLifecycleCost"):
        # Excel 中已经是万元
        parts.append(f"totalLifecycleCost: {fmt_num(row['totalLifecycleCost'])}")
    return f"      {{ {', '.join(parts)} }},"


def ts_str(s):
    s = str(s).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ")
    return f"'{s}'"


def fmt_num(n):
    if isinstance(n, float) and n.is_integer():
        return str(int(n))
    return str(n)


out = []
out.append("export const techDefaultInvestments: TechDefaultInvestment[] = [")

# 按 techId 1-12 顺序输出
for i in range(1, 13):
    tech_id = str(i)
    if tech_id not in data:
        continue
    d = data[tech_id]
    out.append(f"  {{")
    out.append(f"    techId: '{tech_id}',")
    out.append(f"    equipment: [")
    for row in d["equipment"]:
        out.append(fmt_row(row))
    out.append(f"    ],")
    out.append(f"    materials: [")
    for row in d["materials"]:
        out.append(fmt_row(row))
    out.append(f"    ],")
    out.append(f"    installation: [")
    for row in d["installation"]:
        out.append(fmt_row(row))
    out.append(f"    ],")
    out.append(f"    maintenance: [")
    for row in d["maintenance"]:
        out.append(fmt_row(row))
    out.append(f"    ],")
    out.append(f"  }},")

out.append("];")

print("\n".join(out))
