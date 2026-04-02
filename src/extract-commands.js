#!/usr/bin/env node
/**
 * extract-commands.js - Extract English descriptions from plugin directory
 * Extracts English descriptions from ~/.claude/plugins/marketplaces/
 * Outputs to stdout or specified file
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get plugin directory dynamically
function getPluginBase() {
  const home = os.homedir();
  return path.join(home, '.claude', 'plugins', 'marketplaces');
}

// ========== Get project directory path ==========
function getProjectBase() {
  // Prefer project directory
  const projectSrc = path.join(__dirname);
  if (fs.existsSync(projectSrc)) {
    return projectSrc;
  }
  // Fallback to install directory
  const home = process.env.HOME || os.homedir();
  return path.join(home, '.claude', 'i18n', 'src');
}

// English description detection
function isEnglish(text) {
  if (!text || text.length < 5) return false;
  const chineseRegex = /[\u4e00-\u9fff]/;
  if (chineseRegex.test(text)) return false;
  return true;
}

// Extract description
function extractDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Prefer description: field
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const match = lines[i].match(/^description:\s*(.+)/i);
    if (match) {
      return match[1].trim();
    }
  }

  // Use # title if no description
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

// Scan plugin commands and skills directories
function scanPlugins() {
  const seen = new Set();
  const files = [];

  const PLUGIN_BASE = getPluginBase();

  if (!fs.existsSync(PLUGIN_BASE)) {
    console.error(`Plugin directory not found: ${PLUGIN_BASE}`);
    process.exit(1);
  }

  const plugins = fs.readdirSync(PLUGIN_BASE);

  for (const plugin of plugins) {
    // Scan commands directory
    const commandsDir = path.join(PLUGIN_BASE, plugin, 'commands');
    if (fs.existsSync(commandsDir)) {
      const cmdFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));
      for (const file of cmdFiles) {
        const filePath = path.join(commandsDir, file);
        const desc = extractDescription(filePath);
        if (desc && isEnglish(desc)) {
          const cleanDesc = desc.replace(/^["']|["']$/g, '');
          const key = `${plugin}|commands/${file}|${cleanDesc}`;
          if (!seen.has(key)) {
            seen.add(key);
            // Output format: [plugin/path] description
            files.push(`[${plugin}/commands/${file}] ${cleanDesc}`);
          }
        }
      }
    }

    // Scan skills directory
    const skillsDir = path.join(PLUGIN_BASE, plugin, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillDirs = fs.readdirSync(skillsDir);
      for (const skillDir of skillDirs) {
        const skillPath = path.join(skillsDir, skillDir);
        if (!fs.statSync(skillPath).isDirectory()) continue;

        const skillFile = path.join(skillPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const desc = extractDescription(skillFile);
          if (desc && isEnglish(desc)) {
            const cleanDesc = desc.replace(/^["']|["']$/g, '');
            const key = `${plugin}|skills/${skillDir}|${cleanDesc}`;
            if (!seen.has(key)) {
              seen.add(key);
              // Output format: [plugin/path] description
              files.push(`[${plugin}/skills/${skillDir}/SKILL.md] ${cleanDesc}`);
            }
          }
        }
      }
    }
  }

  return files;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const outputPath = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

  console.log('Scanning plugin directory to extract English descriptions...\n');

  const items = scanPlugins();

  if (items.length === 0) {
    console.log('No English descriptions found');
    return;
  }

  const content = items.join('\n');

  if (outputPath) {
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Extracted: ${items.length} English descriptions`);
    console.log(`Output file: ${outputPath}`);
  } else {
    // Output to stdout
    console.log(content);
  }
}

main();
