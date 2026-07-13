#!/usr/bin/env python3
"""压缩超过 Supabase 免费账户 50MB 限制的 PDF，并更新 pdf-matches.json 路径。"""
from __future__ import annotations
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_MATCHES = ROOT / "scripts" / "pdf-matches.json"
COMPRESSED_DIR = ROOT / "scripts" / "compressed-pdfs"
SIZE_LIMIT = 50 * 1024 * 1024


def compress(input_path: Path, output_path: Path) -> None:
    cmd = [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/screen",
        "-dColorImageResolution=100",
        "-dGrayImageResolution=100",
        "-dMonoImageResolution=200",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        str(input_path),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    COMPRESSED_DIR.mkdir(exist_ok=True)
    matches = json.loads(PDF_MATCHES.read_text(encoding="utf-8"))
    large: list[tuple[str, Path, int]] = []

    for std_id, file_path in matches.items():
        p = Path(file_path)
        size = p.stat().st_size
        if size > SIZE_LIMIT:
            large.append((std_id, p, size))

    print(f"发现 {len(large)} 个超过 50MB 的 PDF")
    for std_id, p, size in large:
        print(f"  {std_id}: {p.name} ({size / 1024 / 1024:.1f}MB)")

    for std_id, input_path, original_size in large:
        output_path = COMPRESSED_DIR / f"{std_id}.pdf"
        if output_path.exists() and output_path.stat().st_size <= SIZE_LIMIT:
            print(f"{std_id}: 已存在压缩文件 ({output_path.stat().st_size / 1024 / 1024:.1f}MB)")
            matches[std_id] = str(output_path)
            continue

        print(f"{std_id}: 压缩中 ... ", end="", flush=True)
        compress(input_path, output_path)
        new_size = output_path.stat().st_size
        print(f"{original_size / 1024 / 1024:.1f}MB -> {new_size / 1024 / 1024:.1f}MB")
        matches[std_id] = str(output_path)

    PDF_MATCHES.write_text(json.dumps(matches, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n已更新 {PDF_MATCHES}")


if __name__ == "__main__":
    main()
