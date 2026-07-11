#!/usr/bin/env python3
"""
Excel 结构探测脚本 - Phase 1.0 前置

对桌面所有 Excel 文件输出:
- sheet 名列表
- 每个 sheet 的列名(第 1 行)
- 每个 sheet 的前 3 行数据
- 每个 sheet 的总行数
- 特殊字符扫描(£/R/合并单元格标记等)
- 数据类型推断(数字/字符串/日期)

跨表一致性检查:
- 6 张计算表的"机电系统"字段值要一致
- 12 个设备表的"技术名称"和 techEntries 的 techName 要一致
- 碳排放因子表的"省份"和 energyPriceReferences 的 location 要一致
- 12 个设备表的"运维分类"枚举值要统一

输出: docs/superpowers/progress/excel-structure-report.md
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Any

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

DESKTOP_ROOT = Path("/Users/plus0/Desktop/技术交底-20260701")
OUTPUT_FILE = Path("docs/superpowers/progress/excel-structure-report.md")

SPECIAL_CHARS = ["£", "R", " ", "﻿"]


def probe_sheet(ws) -> dict[str, Any]:
    """探测单个 sheet 的结构。"""
    result: dict[str, Any] = {
        "sheet_name": ws.title,
        "max_row": ws.max_row,
        "max_col": ws.max_column,
        "headers": [],
        "first_3_rows": [],
        "special_chars_found": [],
        "merged_cells_count": len(ws.merged_cells.ranges),
        "column_types": {},
    }

    for col in range(1, ws.max_column + 1):
        val = ws.cell(row=1, column=col).value
        result["headers"].append(str(val) if val is not None else "")

    for row in range(2, min(5, ws.max_row + 1)):
        row_data = []
        for col in range(1, ws.max_column + 1):
            val = ws.cell(row=row, column=col).value
            row_data.append(val)
        result["first_3_rows"].append(row_data)

    for col in range(1, ws.max_column + 1):
        types_seen = set()
        for row in range(2, min(12, ws.max_row + 1)):
            val = ws.cell(row=row, column=col).value
            if val is None:
                continue
            types_seen.add(type(val).__name__)
        result["column_types"][result["headers"][col - 1]] = list(types_seen)

    special_hits: list[dict[str, Any]] = []
    for row in ws.iter_rows():
        for cell in row:
            if cell.value is None:
                continue
            s = str(cell.value)
            for ch in SPECIAL_CHARS:
                if ch in s:
                    special_hits.append({
                        "char": ch,
                        "cell": f"{get_column_letter(cell.column)}{cell.row}",
                        "value": s[:50],
                    })
                    if len(special_hits) >= 5:
                        break
            if len(special_hits) >= 5:
                break
        if len(special_hits) >= 5:
            break
    result["special_chars_found"] = special_hits

    return result


def probe_file(filepath: Path) -> dict[str, Any]:
    """探测单个 Excel 文件。"""
    wb = load_workbook(filepath, data_only=True, read_only=False)
    sheets = []
    for ws in wb.worksheets:
        sheets.append(probe_sheet(ws))
    wb.close()
    return {
        "file_path": str(filepath.relative_to(DESKTOP_ROOT)),
        "file_name": filepath.name,
        "sheets": sheets,
    }


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    xlsx_files = sorted(DESKTOP_ROOT.rglob("*.xlsx"))
    xlsx_files = [f for f in xlsx_files if not f.name.startswith(".~")]
    print(f"Found {len(xlsx_files)} xlsx files")

    results = []
    for f in xlsx_files:
        print(f"Probing: {f.name}")
        try:
            results.append(probe_file(f))
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append({
                "file_path": str(f.relative_to(DESKTOP_ROOT)),
                "file_name": f.name,
                "error": str(e),
            })

    with open("/tmp/excel-probe-results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)

    print(f"\nResults dumped to /tmp/excel-probe-results.json")
    print(f"Next: render to Markdown in Step 2")


if __name__ == "__main__":
    main()
