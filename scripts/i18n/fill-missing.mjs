import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve(process.cwd(), "messages");
const sourceLocale = "es";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cloneValue(v)]));
  }
  return value;
}

function mergeMissing(source, target, stats) {
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) {
      stats.filled += 1;
      return cloneValue(source);
    }

    const next = [...target];
    for (let i = 0; i < source.length; i += 1) {
      if (next[i] === undefined) {
        next[i] = cloneValue(source[i]);
        stats.filled += 1;
      } else {
        next[i] = mergeMissing(source[i], next[i], stats);
      }
    }
    return next;
  }

  if (source && typeof source === "object") {
    const base = target && typeof target === "object" && !Array.isArray(target) ? { ...target } : {};
    for (const [key, value] of Object.entries(source)) {
      if (!(key in base)) {
        base[key] = cloneValue(value);
        stats.filled += 1;
      } else {
        base[key] = mergeMissing(value, base[key], stats);
      }
    }
    return base;
  }

  if (target === undefined) {
    stats.filled += 1;
    return source;
  }

  return target;
}

function main() {
  if (!fs.existsSync(messagesDir)) {
    console.error("messages directory was not found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(messagesDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const sourceFile = `${sourceLocale}.json`;
  if (!files.includes(sourceFile)) {
    console.error(`Source locale file messages/${sourceFile} was not found.`);
    process.exit(1);
  }

  const source = readJson(path.join(messagesDir, sourceFile));
  const localeFiles = files.filter((name) => name !== sourceFile);

  for (const localeFile of localeFiles) {
    const filePath = path.join(messagesDir, localeFile);
    const current = readJson(filePath);
    const stats = { filled: 0 };
    const next = mergeMissing(source, current, stats);

    if (stats.filled > 0) {
      writeJson(filePath, next);
      console.log(`Filled ${stats.filled} missing entries in ${localeFile}`);
    } else {
      console.log(`No missing entries in ${localeFile}`);
    }
  }
}

main();
