[English](./README.md) | [中文](./README_ch.md)

# Claude Code i18n

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-orange.svg)](https://claude.ai/code)

> Claude Code 国际化框架，支持任何语言的本地化翻译

## 参考项目

本项目基于 [cute-claude-hooks](https://github.com/gugug168/cute-claude-hooks) 改造而来：

- **界面本地化**：参考 `cute-claude-hooks` 项目的源码实现
- **第三方插件本地化**：为 Claude Code Marketplace 的第三方插件编写的本地化支持

## 功能

### 界面本地化

将 Claude Code 的界面翻译成任何语言：
- ✅ 配置面板翻译
- ✅ 斜杠命令说明翻译
- ✅ 快捷键提示翻译
- ✅ 欢迎界面翻译
- ✅ **任何语言**（中文、日语、阿拉伯语、希伯来语等）

### 插件命令本地化

支持翻译从 [Claude Code Marketplace](https://claude.ai/plugins) 安装的第三方插件：
- ✅ 插件命令描述翻译
- ✅ 插件技能说明翻译

### 全自动工作流

用户只需告诉 Claude Code 想用什么语言，系统自动完成：
1. 提取待翻译词条
2. 调用大模型翻译
3. 校验翻译格式
4. 应用翻译到 Claude Code

## 使用

### 方式一：全自动（推荐）

```bash
# 1. 克隆项目
git clone <repo>
cd claude-code-localized

# 启动 Claude Code
claude

# 2. 执行翻译
# 例如: "阅读理解整体项目，后执行 SKILL.md 将界面语言设置为 xx"
```

### 方式二：手工操作

手工操作适合需要精细控制翻译质量的场景。

#### 步骤 1：克隆项目

```bash
git clone <repo>
cd claude-code-localized
```

#### 步骤 2：翻译 CLI 词条

1. 查看源词条文件：
```bash
cat src/keywords/cli.keywords.txt
```

2. 人工翻译每一行，格式为 `原文: 译文`

3. 保存到翻译目录（以 zh 为例）：
```bash
mkdir -p src/translations/zh
# 将翻译内容保存到 src/translations/zh/cli.txt
```

#### 步骤 3：提取并翻译插件词条

1. 提取当前插件描述：
```bash
./localize.sh --extract
cat src/keywords/plugins.keywords.txt
```

2. 人工翻译插件描述，格式为 `[插件路径] 英文描述: 译文`

3. 保存到翻译目录：
```bash
# 将翻译内容保存到 src/translations/zh/plugins.txt
```

#### 步骤 4：应用翻译

```bash
# 翻译所有（CLI + 插件）
./localize.sh --all zh

# 或分别翻译
./localize.sh --cli zh    # 只翻译 CLI
./localize.sh --plugins zh  # 只翻译插件
```

#### 步骤 5：恢复英文

如果需要还原为英文界面（需指定原语言）：

```bash
./localize.sh --restore zh
```

### 手工修改翻译

如果大模型翻译质量不满意，可以手动编辑翻译文件：
- CLI 翻译：`src/translations/{lang}/cli.txt`
- 插件翻译：`src/translations/{lang}/plugins.txt`

修改后重新运行 `./localize.sh --all {lang}`


## 项目结构

```
claude-code-i18n/
├── README.md                    # 英文说明
├── README_ch.md                # 中文说明
├── SKILL.md                     # 主技能入口
├── localize.sh                  # 命令行入口
└── src/
    ├── keywords/                # 原始英文词条
    │   └── cli.keywords.txt     # CLI 界面词条
    ├── translations/            # 翻译文件（按需生成）
    │   └── {lang}/
    │       ├── cli.txt          # CLI 翻译
    │       └── plugins.txt      # 插件翻译
    ├── cli-localize.js          # CLI 本地化引擎
    ├── plugins-localize.js      # 插件本地化引擎
    └── extract-commands.js     # 提取插件描述
```

## 工作原理

1. **用户请求**：用户说"我要中文界面"
2. **自动翻译**：SKILL.md 技能自动调用大模型翻译所有词条
3. **格式校验**：翻译后自动校验格式，错误自动修复
4. **应用翻译**：将翻译应用到 Claude Code
5. **完成**：用户重启 Claude Code 即可使用

## 支持的语言

**任何大模型能翻译的语言都支持！**

包括但不限于：
- 中文 (zh)
- 日语 (ja)
- 韩语 (ko)
- 西班牙语 (es)
- 法语 (fr)
- 德语 (de)
- 阿拉伯语 (ar)
- 希伯来语 (he)
- 俄语 (ru)
- ...

## 技术细节

### 翻译文件格式

**CLI 词条 (cli.txt)：**
```
原文: 译文
原文: 译文
```

**插件词条 (plugins.txt)：**
```
[plugin/path] 英文描述: 翻译后描述
[plugin/path] 英文描述: 翻译后描述
```

### 防御性设计

- 翻译格式自动校验
- 格式错误自动重试（最多 3 次）
- 原始文件自动备份
- 损坏时自动恢复

## 许可证

[MIT License](./LICENSE)
