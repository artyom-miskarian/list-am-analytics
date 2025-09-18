#!/bin/bash

# Setup script for phone-crawler daily cron job
# This sets up a cron job to run daily at 2 AM Armenia time (AMT)

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CRON_SCRIPT="$PROJECT_DIR/cron-daily-crawl.js"

echo "Setting up daily crawl cron job..."
echo "Project directory: $PROJECT_DIR"
echo "Cron script: $CRON_SCRIPT"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the cron script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "Error: Cron script not found at $CRON_SCRIPT"
    exit 1
fi

# Make sure the script is executable
chmod +x "$CRON_SCRIPT"

# Get the current crontab
TEMP_CRON=$(mktemp)
crontab -l 2>/dev/null > "$TEMP_CRON" || echo "# Crontab for phone-crawler" > "$TEMP_CRON"

# Check if the cron job already exists
if grep -q "cron-daily-crawl.js" "$TEMP_CRON"; then
    echo "Cron job already exists. Removing old entry..."
    grep -v "cron-daily-crawl.js" "$TEMP_CRON" > "$TEMP_CRON.new"
    mv "$TEMP_CRON.new" "$TEMP_CRON"
fi

# Add the new cron job
# Format: minute hour day month weekday command
# 0 2 * * * = Every day at 2:00 AM
echo "0 2 * * * cd $PROJECT_DIR && node cron-daily-crawl.js >> crawler_data/cron.log 2>&1" >> "$TEMP_CRON"

# Install the new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo ""
echo "✅ Cron job installed successfully!"
echo ""
echo "The crawler will now run automatically every day at 2:00 AM Armenia time"
echo "It will crawl all previously crawled categories"
echo ""
echo "To view the current crontab:"
echo "  crontab -l"
echo ""
echo "To remove the cron job:"
echo "  crontab -e"
echo "  (then delete the line containing 'cron-daily-crawl.js')"
echo ""
echo "To view cron logs:"
echo "  tail -f $PROJECT_DIR/crawler_data/cron.log"
echo ""
echo "To test the cron job manually:"
echo "  node $CRON_SCRIPT"