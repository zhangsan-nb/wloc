#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const excludedDirectories = new Set([
  ".git",
  ".npm-cache",
  ".wrangler",
  "node_modules",
]);

const forbidden = [
  {
    label: "upstream GitHub Raw",
    value: ["raw.githubusercontent.com", "Yu9191"].join("/"),
  },
  {
    label: "upstream repository",
    value: ["github.com", "Yu9191", "wloc"].join("/"),
  },
  {
    label: "upstream Worker",
    value: ["wloc-spoofer", "wloc", "workers", "dev"].join("."),
  },
  {
    label: "upstream Pages",
    value: ["wloc-pages", "pages", "dev"].join("."),
  },
];

const requiredFiles = [
  "dist/wloc.js",
  "dist/wloc-settings.js",
  "modules/wloc.module",
  "modules/wloc.sgmodule",
  "modules/wloc.conf",
  "modules/wloc.lpx",
  "modules/wloc.stoverride",
  "worker/src/index.js",
  "worker/src/parse.js",
  "worker/src/page.js",
];

const moduleFiles = requiredFiles.filter((file) => file.startsWith("modules/"));
const rawBase = [
  "https:/",
  "raw.githubusercontent.com",
  "zhangsan-nb",
  "wloc",
  "refs",
  "heads",
  "main",
].join("/");

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    if (excludedDirectories.has(entry)) continue;
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...walk(fullPath));
    else if (stat.isFile()) files.push(fullPath);
  }
  return files;
}

function isAllowedSourceReference(path, rule, line) {
  return (
    path === "README.md" &&
    rule.label === "upstream repository" &&
    /上游|来源|自托管备份/.test(line)
  );
}

const failures = [];

for (const required of requiredFiles) {
  if (!existsSync(join(root, required))) {
    failures.push(`${required}: required file is missing`);
  }
}

for (const file of walk(root)) {
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const path = relative(root, file).replaceAll("\\", "/");
  const lines = buffer.toString("utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const rule of forbidden) {
      if (!line.toLowerCase().includes(rule.value.toLowerCase())) continue;
      if (isAllowedSourceReference(path, rule, line)) continue;
      failures.push(`${path}:${index + 1}: ${rule.label}: ${line.trim()}`);
    }
  }
}

for (const moduleFile of moduleFiles) {
  const content = readFileSync(join(root, moduleFile), "utf8");
  if (!content.includes(`${rawBase}/dist/wloc.js`)) {
    failures.push(`${moduleFile}: missing self-hosted dist/wloc.js URL`);
  }
  if (!content.includes(`${rawBase}/dist/wloc-settings.js`)) {
    failures.push(`${moduleFile}: missing self-hosted dist/wloc-settings.js URL`);
  }
}

if (failures.length > 0) {
  console.error("Self-hosted dependency check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Self-hosted dependency check passed.");
}
