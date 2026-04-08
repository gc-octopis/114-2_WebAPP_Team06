#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$SCRIPT_DIR/.venv/bin/activate"

usage() {
  cat <<'EOF'
Usage:
  ./sync_data.sh all
  ./sync_data.sh announcements
  ./sync_data.sh calendar
  ./sync_data.sh links

Commands:
  all             Run all common sync tasks in order.
  announcements   Sync announcements for zh and en.
  calendar        Sync calendar events for zh and en.
  links           Build English links JSON and import links into DB.

Optional environment variables:
  SYNC_MAX_PAGES  Max pages for announcement sync. Example: SYNC_MAX_PAGES=3

Notes:
  1) Run this script from anywhere; paths are resolved automatically.
  2) A Python virtual environment is required at Backend/.venv.
EOF
}

require_venv() {
  if [[ ! -f "$VENV_PATH" ]]; then
    echo "Error: virtual environment not found at $VENV_PATH"
    echo "Please run setup first (e.g. Backend/setup.sh or Backend/setup_macos.sh)."
    exit 1
  fi
}

activate_venv() {
  # shellcheck disable=SC1090
  source "$VENV_PATH"
}

run_announcements() {
  echo "==> Sync announcements (zh, en)"
  local max_pages_arg=()
  if [[ -n "${SYNC_MAX_PAGES:-}" ]]; then
    max_pages_arg=(--max-pages "$SYNC_MAX_PAGES")
  fi

  (cd "$SCRIPT_DIR" && python manage.py sync_announcements --lang zh "${max_pages_arg[@]}")
  (cd "$SCRIPT_DIR" && python manage.py sync_announcements --lang en "${max_pages_arg[@]}")
}

run_calendar() {
  echo "==> Sync calendar (zh, en)"
  (cd "$SCRIPT_DIR" && python scripts/calendar_zh_builder.py)
  (cd "$SCRIPT_DIR" && python scripts/calendar_en_builder.py)
}

run_links() {
  echo "==> Build English links JSON"
  (cd "$SCRIPT_DIR" && python scripts/links_en_builder.py)

  echo "==> Import links into DB"
  (cd "$SCRIPT_DIR" && python manage.py import_links)
}

main() {
  local cmd="${1:-all}"

  case "$cmd" in
    -h|--help|help)
      usage
      exit 0
      ;;
    all|announcements|calendar|links)
      ;;
    *)
      echo "Error: unknown command '$cmd'"
      usage
      exit 1
      ;;
  esac

  require_venv
  activate_venv

  case "$cmd" in
    all)
      run_announcements
      run_calendar
      run_links
      ;;
    announcements)
      run_announcements
      ;;
    calendar)
      run_calendar
      ;;
    links)
      run_links
      ;;
  esac

  echo "==> Done: $cmd"
}

main "$@"