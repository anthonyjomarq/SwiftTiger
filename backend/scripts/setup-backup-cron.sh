#!/bin/bash

# Setup automated database backups for SwiftTiger
# This script sets up cron jobs for regular database backups

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
BACKUP_TIME_DAILY="2:00"
BACKUP_TIME_WEEKLY="1:00"
BACKUP_USER=$(whoami)

echo "Setting up automated backups for SwiftTiger..."
echo "Backend directory: $BACKEND_DIR"
echo "User: $BACKUP_USER"

# Create backup log directory
mkdir -p "$BACKEND_DIR/logs/backup"

# Create the cron job entries
CRON_DAILY="0 2 * * * cd $BACKEND_DIR && npm run backup >> logs/backup/daily.log 2>&1"
CRON_WEEKLY="0 1 * * 0 cd $BACKEND_DIR && npm run backup:schema >> logs/backup/weekly.log 2>&1"
CRON_CLEANUP="0 3 * * 0 cd $BACKEND_DIR && npm run backup:cleanup >> logs/backup/cleanup.log 2>&1"

echo "Proposed cron jobs:"
echo "Daily backup (2:00 AM): $CRON_DAILY"
echo "Weekly schema backup (1:00 AM Sunday): $CRON_WEEKLY"
echo "Weekly cleanup (3:00 AM Sunday): $CRON_CLEANUP"

# Function to add cron job if it doesn't exist
add_cron_job() {
    local job="$1"
    local description="$2"
    
    # Check if the job already exists
    if crontab -l 2>/dev/null | grep -F "$job" > /dev/null; then
        echo "✓ $description already exists"
    else
        # Add the job
        (crontab -l 2>/dev/null; echo "$job") | crontab -
        echo "✓ Added $description"
    fi
}

# Add cron jobs
add_cron_job "$CRON_DAILY" "Daily backup job"
add_cron_job "$CRON_WEEKLY" "Weekly schema backup job"
add_cron_job "$CRON_CLEANUP" "Weekly cleanup job"

echo ""
echo "Backup automation setup complete!"
echo ""
echo "Current cron jobs:"
crontab -l 2>/dev/null | grep -E "(backup|SwiftTiger)" || echo "No backup jobs found"

echo ""
echo "Manual backup commands:"
echo "  Full backup:    npm run backup"
echo "  Schema backup:  npm run backup:schema"
echo "  Data backup:    npm run backup:data"
echo "  Cleanup:        npm run backup:cleanup"
echo "  Restore:        npm run restore <backup-file>"

echo ""
echo "Log files:"
echo "  Daily:   $BACKEND_DIR/logs/backup/daily.log"
echo "  Weekly:  $BACKEND_DIR/logs/backup/weekly.log"
echo "  Cleanup: $BACKEND_DIR/logs/backup/cleanup.log"

# Make sure the script is executable
chmod +x "$0"

echo ""
echo "Setup completed successfully!"