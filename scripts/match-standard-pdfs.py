#!/usr/bin/env python3
from __future__ import annotations
"""分析桌面 PDF 与 standards.json 的匹配情况，不执行上传。"""
import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = Path("/Users/plus0/Desktop/技术交底-20260701/规范标准库(1)/规范标准（共256本，已收集156，持续补充）")


def normalize_code(code: str) -> str:
    """标准化编号用于匹配：去空格、统一斜杠、全大写。"""
    return code.upper().replace(" ", "").replace("/", "").replace("-", "").replace("—", "")


_EDITION_SUFFIX_RE = re.compile(r"[（(]\d{4}年(?:版|修订)[）)]|[（(]\d{4}修订版[）)]|[（(]\d{4}年版[）)]")


def normalize_name(n: str) -> str:
    n = _EDITION_SUFFIX_RE.sub("", n)
    return n.lower().replace(" ", "").replace("（", "").replace("）", "").replace("(", "").replace(")", "").replace("/", "")


_EDITION_RE = re.compile(r"^\d{4}年(?:版|修订)|^\d{4}修订版|^[（(]\d{4}")
_CODE_LIKE_RE = re.compile(r"[A-Za-z0-9]")


def _find_last_parens(text: str) -> tuple[int, int, str] | None:
    """找到最后一个成对的括号（全角或半角），返回 (start, end, content)。"""
    # 优先找全角括号对
    for i in range(len(text) - 1, -1, -1):
        if text[i] == "（":
            close = text.find("）", i)
            if close != -1:
                return i, close, text[i + 1 : close]
    # 再找半角括号对
    for i in range(len(text) - 1, -1, -1):
        if text[i] == "(":
            close = text.find(")", i)
            if close != -1:
                return i, close, text[i + 1 : close]
    return None


def extract_from_pdf_filename(filename: str) -> tuple[str | None, str | None]:
    """从 PDF 文件名提取名称和编号；支持嵌套括号和版本后缀。"""
    name = filename[:-4].strip()
    # 去除书名号
    name_clean = re.sub(r"^[《\s]+|[\s》]+$", "", name)

    # 1. 图集类：编号 名称，如 "15K519 暖通空调设计常用数据"
    m = re.match(r"^(\d+[A-Z]\d+)\s+(.+)$", name_clean)
    if m:
        body = re.sub(r"[《\s]+|[\s》]+$", "", m.group(2))
        return body, m.group(1).strip()

    # 2. 找最后一对括号作为候选编号
    body = name_clean
    code = None
    while True:
        paren = _find_last_parens(body)
        if not paren:
            break
        start, end, content = paren
        candidate_body = body[:start].strip()
        # 如果候选编号像年份/版本后缀：前面还有括号就继续往前找，否则视为无编号
        if _EDITION_RE.search(content):
            if _find_last_parens(candidate_body):
                body = candidate_body
                continue
            else:
                body = candidate_body
                break
        # 如果候选编号里没有任何字母数字，忽略
        if not _CODE_LIKE_RE.search(content):
            body = candidate_body
            continue
        body = candidate_body
        code = content.strip()
        break

    body = re.sub(r"[《\s]+|[\s》]+$", "", body)
    return body or name_clean, code


def main() -> None:
    standards = json.loads((ROOT / "scripts" / "standards.json").read_text(encoding="utf-8"))
    by_code = {normalize_code(s["code"]): s for s in standards if s["code"]}
    by_name = {normalize_name(s["name"]): s for s in standards}

    # 特殊文件名到标准 id 的兜底映射
    MANUAL_OVERRIDES: dict[str, str] = {
        "三级医院评审标准": "79",
        "武汉市民用建筑能耗限额指南": "229",
    }

    pdf_files = list(PDF_DIR.rglob("*.pdf"))
    matched: list[tuple[Path, dict]] = []
    unmatched: list[tuple[Path, str | None]] = []
    used_ids: set[str] = set()

    for pdf in pdf_files:
        name, code = extract_from_pdf_filename(pdf.name)
        std = None
        if code and normalize_code(code) in by_code:
            std = by_code[normalize_code(code)]
        elif name and normalize_name(name) in by_name:
            std = by_name[normalize_name(name)]
        elif name and normalize_name(name) in MANUAL_OVERRIDES:
            std = next(s for s in standards if s["id"] == MANUAL_OVERRIDES[normalize_name(name)])

        if std and std["id"] not in used_ids:
            matched.append((pdf, std))
            used_ids.add(std["id"])
        else:
            unmatched.append((pdf, code))

    print(f"PDF 总数: {len(pdf_files)}")
    print(f"匹配成功: {len(matched)}")
    print(f"未匹配: {len(unmatched)}")
    print()

    if unmatched:
        print("未匹配的 PDF（前 20）:")
        for pdf, code in unmatched[:20]:
            print(f"  {pdf.name} | 提取编号: {code}")
        print()

    # 按分类统计匹配
    cat_counts = Counter(s["category"] for _, s in matched)
    print("按分类匹配统计:")
    for cat, cnt in cat_counts.most_common():
        print(f"  {cat}: {cnt}")
    print()

    # Excel 中标记 hasPdf 但没匹配到的
    pdf_std_ids = {s["id"] for _, s in matched}
    missing_pdf = [s for s in standards if s["hasPdf"] and s["id"] not in pdf_std_ids]
    print(f"Excel 标记有 PDF 但未匹配到的条目: {len(missing_pdf)}")
    for s in missing_pdf[:10]:
        print(f"  {s['id']}: {s['name']} ({s['code']})")

    # 写出匹配结果供上传脚本使用
    matches = {std["id"]: str(pdf) for pdf, std in matched}
    (ROOT / "scripts" / "pdf-matches.json").write_text(
        json.dumps(matches, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n匹配映射已写入 scripts/pdf-matches.json")


if __name__ == "__main__":
    main()
