/**
 * react-async-hook@3.6.1 publishes `"module": "react-async-hook.esm.js"`
 * but the file lives at dist/react-async-hook.esm.js. Metro's web resolver
 * follows `module` and fails to bundle react-native-country-picker-modal.
 */
const fs = require("fs");
const path = require("path");

const pkgPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-async-hook",
  "package.json",
);

if (!fs.existsSync(pkgPath)) {
  console.log("[fix-react-async-hook] package not installed (ok)");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const declared = pkg.module;
if (typeof declared !== "string" || declared.length === 0) {
  process.exit(0);
}

const root = path.dirname(pkgPath);
if (fs.existsSync(path.join(root, declared))) {
  console.log("[fix-react-async-hook] module field already resolvable");
  process.exit(0);
}

const candidateName = path.posix.join("dist", path.basename(declared));
if (!fs.existsSync(path.join(root, candidateName))) {
  console.log("[fix-react-async-hook] no dist replacement found (ok)");
  process.exit(0);
}

pkg.module = candidateName;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`[fix-react-async-hook] module field set to ${pkg.module}`);
