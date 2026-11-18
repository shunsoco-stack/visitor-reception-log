const fs = require("node:fs");
const ts = require("typescript");

// 既存のTypeScriptのみで純粋関数を実行。コンパイル成果物は書き出さない。
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(compiled.outputText, filename);
};

const { createSeed } = require("../src/lib/seed.ts");

const now = "2026-11-18T12:00:00";

function emptyData() {
  return { ...createSeed(now), visits: [], notices: [] };
}

function input(overrides = {}) {
  return {
    date: "2026-11-18",
    time: "13:00",
    company: "みなと通商",
    name: "山岸 拓海",
    count: 2,
    companions: "奥山 奈央",
    employeeId: "employee-1",
    purpose: "打合せ",
    destination: "受付ロビー",
    memo: "仕様確認のための来訪",
    ...overrides,
  };
}

module.exports = { now, emptyData, input };
