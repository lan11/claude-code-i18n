#!/bin/bash
# localize.sh - Claude Code i18n Manual Localization Tool

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"

show_help() {
  echo "Claude Code i18n Localization Tool"
  echo ""
  echo "Usage: ./localize.sh <command> [language code]"
  echo ""
  echo "Commands:"
  echo "  --cli <lang>       Translate CLI interface only"
  echo "  --plugins <lang>   Translate plugins only"
  echo "  --all <lang>       Translate all (CLI + plugins)"
  echo "  --extract          Extract plugin keywords to src/keywords/"
  echo "  --restore <lang>   Restore English (requires original language)"
  echo "  --help             Show this help"
}

case "$1" in
  --cli)
    [ -z "$2" ] && echo "Error: Please specify language code" && exit 1
    node "$SRC_DIR/cli-localize.js" --lang "$2"
    ;;
  --plugins)
    [ -z "$2" ] && echo "Error: Please specify language code" && exit 1
    node "$SRC_DIR/plugins-localize.js" --lang "$2"
    ;;
  --all)
    [ -z "$2" ] && echo "Error: Please specify language code" && exit 1
    node "$SRC_DIR/cli-localize.js" --lang "$2"
    node "$SRC_DIR/plugins-localize.js" --lang "$2"
    ;;
  --extract)
    node "$SRC_DIR/extract-commands.js" --output "$SCRIPT_DIR/src/keywords/plugins.keywords.txt"
    ;;
  --restore)
    [ -z "$2" ] && echo "Error: Please specify original language code" && exit 1
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
