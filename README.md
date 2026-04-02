[English](./README.md) | [中文](./README_ch.md)

# Claude Code i18n

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-orange.svg)](https://claude.ai/code)

> Claude Code i18n framework with support for any language

## Project Origin

This project is based on [cute-claude-hooks](https://github.com/gugug168/cute-claude-hooks):

- **Interface localization**: Reference implementation from `cute-claude-hooks` localize_ecc module
- **Third-party plugin localization**: Custom localization support for Claude Code Marketplace plugins

## Features

### Interface Localization

Translate Claude Code interface into any language:
- ✅ Settings panel translation
- ✅ Slash command descriptions
- ✅ Keyboard shortcut hints
- ✅ Welcome screen translation
- ✅ **Any language** (Chinese, Japanese, Arabic, Hebrew, etc.)

### Plugin Command Localization

Translate third-party plugins installed from [Claude Code Marketplace](https://claude.ai/plugins):
- ✅ Plugin command descriptions
- ✅ Plugin skill documentation

### Fully Automated Workflow

Users only need to tell Claude Code which language they want - the system automatically:
1. Extracts strings to translate
2. Calls LLM for translation
3. Validates translation format
4. Applies translations to Claude Code

## Usage

### Method 1: Fully Automated (Recommended)

```bash
# 1. Clone the project
git clone <repo>
cd claude-code-localized

# 2. Start Claude Code
claude

# 3. Execute translation
# Example: "Read the project, then execute SKILL.md to set interface language to xx"
```

### Method 2: Manual Operation

Manual operation is suitable for scenarios requiring fine-grained translation quality control.

#### Step 1: Clone the project

```bash
git clone <repo>
cd claude-code-localized
```

#### Step 2: Translate CLI keywords

1. View source keywords:
```bash
cat src/keywords/cli.keywords.txt
```

2. Manually translate each line in format `original: translation`

3. Save to translations directory (example for zh):
```bash
mkdir -p src/translations/zh
# Save translated content to src/translations/zh/cli.txt
```

#### Step 3: Extract and translate plugin keywords

1. Extract current plugin descriptions:
```bash
./localize.sh --extract
cat src/keywords/plugins.keywords.txt
```

2. Manually translate plugin descriptions in format `[plugin/path] English description: Translation`

3. Save to translations directory:
```bash
# Save translated content to src/translations/zh/plugins.txt
```

#### Step 4: Apply translations

```bash
# Translate all (CLI + plugins)
./localize.sh --all zh

# Or translate separately
./localize.sh --cli zh        # CLI only
./localize.sh --plugins zh    # plugins only
```

#### Step 5: Restore English

To restore English interface (requires original language):

```bash
./localize.sh --restore zh
```

### Manual Translation Editing

If LLM translation quality is unsatisfactory, manually edit translation files:
- CLI translations: `src/translations/{lang}/cli.txt`
- Plugin translations: `src/translations/{lang}/plugins.txt`

After editing, run `./localize.sh --all {lang}` to reapply.

## Project Structure

```
claude-code-i18n/
├── README.md                    # English README
├── README_ch.md                 # Chinese README
├── SKILL.md                     # Main skill entry
├── localize.sh                  # CLI entry point
└── src/
    ├── keywords/                # Original English keywords
    │   └── cli.keywords.txt    # CLI interface keywords
    ├── translations/            # Translation files (generated as needed)
    │   └── {lang}/
    │       ├── cli.txt         # CLI translations
    │       └── plugins.txt     # Plugin translations
    ├── cli-localize.js         # CLI localization engine
    ├── plugins-localize.js     # Plugin localization engine
    └── extract-commands.js    # Extract plugin descriptions
```

## How It Works

1. **User Request**: User says "I want Chinese interface"
2. **Auto Translation**: SKILL.md skill calls LLM to translate all strings
3. **Format Validation**: Automatically validates format, fixes errors
4. **Apply**: Applies translations to Claude Code
5. **Done**: User restarts Claude Code to use new interface

## Supported Languages

**Any language that LLM can translate!**

Including but not limited to:
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Spanish (es)
- French (fr)
- German (de)
- Arabic (ar)
- Hebrew (he)
- Russian (ru)
- ...

## Technical Details

### Translation File Format

**CLI keywords (cli.txt):**
```
original text: translated text
original text: translated text
```

**Plugin keywords (plugins.txt):**
```
[plugin/path] English description: translated description
[plugin/path] English description: translated description
```

### Defensive Design

- Automatic translation format validation
- Automatic retry on format errors (up to 3 times)
- Automatic backup of original files
- Automatic restoration on corruption

## License

[MIT License](./LICENSE)
