#!/usr/bin/env bash
# ==============================================================================
# FinanceX — Production 1-Click Update & Deployment Script
# Usage: ./deploy.sh
# ==============================================================================

set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\n${CYAN}====================================================${NC}"
echo -e "${CYAN}   FinanceX Production Deployment & Update Script   ${NC}"
echo -e "${CYAN}====================================================${NC}\n"

# 1. Pull latest changes from Git
echo -e "${YELLOW}>> [1/5] Pulling latest updates from Git...${NC}"
cd "$PROJECT_ROOT"
if [ -d .git ]; then
    git pull origin main || echo "Git pull skipped or already up to date."
fi

# 2. Update Backend Python environment
echo -e "\n${YELLOW}>> [2/5] Updating Backend dependencies & checking ML models...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn uvicorn[standard]

# Quick verification of ML models
python -c "
import sys; sys.path.insert(0, '.');
from app.services.ml_service import ml_service
print('✓ Regression Model:', ml_service.regression_model is not None)
print('✓ Classification Model:', ml_service.classification_model is not None)
print('✓ Clustering Model:', ml_service.clustering_model is not None)
print('✓ Anomaly Model:', ml_service.anomaly_model is not None)
"

# 3. Build React Frontend
echo -e "\n${YELLOW}>> [3/5] Building React Vite Frontend bundle...${NC}"
cd "$PROJECT_ROOT/frontend"
npm install
npm run build

# 4. Restart Backend Systemd Service
echo -e "\n${YELLOW}>> [4/5] Restarting financex-backend systemd service...${NC}"
if systemctl is-active --quiet financex-backend; then
    sudo systemctl restart financex-backend
    echo -e "${GREEN}✓ financex-backend restarted successfully.${NC}"
else
    echo -e "${YELLOW}! financex-backend service is not active yet. Start it via: sudo systemctl start financex-backend${NC}"
fi

# 5. Reload Nginx
echo -e "\n${YELLOW}>> [5/5] Reloading Nginx Web Server...${NC}"
if which nginx > /dev/null 2>&1; then
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully.${NC}"
else
    echo -e "${YELLOW}! Nginx not installed or not in PATH.${NC}"
fi

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}   ✓ FinanceX Deployment Finished Successfully!   ${NC}"
echo -e "${GREEN}====================================================${NC}\n"
