# Database Restore Procedures for FBPro.MCP

## Overview

This document provides step-by-step procedures for restoring the FBPro.MCP database from backups in various scenarios.

## Prerequisites

### Required Tools
- PostgreSQL client (`psql`, `pg_restore`)
- AWS CLI (for S3 backup retrieval)
- Database admin access
- S3 bucket access credentials

### Required Information
- Database connection details
- Backup location (S3 bucket/local path)
- Target restore point/backup date

## Backup Location Structure

### S3 Structure
```
s3://fbpro-backups/
├── database-backups/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 15/
│   │   │   │   ├── fbpro-backup-20250115-030000.sql.gz
│   │   │   │   └── fbpro-backup-20250115-120000.sql.gz
│   │   │   └── 16/
│   │   └── 02/
│   └── 2024/
```

### Local Backup Structure
```
/backups/
├── daily/
├── weekly/
└── monthly/
```

## Restore Procedures

### 1. Full Database Restore (Production)

#### Step 1: Identify Backup
```bash
# List available backups
aws s3 ls s3://fbpro-backups/database-backups/ --recursive

# Find specific backup by date
aws s3 ls s3://fbpro-backups/database-backups/2025/01/15/
```

#### Step 2: Download Backup
```bash
# Create restore directory
mkdir -p /tmp/restore
cd /tmp/restore

# Download backup
BACKUP_KEY="database-backups/2025/01/15/fbpro-backup-20250115-030000.sql.gz"
aws s3 cp "s3://fbpro-backups/$BACKUP_KEY" ./

# Verify download
ls -lh *.gz
```

#### Step 3: Verify Backup Integrity
```bash
# Test gzip integrity
gunzip -t fbpro-backup-20250115-030000.sql.gz

# Extract if verification passes
gunzip fbpro-backup-20250115-030000.sql.gz
```

#### Step 4: Prepare Target Database
```bash
# Create new database (if needed)
createdb fbpro_restored

# OR drop existing database (DANGEROUS - production only with approval)
# dropdb fbpro
# createdb fbpro
```

#### Step 5: Restore Database
```bash
# Restore from backup
psql -d fbpro_restored -f fbpro-backup-20250115-030000.sql

# Check for errors
echo $?  # Should be 0 for success
```

#### Step 6: Verify Restoration
```bash
# Connect to restored database
psql -d fbpro_restored

# Run verification queries
\dt  # List tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM facebook_pages;
SELECT COUNT(*) FROM generated_content;

# Check latest records
SELECT created_at FROM users ORDER BY created_at DESC LIMIT 5;
```

### 2. Point-in-Time Recovery

#### Step 1: Find Backup Before Issue
```bash
# List backups around the incident time
INCIDENT_DATE="2025-01-15"
aws s3 ls s3://fbpro-backups/database-backups/2025/01/14/ --human-readable
aws s3 ls s3://fbpro-backups/database-backups/2025/01/15/ --human-readable
```

#### Step 2: Restore to Staging First
```bash
# Download backup before incident
aws s3 cp s3://fbpro-backups/database-backups/2025/01/14/fbpro-backup-20250114-230000.sql.gz ./

# Restore to staging environment
gunzip fbpro-backup-20250114-230000.sql.gz
psql -d fbpro_staging -f fbpro-backup-20250114-230000.sql
```

#### Step 3: Validate Data
```bash
# Check specific data that was affected
psql -d fbpro_staging -c "
  SELECT id, title, created_at 
  FROM generated_content 
  WHERE created_at >= '2025-01-14 00:00:00'
  ORDER BY created_at DESC
  LIMIT 10;
"

# Verify user accounts are intact
psql -d fbpro_staging -c "
  SELECT COUNT(*) as user_count, 
         MAX(created_at) as last_user_created
  FROM users;
"
```

#### Step 4: Apply Selective Recovery (if needed)
```bash
# Export specific tables/data that need recovery
pg_dump fbpro_staging -t generated_content -t analytics --data-only > recovery_data.sql

# Import to production (during maintenance window)
psql -d fbpro -f recovery_data.sql
```

### 3. Emergency Recovery Procedure

#### Step 1: Immediate Assessment
```bash
# Check database status
psql -d fbpro -c "SELECT version();" || echo "Database inaccessible"

# Check disk space
df -h

# Check for corruption
psql -d fbpro -c "SELECT datname FROM pg_database;" || echo "Corruption detected"
```

