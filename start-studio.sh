#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "▶ Building ontology-extractor library…"
pnpm --filter ontology-extractor build

echo "▶ Starting Ontology Studio at http://localhost:3000"
pnpm --filter ontology-studio dev
