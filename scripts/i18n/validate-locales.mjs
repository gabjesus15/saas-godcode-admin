import fs from "node:fs";
import path from "node:path";

const messagesDir = path.resolve(process.cwd(), "messages");
const sourceLocale = "es";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenKeys(value, prefix = "", output = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenKeys(item, `${prefix}[${index}]`, output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenKeys(child, next, output);
    }
    return output;
  }

  output.set(prefix, typeof value);
  return output;
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

  const sourceMap = flattenKeys(readJson(path.join(messagesDir, sourceFile)));
  const localeFiles = files.filter((name) => name !== sourceFile);

  let hasIssues = false;

  for (const localeFile of localeFiles) {
    const locale = localeFile.replace(/\.json$/, "");
    const localeMap = flattenKeys(readJson(path.join(messagesDir, localeFile)));

    const missing = [];
    const extra = [];
    const typeMismatches = [];

    for (const [key, type] of sourceMap.entries()) {
      if (!localeMap.has(key)) {
        missing.push(key);
        continue;
      }

      const localeType = localeMap.get(key);
      if (localeType !== type) {
        typeMismatches.push(`${key} (expected ${type}, got ${localeType})`);
      }
    }

    for (const key of localeMap.keys()) {
      if (!sourceMap.has(key)) {
        extra.push(key);
      }
    }

    if (missing.length || extra.length || typeMismatches.length) {
      hasIssues = true;
      console.error(`\nLocale ${locale} has i18n inconsistencies:`);
      if (missing.length) {
        console.error(`  Missing keys (${missing.length}):`);
        missing.slice(0, 20).forEach((key) => console.error(`    - ${key}`));
      }
      if (typeMismatches.length) {
        console.error(`  Type mismatches (${typeMismatches.length}):`);
        typeMismatches.slice(0, 20).forEach((item) => console.error(`    - ${item}`));
      }
      if (extra.length) {
        console.error(`  Extra keys (${extra.length}):`);
        extra.slice(0, 20).forEach((key) => console.error(`    - ${key}`));
      }
    } else {
      console.log(`Locale ${locale} is consistent.`);
    }
  }

  if (hasIssues) {
    console.error("\nLocale validation failed.");
    process.exit(1);
  }

  console.log("\nAll locales are consistent.");
}

main();