#### Step 2: Quick Backup of Current State (if possible)
```bash
# If database is partially accessible, backup current state
pg_dump fbpro > emergency_current_state_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 3: Restore from Latest Known Good Backup
```bash
# Get the most recent backup
LATEST_BACKUP=$(aws s3 ls s3://fbpro-backups/database-backups/ --recursive | sort | tail -1 | awk '{print $4}')
echo "Latest backup: $LATEST_BACKUP"

# Download and restore
aws s3 cp "s3://fbpro-backups/$LATEST_BACKUP" ./
gunzip $(basename "$LATEST_BACKUP")
```

#### Step 4: Emergency Restoration
```bash
# Drop corrupted database (if necessary)
dropdb fbpro

# Create fresh database
createdb fbpro

# Restore
psql -d fbpro -f $(basename "$LATEST_BACKUP" .gz)
```

### 4. Development/Testing Restore

#### Quick Development Restore
```bash
# Download latest backup
aws s3 cp s3://fbpro-backups/database-backups/$(date +%Y/%m/%d)/fbpro-backup-$(date +%Y%m%d)-030000.sql.gz ./

# Restore to dev database
gunzip fbpro-backup-*.sql.gz
createdb fbpro_dev
psql -d fbpro_dev -f fbpro-backup-*.sql

# Sanitize sensitive data for development
psql -d fbpro_dev -c "
  UPDATE users SET 
    email = 'dev+' || id || '@fbpro.ai',
    first_name = 'Dev',
    last_name = 'User' || id;
  
  UPDATE facebook_pages SET
    access_token = 'dev_token_' || id,
    webhook_verify_token = 'dev_webhook_' || id;
"
```

## Restoration Scripts

### Automated Restore Script
```bash
#!/bin/bash
# restore.sh - Automated database restore

BACKUP_DATE=${1:-$(date +%Y-%m-%d)}
TARGET_DB=${2:-fbpro_restored}
SOURCE=${3:-s3}

if [[ "$SOURCE" == "s3" ]]; then
    # Find backup for date
    BACKUP_PATH=$(aws s3 ls s3://fbpro-backups/database-backups/ --recursive | grep "$BACKUP_DATE" | sort | tail -1 | awk '{print $4}')
    
    if [[ -z "$BACKUP_PATH" ]]; then
        echo "No backup found for $BACKUP_DATE"
        exit 1
    fi
    
    # Download and restore
    aws s3 cp "s3://fbpro-backups/$BACKUP_PATH" ./
    gunzip $(basename "$BACKUP_PATH")
    
    # Create target database
    createdb "$TARGET_DB"
    
    # Restore
    psql -d "$TARGET_DB" -f $(basename "$BACKUP_PATH" .gz)
    
    echo "Restore completed to database: $TARGET_DB"
fi
```

## Validation Checklist

### Post-Restore Verification
- [ ] Database connection successful
- [ ] All tables present and accessible
- [ ] Row counts match expected values
- [ ] Key relationships intact (foreign keys)
- [ ] Latest data timestamp reasonable
- [ ] No orphaned records
- [ ] Application can connect successfully
- [ ] Critical functionality works (login, content generation)

### Production Readiness
- [ ] Update application connection strings
- [ ] Restart application services
- [ ] Verify SSL certificates
- [ ] Check monitoring alerts
- [ ] Validate user authentication
- [ ] Test payment processing (if applicable)
- [ ] Confirm backup schedule resumption

## Emergency Contacts

### Escalation Procedure
1. **Database Issues**: DBA team → Senior Engineering → CTO
2. **Infrastructure**: DevOps → SRE → Engineering Director
3. **Data Loss**: CTO → Legal → CEO

### Communication Templates

#### Internal Alert
```
🚨 DATABASE RESTORE IN PROGRESS

Status: [INITIATED/IN_PROGRESS/COMPLETED/FAILED]
Start Time: [TIMESTAMP]
Estimated Completion: [TIMESTAMP]
Affected Services: [LIST]
Restore Point: [BACKUP_DATE]
Impact: [DESCRIPTION]

Updates will be provided every 15 minutes.
```

#### Customer Communication
```
We are currently experiencing a service interruption and are working to restore normal operations. 

- Issue: Database maintenance in progress
- Expected Resolution: [TIME]
- Services Affected: [LIST]
- Data Safety: All user data is secure and backed up

We will provide updates as work progresses.
```

## Recovery Time Objectives (RTO)

### Target Recovery Times
- **Critical System Failure**: 2 hours
- **Data Corruption**: 4 hours  
- **Point-in-Time Recovery**: 6 hours
- **Development Restore**: 30 minutes

### Data Loss Tolerances (RPO)
- **Production**: Maximum 24 hours (daily backups)
- **Critical Operations**: Maximum 1 hour (with transaction log shipping)
- **Development**: Maximum 1 week

## Testing & Drills

### Monthly Restore Test
```bash
# Automated restore verification
./ops/scripts/test-restore.sh
```

### Quarterly Disaster Recovery Drill
1. Simulate database failure
2. Execute emergency restore procedure
3. Verify application functionality
4. Document lessons learned
5. Update procedures as needed

## Troubleshooting

### Common Issues

#### "Database already exists" Error
```bash
# Solution: Use a different database name or force drop
dropdb fbpro_restored
createdb fbpro_restored
```

#### "Permission denied" Error
```bash
# Solution: Check user permissions
GRANT ALL PRIVILEGES ON DATABASE fbpro_restored TO current_user;
```

#### "Backup file corrupted" Error
```bash
# Solution: Try an earlier backup
aws s3 ls s3://fbpro-backups/database-backups/ --recursive | grep -v $(date +%Y-%m-%d)
```

#### Large Backup Download Timeout
```bash
# Solution: Use parallel download
aws configure set default.s3.max_concurrent_requests 10
aws configure set default.s3.multipart_threshold 64MB
```

## Security Considerations

### Access Control
- Restore operations require database admin privileges
- S3 backup access limited to authorized personnel
- All restore activities logged and audited
- Production restores require approval workflow

### Data Sensitivity
- Production backups contain real user data
- Development restores must sanitize PII
- Backup files encrypted at rest (AES-256)
- Secure deletion of temporary backup files

### Compliance
- GDPR: User data handling during restore
- SOC 2: Change management for production
- PCI DSS: Payment data restoration procedures (if applicable)