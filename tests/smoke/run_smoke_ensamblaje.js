"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const tests = [
  "smoke_entrada_ensamblaje.js",
  "smoke_operativa_ensamblaje.js",
  "smoke_pantallas_ensamblaje.js"
];

if (process.env.ALERGENOS_REAL_USER && process.env.ALERGENOS_REAL_PASSWORD) {
  tests.push("smoke_servicios_reales_ensamblaje.js");
}

for (const testFile of tests) {
  const fullPath = path.join(__dirname, testFile);
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: path.resolve(__dirname, "..", ".."),
    encoding: "utf8"
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("OK run_smoke_ensamblaje");
