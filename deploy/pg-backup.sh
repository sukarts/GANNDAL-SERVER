#!/bin/sh
# Sauvegarde PostgreSQL quotidienne — format custom compressé (restaurable via pg_restore).
# Rétention BACKUP_KEEP_DAYS jours. Tourne en boucle dans le conteneur `backup`.
# Un dump au démarrage, puis toutes les 24h (busybox: pas d'ordonnancement horaire fin).
# Variables attendues : PGHOST, PGUSER, PGPASSWORD, PGDATABASE (via compose).
set -eu

DIR=/backups
KEEP="${BACKUP_KEEP_DAYS:-30}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"
mkdir -p "$DIR"

dump() {
  TS="$(date +%Y%m%d-%H%M%S)"
  OUT="$DIR/${PGDATABASE}-${TS}.dump"
  echo "[backup] $(date '+%F %T') → $OUT"
  if pg_dump -Fc -f "$OUT.tmp" 2>>"$DIR/backup.log"; then
    mv "$OUT.tmp" "$OUT"
    echo "[backup] OK ($(du -h "$OUT" | cut -f1))"
  else
    echo "[backup] ÉCHEC pg_dump — voir $DIR/backup.log" >&2
    rm -f "$OUT.tmp"
  fi
  # Rétention : supprime les dumps plus vieux que KEEP jours
  find "$DIR" -name "${PGDATABASE}-*.dump" -type f -mtime +"$KEEP" -delete 2>/dev/null || true
}

# Attend que Postgres réponde avant le premier dump
until pg_isready >/dev/null 2>&1; do
  echo "[backup] attente de Postgres…"; sleep 3
done

dump
while true; do
  sleep "$INTERVAL"
  dump
done
