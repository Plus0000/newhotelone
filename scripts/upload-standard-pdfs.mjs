#!/usr/bin/env node
/**
 * 将桌面 PDF 上传到 Supabase Storage standards-pdfs bucket。
 * 使用原生 fetch 直接调用 Storage REST API，避免 supabase-js 在 Node 20 下的 WebSocket 问题。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://avspelligllvkiwxgyev.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_T_5dfGifz2jfjVaomiEE8A_Rrv0AX2P";
const BUCKET = "standards-pdfs";

const matches = JSON.parse(await readFile("./scripts/pdf-matches.json", "utf8"));

async function listBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix: "", limit: 1000, offset: 0 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`无法列出 bucket: ${err}`);
  }
  const data = await res.json();
  return new Set(data.map((f) => f.name));
}

async function uploadFile(stdId, filePath) {
  const storagePath = `${stdId}.pdf`;
  const bytes = await readFile(filePath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": "application/pdf",
      "x-upsert": "false",
    },
    body: bytes,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

async function main() {
  const entries = Object.entries(matches);
  console.log(`准备上传 ${entries.length} 个 PDF 到 ${BUCKET}`);

  let existing;
  try {
    existing = await listBucket();
    console.log(`bucket 中已有 ${existing.size} 个文件`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const [id, filePath] of entries) {
    const storagePath = `${id}.pdf`;
    process.stdout.write(`[${id}] ${path.basename(filePath)} ... `);

    if (existing.has(storagePath)) {
      console.log("已存在，跳过");
      skipped++;
      continue;
    }

    try {
      await uploadFile(id, filePath);
      console.log("成功");
      success++;
    } catch (err) {
      console.log(`失败: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n完成：成功 ${success}，跳过 ${skipped}，失败 ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
