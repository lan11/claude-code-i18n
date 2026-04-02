#!/usr/bin/env node
/**
 * cli-localize.js - Claude Code Interface Localization Engine
 * Supports multiple languages via --lang parameter
 * Supports restore via --restore parameter
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const NC = '\x1b[0m';

// ========== Path Config ==========
function getI18nBase() {
  // Prefer project directory
  const projectSrc = path.join(__dirname);
  if (fs.existsSync(projectSrc)) {
    return projectSrc;
  }
  // Fallback to install directory
  const home = process.env.HOME || os.homedir();
  return path.join(home, '.claude', 'i18n', 'src');
}

// ========== Get Claude Code CLI Path ==========
function getCliPath() {
  const pkgName = '@anthropic-ai/claude-code';

  try {
    const log = execSync(`npm list -g ${pkgName} --depth=0`, { encoding: 'utf8' });
    if (!log.trim().includes(pkgName)) {
      console.log(`${RED}Claude Code not installed: npm install -g ${pkgName}${NC}`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`${RED}Claude Code not installed: npm install -g ${pkgName}${NC}`);
    process.exit(1);
  }

  const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return {
    cliPath: path.join(npmRoot, pkgName, 'cli.js'),
    cliBak: path.join(npmRoot, pkgName, 'cli.bak.js')
  };
}

// ========== Load Translations ==========
function loadTranslations(lang) {
  const i18nBase = getI18nBase();
  const translationFile = path.join(i18nBase, 'translations', lang, 'cli.txt');

  if (!fs.existsSync(translationFile)) {
    console.error(`${RED}Translation file not found: ${translationFile}${NC}`);
    console.error(`Use i18n skill to generate translation file first`);
    process.exit(1);
  }

  const content = fs.readFileSync(translationFile, 'utf8');
  const translations = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Use last colon to split (key may contain colons)
    const lastColonIndex = trimmed.lastIndexOf(':');
    if (lastColonIndex === -1) {
      console.warn(`${YELLOW}Warning: Invalid line (missing colon): ${trimmed.substring(0, 50)}${NC}`);
      continue;
    }

    const key = trimmed.substring(0, lastColonIndex).trim();
    const value = trimmed.substring(lastColonIndex + 1).trim();

    if (key && value) {
      translations[key] = value;
    }
  }

  return translations;
}

// ========== Escape Regex Special Chars ==========
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========== Apply Translation ==========
function applyTranslation(cliPath, translations) {
  const { cliBak } = getCliPath();

  // Check backup
  if (!fs.existsSync(cliBak)) {
    console.error(`${RED}Backup file not found: cli.bak.js${NC}`);
    console.error('Run translation once to create backup first');
    process.exit(1);
  }

  // Restore from backup
  fs.copyFileSync(cliBak, cliPath);

  let content = fs.readFileSync(cliPath, 'utf8');
  const entries = Object.entries(translations);
  let totalReplacements = 0;
  let processedCount = 0;

  for (const [key, value] of entries) {
    const escapedKey = escapeRegex(key).replace(/\\n/g, '\\\\n');
    const newValue = value.replace(/\n/g, '\\n');

    let replaced = false;
    let count = 0;

    if (escapedKey.startsWith('`') || escapedKey.startsWith('\\')) {
      // Template string or special char prefix - direct full-text replace
      const regex = new RegExp(escapedKey, 'g');
      const m = content.match(regex);
      if (m) {
        content = content.replace(regex, value);
        replaced = true;
        count = m.length;
      }
    } else {
      // Double-quoted string
      const doubleRegex = new RegExp(`"${escapedKey}"`, 'g');
      const dm = content.match(doubleRegex);
      if (dm) {
        content = content.replace(doubleRegex, `"${newValue}"`);
        replaced = true;
        count += dm.length;
      }

      // Single-quoted string
      const singleRegex = new RegExp(`'${escapedKey}'`, 'g');
      const sm = content.match(singleRegex);
      if (sm) {
        content = content.replace(singleRegex, `'${newValue}'`);
        replaced = true;
        count += sm.length;
      }
    }

    if (replaced) {
      processedCount++;
      totalReplacements += count;
    }
  }

  fs.writeFileSync(cliPath, content, 'utf8');

  console.log(`${GREEN}Translation complete! ${processedCount}/${entries.length} matched, ${totalReplacements} replacements${NC}`);
}

// ========== Restore English ==========
function restore() {
  const { cliPath, cliBak } = getCliPath();

  if (fs.existsSync(cliBak)) {
    fs.copyFileSync(cliBak, cliPath);
    console.log(`${GREEN}Restored to English interface${NC}`);
  } else {
    console.log(`${YELLOW}Backup file not found${NC}`);
  }

  console.log(`${YELLOW}Please restart Claude Code to apply changes${NC}`);
}

// ========== Main ==========
function main() {
  const args = process.argv.slice(2);

  console.log(`${MAGENTA}==============================================${NC}`);
  console.log(`${MAGENTA}     Claude Code i18n Localization Tool${NC}`);
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log('');

  // --restore param
  if (args.includes('--restore') || args.includes('-r')) {
    console.log(`${MAGENTA}Restoring English interface...${NC}\n`);
    restore();
    return;
  }

  // --lang param
  const langIndex = args.indexOf('--lang');
  const lang = langIndex !== -1 ? args[langIndex + 1] : null;

  if (!lang) {
    console.error(`${RED}Please specify language code: --lang zh${NC}`);
    console.error('Examples:');
    console.error('  node cli-localize.js --lang zh    # Apply Chinese');
    console.error('  node cli-localize.js --lang ja    # Apply Japanese');
    console.error('  node cli-localize.js --restore    # Restore English');
    process.exit(1);
  }

  const { cliPath } = getCliPath();

  console.log(`${GREEN}Target language: ${lang}${NC}`);
  console.log(`${GREEN}CLI path: ${cliPath}${NC}`);
  console.log('');

  const translations = loadTranslations(lang);
  console.log(`${MAGENTA}Applying translations...${NC}\n`);

  applyTranslation(cliPath, translations);

  console.log('');
  console.log(`${YELLOW}Please restart Claude Code to apply translations${NC}`);
}

main();
