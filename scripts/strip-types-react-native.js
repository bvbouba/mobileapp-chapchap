/**
 * React Native 0.81+ ships its own TypeScript types.
 * Transitive @types/react-native (e.g. from @gorhom/bottom-sheet) conflicts
 * with React 19 and breaks JSX checks ("ScrollView cannot be used as a JSX component").
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

try {
  execSync(
    "find node_modules -type d -path '*/@types/react-native' -prune -print -exec rm -rf {} +",
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  console.log("[strip-types-react-native] Removed stale @types/react-native installs");
} catch (e) {
  // find returns non-zero when nothing matches — that's fine
  console.log("[strip-types-react-native] No @types/react-native found (ok)");
}
