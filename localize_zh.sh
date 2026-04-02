#!/bin/bash
# localize_zh.sh - Claude Code i18n 手工本地化工具（中文版）

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"

show_help() {
  echo "Claude Code i18n 本地化工具"
  echo ""
  echo "用法: ./localize_zh.sh <命令> [语言代码]"
  echo ""
  echo "命令:"
  echo "  --cli <lang>       只翻译 CLI 界面"
  echo "  --plugins <lang>   只翻译插件"
  echo "  --all <lang>       翻译所有（CLI + 插件）"
  echo "  --extract          提取插件词条到 src/keywords/"
  echo "  --restore <lang>   恢复英文（需要指定原语言）"
  echo "  --help             显示帮助"
}

case "$1" in
  --cli)
    [ -z "$2" ] && echo "错误: 请指定语言代码" && exit 1
    node "$SRC_DIR/cli-localize.js" --lang "$2"
    ;;
  --plugins)
    [ -z "$2" ] && echo "错误: 请指定语言代码" && exit 1
    node "$SRC_DIR/plugins-localize.js" --lang "$2"
    ;;
  --all)
    [ -z "$2" ] && echo "错误: 请指定语言代码" && exit 1
    node "$SRC_DIR/cli-localize.js" --lang "$2"
    node "$SRC_DIR/plugins-localize.js" --lang "$2"
    ;;
  --extract)
    node "$SRC_DIR/extract-commands.js" --output "$SCRIPT_DIR/src/keywords/plugins.keywords.txt"
    ;;
  --restore)
    [ -z "$2" ] && echo "错误: 请指定原语言代码" && exit 1
    node "$SRC_DIR/cli-localize.js" --restore
    node "$SRC_DIR/plugins-localize.js" --restore --lang "$2"
    ;;
  --help|-h)
    show_help
    ;;
  *)
    show_help
    exit 1
    ;;
esac
