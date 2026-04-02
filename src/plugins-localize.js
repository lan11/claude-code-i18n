#!/usr/bin/env node
/**
 * plugins-localize.js - Plugin Command Localization Engine
 * Reads translations from translations/{lang}/plugins.txt
 * Applies to ~/.claude/plugins/marketplaces/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const MAGENTA = '\x1b[38;5;206m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[0;33m';
const RED = '\x1b[0;31m';
const NC = '\x1b[0m';

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

function getPluginBase() {
  // sudo运行时使用原始用户目录
  const home = process.env.SUDO_USER
    ? require('child_process').execSync(`getent passwd ${process.env.SUDO_USER} | cut -d: -f6`).toString().trim()
    : os.homedir();
  return path.join(home, '.claude', 'plugins', 'marketplaces');
}

// ========== Load Translations ==========
function loadTranslations(lang) {
  const i18nBase = getI18nBase();
  const translationFile = path.join(i18nBase, 'translations', lang, 'plugins.txt');

  if (!fs.existsSync(translationFile)) {
    console.error(`${RED}Translation file not found: ${translationFile}${NC}`);
    console.error('Use i18n skill to generate translation file first');
    process.exit(1);
  }

  const content = fs.readFileSync(translationFile, 'utf8');
  const translations = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: [plugin/path] English description: Japanese translation
    const match = trimmed.match(/^\[(.+?)\]\s*(.*)$/);
    if (!match) {
      console.warn(`${YELLOW}Warning: Invalid line (missing ] separator): ${trimmed.substring(0, 50)}${NC}`);
      continue;
    }

    const pluginFile = match[1];
    const rest = match[2] || '';

    // Parse "English: Japanese" format
    const colonIndex = rest.lastIndexOf(':');
    let en, zh;
    if (colonIndex > 0) {
      en = rest.substring(0, colonIndex).trim();
      zh = rest.substring(colonIndex + 1).trim();
    } else {
      en = rest.trim();
      zh = rest.trim(); // Use English when no translation
    }

    translations.push({ pluginFile, en, zh });
  }

  return translations;
}

// ========== Process File ==========
function processFile(filePath, translations, mode) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let newContent = '';
  let changed = false;

  for (const line of lines) {
    // Handle description: field
    const descMatch = line.match(/^description:\s*(.+)/i);
    if (descMatch) {
      const desc = descMatch[1].trim().replace(/^["']|["']$/g, '');

      // localize: match English original, replace with translation
      // restore: match translated Japanese, revert to English
      const searchKey = mode === 'restore' ? 'zh' : 'en';
      const entry = translations.find(t => t[searchKey] === desc);

      if (entry && mode === 'localize') {
        newContent += `description: ${entry.zh}\n`;
        changed = true;
      } else if (entry && mode === 'restore') {
        newContent += `description: ${entry.en}\n`;
        changed = true;
      } else {
        newContent += line + '\n';
      }
      continue;
    }

    // Handle # title
    const titleMatch = line.match(/^#\s+(.+)/);
    if (titleMatch && !line.startsWith('##')) {
      const title = titleMatch[1].trim();

      const searchKey = mode === 'restore' ? 'zh' : 'en';
      const entry = translations.find(t => t[searchKey] === title);

      if (entry && mode === 'localize') {
        newContent += `# ${entry.zh}\n`;
        changed = true;
      } else if (entry && mode === 'restore') {
        newContent += `# ${entry.en}\n`;
        changed = true;
      } else {
        newContent += line + '\n';
      }
      continue;
    }

    newContent += line + '\n';
  }

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

// ========== Apply Translation ==========
function applyTranslation(lang) {
  const translations = loadTranslations(lang);
  const pluginBase = getPluginBase();

  if (!fs.existsSync(pluginBase)) {
    console.log('Plugin directory not found, skipping plugin translation');
    return 0;
  }

  // Build pluginFile -> translation map
  const fileMap = new Map();
  for (const t of translations) {
    fileMap.set(t.pluginFile, t);
  }

  let count = 0;

  for (const plugin of fs.readdirSync(pluginBase)) {
    const pluginDir = path.join(pluginBase, plugin);

    // Scan commands directory
    const commandsDir = path.join(pluginDir, 'commands');
    if (fs.existsSync(commandsDir)) {
      for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'))) {
        const key = `${plugin}/commands/${file}`;
        if (fileMap.has(key)) {
          const filePath = path.join(commandsDir, file);
          if (processFile(filePath, translations, 'localize')) {
            count++;
          }
        }
      }
    }

    // Scan skills directory
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const skillDir of fs.readdirSync(skillsDir)) {
        const skillPath = path.join(skillsDir, skillDir);
        if (!fs.statSync(skillPath).isDirectory()) continue;

        const skillFile = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const key = `${plugin}/skills/${skillDir}/SKILL.md`;
          if (fileMap.has(key)) {
            if (processFile(skillFile, translations, 'localize')) {
              count++;
            }
          }
        }
      }
    }
  }

  return count;
}

// ========== Restore English ==========
function restore(lang) {
  // Restore from translation file, need to know target language
  const i18nBase = getI18nBase();
  const translationFile = path.join(i18nBase, 'translations', lang, 'plugins.txt');

  if (!fs.existsSync(translationFile)) {
    console.error(`${RED}Translation file not found: ${translationFile}${NC}`);
    console.error('Cannot restore English, specify language: --lang ja');
    return;
  }

  const translations = loadTranslations(lang);
  const pluginBase = getPluginBase();

  if (!fs.existsSync(pluginBase)) {
    return;
  }

  // Build pluginFile -> translation map
  const fileMap = new Map();
  for (const t of translations) {
    fileMap.set(t.pluginFile, t);
  }

  let count = 0;

  for (const plugin of fs.readdirSync(pluginBase)) {
    const pluginDir = path.join(pluginBase, plugin);

    // Scan commands directory
    const commandsDir = path.join(pluginDir, 'commands');
    if (fs.existsSync(commandsDir)) {
      for (const file of fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'))) {
        const key = `${plugin}/commands/${file}`;
        if (fileMap.has(key)) {
          const filePath = path.join(commandsDir, file);
          if (processFile(filePath, translations, 'restore')) {
            count++;
          }
        }
      }
    }

    // Scan skills directory
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      for (const skillDir of fs.readdirSync(skillsDir)) {
        const skillPath = path.join(skillsDir, skillDir);
        if (!fs.statSync(skillPath).isDirectory()) continue;

        const skillFile = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const key = `${plugin}/skills/${skillDir}/SKILL.md`;
          if (fileMap.has(key)) {
            if (processFile(skillFile, translations, 'restore')) {
              count++;
            }
          }
        }
      }
    }
  }

  console.log(`${GREEN}Restored plugins to English (using ${lang} translation file)${NC}`);
}

// ========== Main ==========
function main() {
  const args = process.argv.slice(2);

  console.log(`${MAGENTA}==============================================${NC}`);
  console.log(`${MAGENTA}     Claude Code Plugin Localization Tool${NC}`);
  console.log(`${MAGENTA}==============================================${NC}`);
  console.log('');

  // --lang param
  const langIndex = args.indexOf('--lang');
  const lang = langIndex !== -1 ? args[langIndex + 1] : null;

  // --restore param
  if (args.includes('--restore') || args.includes('-r')) {
    if (!lang) {
      console.error(`${RED}Language required to restore: --restore --lang ja${NC}`);
      process.exit(1);
    }
    restore(lang);
    return;
  }

  console.log(`${GREEN}Target language: ${lang}${NC}`);
  console.log('');

  const count = applyTranslation(lang);
  console.log(`${GREEN}Plugin translation complete! Processed ${count} files${NC}`);
}

main();
