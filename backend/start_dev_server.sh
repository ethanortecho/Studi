#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Studi Backend Development Server${NC}"
echo "========================================"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source venv/bin/activate
elif [ -d "../venv" ]; then
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source ../venv/bin/activate
fi

# Run migrations if needed
echo -e "${YELLOW}Checking for pending migrations...${NC}"
python manage.py migrate --no-input

# Start the development server on all interfaces
echo -e "${GREEN}Starting Django server on 0.0.0.0:8000${NC}"
echo -e "${YELLOW}This allows connections from any device on your network${NC}"
echo ""
echo -e "${GREEN}Your backend will be accessible at:${NC}"
echo -e "  - From this machine: ${YELLOW}http://localhost:8000${NC}"
echo -e "  - From other devices: ${YELLOW}http://<your-ip>:8000${NC}"
echo ""
echo -e "${GREEN}The Expo app will auto-detect the correct IP!${NC}"
echo ""

# Start the server bound to all interfaces
python manage.py runserver 0.0.0.0:8000