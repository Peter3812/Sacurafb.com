#!/bin/bash
# FBPro.MCP Database Backup Script
# Automated PostgreSQL backup with S3 storage and retention policy

set -e

# Configuration
BACKUP_NAME="fbpro-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/tmp/backups"
S3_BUCKET="${S3_BACKUP_BUCKET:-fbpro-backups}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Database connection (use DATABASE_URL if available)
if [[ -n "$DATABASE_URL" ]]; then
    DB_URL="$DATABASE_URL"
else
    DB_HOST="${PGHOST:-localhost}"
    DB_PORT="${PGPORT:-5432}"
    DB_NAME="${PGDATABASE:-fbpro}"
    DB_USER="${PGUSER:-postgres}"
    DB_PASSWORD="$PGPASSWORD"
    DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔄 Starting FBPro.MCP Database Backup..."
echo "Timestamp: $(date)"
echo "Backup Name: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "❌ Backup failed with exit code $exit_code"
        # Send alert notification here if configured
        if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"🚨 FBPro.MCP backup failed: $BACKUP_NAME\"}" \
                "$SLACK_WEBHOOK_URL" || true
        fi
    fi
    
    # Clean up temporary files
    if [[ -f "$BACKUP_DIR/$BACKUP_NAME.sql" ]]; then
        rm -f "$BACKUP_DIR/$BACKUP_NAME.sql"
    fi
    if [[ -f "$BACKUP_DIR/$BACKUP_NAME.sql.gz" ]]; then
        rm -f "$BACKUP_DIR/$BACKUP_NAME.sql.gz"
    fi
}

trap cleanup EXIT

# Check prerequisites
if ! command -v pg_dump &> /dev/null; then
    log "❌ pg_dump not found. Install PostgreSQL client tools."
    exit 1
fi

if ! command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
    log "⚠️  AWS CLI not found. S3 upload will be skipped."
    S3_BUCKET=""
fi

# Perform database backup
log "📦 Creating database dump..."
if ! pg_dump "$DB_URL" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --no-owner \
    --no-privileges \
    --file="$BACKUP_DIR/$BACKUP_NAME.sql"; then
    log "❌ Database dump failed"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql" | cut -f1)
log "✅ Database dump completed: $BACKUP_SIZE"

# Compress the backup
log "🗜️  Compressing backup..."
if ! gzip "$BACKUP_DIR/$BACKUP_NAME.sql"; then
    log "❌ Compression failed"
    exit 1
fi

COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.sql.gz" | cut -f1)
log "✅ Compression completed: $COMPRESSED_SIZE"

# Upload to S3 if configured
if [[ -n "$S3_BUCKET" ]]; then
    log "☁️  Uploading to S3..."
    
    # Calculate current date paths for organization
    YEAR=$(date +%Y)
    MONTH=$(date +%m)
    DAY=$(date +%d)
    
    S3_KEY="database-backups/$YEAR/$MONTH/$DAY/$BACKUP_NAME.sql.gz"
    
    if aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.sql.gz" "s3://$S3_BUCKET/$S3_KEY" \
        --server-side-encryption AES256 \
        --storage-class STANDARD_IA \
        --metadata "source=fbpro-mcp,timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"; then
        log "✅ Upload completed: s3://$S3_BUCKET/$S3_KEY"
        
        # Add lifecycle tag for automatic cleanup
        aws s3api put-object-tagging \
            --bucket "$S3_BUCKET" \
            --key "$S3_KEY" \
            --tagging "TagSet=[{Key=AutoDelete,Value=true},{Key=RetentionDays,Value=$RETENTION_DAYS}]" || true
    else
        log "❌ S3 upload failed"
        exit 1
    fi
    
    # Clean up old backups (retention policy)
    log "🧹 Cleaning up old backups..."
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    
    # List and delete old backups
    aws s3api list-objects-v2 \
        --bucket "$S3_BUCKET" \
        --prefix "database-backups/" \
        --query "Contents[?LastModified<'$CUTOFF_DATE'].Key" \
        --output text | \
    while read -r key; do
        if [[ -n "$key" && "$key" != "None" ]]; then
            log "🗑️  Deleting old backup: $key"
            aws s3 rm "s3://$S3_BUCKET/$key" || true
        fi
    done
    
else
    log "⚠️  S3 upload skipped (S3_BUCKET not configured)"
    log "📁 Backup saved locally: $BACKUP_DIR/$BACKUP_NAME.sql.gz"
fi

# Verify backup integrity
log "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_DIR/$BACKUP_NAME.sql.gz"; then
    log "✅ Backup integrity verified"
else
    log "❌ Backup integrity check failed"
    exit 1
fi

# Generate backup report
BACKUP_REPORT=$(cat <<EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "original_size": "$BACKUP_SIZE",
  "compressed_size": "$COMPRESSED_SIZE",
  "s3_location": "${S3_BUCKET:+s3://$S3_BUCKET/$S3_KEY}",
  "retention_days": $RETENTION_DAYS,
  "status": "success"
}
EOF
)

log "📊 Backup Report:"
echo "$BACKUP_REPORT" | jq . 2>/dev/null || echo "$BACKUP_REPORT"

# Send success notification
if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ FBPro.MCP backup completed successfully: $BACKUP_NAME ($COMPRESSED_SIZE)\"}" \
        "$SLACK_WEBHOOK_URL" || true
fi

# Store backup metadata for monitoring
if [[ -n "$MONITORING_ENDPOINT" ]]; then
    curl -X POST "$MONITORING_ENDPOINT/backup-completed" \
        -H "Content-Type: application/json" \
        -d "$BACKUP_REPORT" || true
fi

log "🎉 Backup process completed successfully!"
exit 0