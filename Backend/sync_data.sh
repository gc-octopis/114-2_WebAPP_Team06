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
  2) If Backend/.venv exists, it will be used automatically.
EOF
}

resolve_python() {
  local -a candidates=()
  local candidate

  if [[ -n "${PYTHON_BIN:-}" ]]; then
    candidates+=("$PYTHON_BIN")
  fi

  candidates+=("$SCRIPT_DIR/.venv/bin/python")

  if [[ -n "${CONDA_PREFIX:-}" ]]; then
    candidates+=("$CONDA_PREFIX/bin/python")
  fi

  for candidate in "$HOME"/miniforge3/envs/*/bin/python "$HOME"/anaconda3/envs/*/bin/python; do
    if [[ -x "$candidate" ]]; then
      candidates+=("$candidate")
    fi
  done

  if command -v python >/dev/null 2>&1; then
    candidates+=("$(command -v python)")
  fi
  if command -v python3 >/dev/null 2>&1; then
    candidates+=("$(command -v python3)")
  fi

  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate" ]] && "$candidate" -c "import django" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "Error: no Python interpreter with Django found."
  echo "Hint: activate your environment first, or pass PYTHON_BIN=/path/to/python"
  exit 1
}

ensure_migrated() {
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" manage.py migrate --noinput)
}



run_announcements() {
  echo "==> Sync announcements (zh, en)"
  local -a max_pages_arg=()
  if [[ -n "${SYNC_MAX_PAGES:-}" ]]; then
    max_pages_arg+=(--max-pages "$SYNC_MAX_PAGES")
  fi

  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" manage.py sync_announcements --lang zh ${max_pages_arg:+"${max_pages_arg[@]}"})
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" manage.py sync_announcements --lang en ${max_pages_arg:+"${max_pages_arg[@]}"})
}

run_calendar() {
  echo "==> Sync calendar (zh, en)"
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" scripts/calendar_zh_builder.py)
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" scripts/calendar_en_builder.py)
}

run_links() {
  echo "==> Fetch links from myNTU (zh + en)"
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" scripts/fetch_myntu_links.py)

  echo "==> Import links into DB"
  (cd "$SCRIPT_DIR" && "$PYTHON_BIN" manage.py import_links)
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

  PYTHON_BIN="$(resolve_python)"
  ensure_migrated

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