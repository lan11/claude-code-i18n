# Claude Code i18n - 国际化技能

## 触发指令

当用户说"阅读理解整体项目，后执行 SKILL.md 将界面语言设置为 xx"时，激活本技能。

## 概述

本技能用于将 Claude Code 界面翻译成用户需要的语言，支持：
- 界面词条翻译（配置面板、命令描述、快捷键提示等）
- 插件命令翻译（从 Marketplace 安装的插件）
- **任何语言**（中文、日语、阿拉伯语、希伯来语等）

## 执行流程

当用户请求"将界面语言设置为 xx"时，按以下步骤执行：

### 步骤 1：解析目标语言

从用户输入中提取目标语言和语言代码：

| 语言 | 代码 |
|------|------|
| 中文 | zh |
| 日语 | ja |
| 韩语 | ko |
| 西班牙语 | es |
| 法语 | fr |
| 德语 | de |
| 阿拉伯语 | ar |
| 希伯来语 | he |
| 俄语 | ru |
| ... | 任何 LLM 支持的语言 |

### 步骤 2：检查翻译文件是否存在

检查以下文件是否存在：
- `src/translations/{lang}/cli.txt` - CLI 翻译文件
- `src/translations/{lang}/plugins.txt` - 插件翻译文件

如果文件不存在，则需要生成。

### 步骤 3：生成 CLI 翻译（如需）

#### 3.1 读取源词条

```bash
cat src/keywords/cli.keywords.txt
```

#### 3.2 调用 LLM 翻译

```
请将以下 Claude Code 界面词条翻译为{language_name}（{lang}）。

要求：
1. 逐行翻译，保持 "原文: 译文" 格式
2. 不要翻译变量占位符如 ${Ok}、${name} 等，保持原样
3. 保持术语一致性
4. 输出纯文本，每行一条翻译
5. 确保每行都有冒号分隔原文和译文

原文：
{keywords_content}

请直接输出翻译结果，不需要其他说明。
```

#### 3.3 校验格式

```javascript
function validateCliTranslation(content) {
  const lines = content.trim().split('\n');
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!line.includes(':')) {
      errors.push(`第 ${i+1} 行缺少冒号分隔符: ${line.substring(0, 50)}`);
    }

    const parts = line.split(':');
    if (parts.length < 2 || !parts[0].trim()) {
      errors.push(`第 ${i+1} 行冒号前内容为空: ${line}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### 3.4 格式错误时重新调用 LLM 修复

如果校验失败，构建修复 prompt：

```
上面的翻译有格式错误，请修复：

错误：
{errors}

请重新翻译，保持 "原文: 译文" 格式，每行必须有冒号分隔。
```

**最多重试 3 次。**

#### 3.5 保存翻译文件

```bash
mkdir -p src/translations/{lang}
# 保存 LLM 输出的翻译内容到 src/translations/{lang}/cli.txt
```

### 步骤 4：生成插件翻译（如需）

#### 4.1 提取当前插件词条

```bash
node src/extract-commands.js --output src/keywords/plugins.keywords.txt
```

#### 4.2 调用 LLM 翻译

```
请将以下 Claude Code 插件描述翻译为{language_name}（{lang}）。

格式说明：
- 每行格式: [插件路径] 描述
- [插件路径] 部分不用翻译，只翻译后面的描述文本
- 保持 [path] 格式不变

示例：
输入：[everything-claude-code-main/commands/aside.md] Answer a quick side question...
输出：[everything-claude-code-main/commands/aside.md] 回答一个简短的附带问题...

要求：
1. 逐行翻译，只翻译描述部分
2. 保持 [path] 分隔符不变
3. 输出纯文本，每行一条

原文：
{plugins_content}

请直接输出翻译结果，不需要其他说明。
```

#### 4.3 校验格式

```javascript
function validatePluginsTranslation(content) {
  const lines = content.trim().split('\n');
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!line.includes(']')) {
      errors.push(`第 ${i+1} 行缺少 ] 分隔符: ${line.substring(0, 50)}`);
    }

    const parts = line.split(']');
    if (parts.length < 2 || !parts[1].trim()) {
      errors.push(`第 ${i+1} 行 ] 后描述为空: ${line}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### 4.4 格式错误时重新调用 LLM 修复（最多 3 次）

#### 4.5 保存翻译文件

```bash
# 保存到 src/translations/{lang}/plugins.txt
```

### 步骤 5：应用翻译

> ⚠️ **注意**：如果遇到权限问题，使用 `sudo` 提权运行。

```bash
# 应用 CLI 翻译
./localize.sh --cli {lang}

# 应用插件翻译
./localize.sh --plugins {lang}

# 或一次性应用所有
./localize.sh --all {lang}
```

### 步骤 6：完成

告诉用户：
```
{language_name}界面已配置完成！

请重启 Claude Code 即可使用{language_name}界面。

如需切换回英文，请说"执行项目 SKILL.md 将界面语言设置为 English"。
```

## 还原界面

如果需要将界面还原为英文，执行：

```bash
# 还原 CLI 界面
./localize.sh --restore {lang}

# 例如还原日语界面
./localize.sh --restore ja
```

> ⚠️ **注意**：还原需要指定原来翻译时使用的语言代码。