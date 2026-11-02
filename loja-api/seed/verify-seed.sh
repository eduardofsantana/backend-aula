#!/usr/bin/env bash
# Verifica se o hash bcrypt em seed.sql corresponde à senha secret123.
# Uso: bash seed/verify-seed.sh (a partir de loja-api/)
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$DIR/.." && pwd)"
HASH="$(grep -oE '\$2b\$10\$[[:alnum:]./]+' "$DIR/seed.sql" | sed -n '1p')"

if [[ -z "$HASH" ]]; then
  echo "FALHA: nenhum hash \$2b\$10\$ encontrado em seed.sql" >&2
  exit 1
fi

export SEED_HASH="$HASH"
cd "$PROJECT_DIR"
node -e '
const bcrypt = require("bcryptjs");
if (!bcrypt.compareSync("secret123", process.env.SEED_HASH)) {
  console.error("FALHA: hash em seed.sql não corresponde a secret123");
  process.exit(1);
}
console.log("OK: seed.sql verificado (ana/cli/mgr → secret123)");
'
