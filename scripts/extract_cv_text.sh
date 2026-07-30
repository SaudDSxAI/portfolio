#!/usr/bin/env bash
# Regenerate data/cv.txt from the CV that visitors actually download.
#
# The assistant reads data/cv.txt, not the PDF — Railway has no PDF tooling
# and parsing a PDF on every request would be wasteful anyway. So this runs
# locally and the resulting .txt gets committed alongside the PDF.
#
# RUN THIS EVERY TIME YOU REPLACE THE CV PDF, or the bot will keep answering
# from the old one.
#
#   ./scripts/extract_cv_text.sh
#
# Requires poppler (pdftotext):  brew install poppler

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PDF="$ROOT/frontend/public/cv/Saud-Ahmad-CV.pdf"
OUT="$ROOT/data/cv.txt"

if [ ! -f "$PDF" ]; then
  echo "❌ CV not found at $PDF"
  exit 1
fi

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "❌ pdftotext not installed. Run: brew install poppler"
  exit 1
fi

# -layout preserves the column structure, which keeps bullet points attached
# to the right job instead of interleaving them.
pdftotext -layout "$PDF" "$OUT"

echo "✅ Wrote $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"
echo "   Restart the backend (or redeploy) for the assistant to pick it up."
