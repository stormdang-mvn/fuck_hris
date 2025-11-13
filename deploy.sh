#!/bin/bash

# HRIS Deployment Script for Ubuntu Server (using npm serve)
# Usage: bash deploy.sh

set -e

echo "🚀 Starting HRIS deployment..."

# Variables
APP_NAME="hris"
DEPLOY_USER=$(whoami)
DEPLOY_DIR="$HOME/${APP_NAME}"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"

# 1. Check if Node.js is installed
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node --version) installed"
fi

# 2. Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found"
    exit 1
else
    echo "✅ npx available"
fi

# 3. Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p ${DEPLOY_DIR}

# 4. Copy dist files
echo "📋 Copying application files..."
if [ -d "dist" ]; then
    cp -r dist ${DEPLOY_DIR}/
    echo "✅ Files copied to ${DEPLOY_DIR}"
else
    echo "❌ dist/ directory not found. Run 'npm run build-only' first"
    exit 1
fi

# 5. Create systemd service file
echo "⚙️  Creating systemd service..."
sudo tee ${SERVICE_FILE} > /dev/null << EOF
[Unit]
Description=HRIS Web Application
After=network.target

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${DEPLOY_DIR}
ExecStart=/usr/bin/npx serve -s dist -l 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

# Environment
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created at ${SERVICE_FILE}"

# 6. Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# 7. Enable and start service
echo "� Starting service..."
sudo systemctl enable ${APP_NAME}
sudo systemctl restart ${APP_NAME}

# 8. Wait a moment for service to start
sleep 2

# 9. Check service status
if sudo systemctl is-active --quiet ${APP_NAME}; then
    echo "✅ Service is running"
else
    echo "❌ Service failed to start"
    sudo systemctl status ${APP_NAME}
    exit 1
fi

# 10. Show firewall info (optional)
if command -v ufw &> /dev/null && sudo ufw status | grep -q "Status: active"; then
    echo ""
    echo "� Opening port 3000 in firewall..."
    sudo ufw allow 3000/tcp
fi

# Done
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📍 Application deployed to: ${DEPLOY_DIR}"
echo "🌐 Access your application at: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: sudo journalctl -u ${APP_NAME} -f"
echo "   - Restart service: sudo systemctl restart ${APP_NAME}"
echo "   - Check status: sudo systemctl status ${APP_NAME}"
echo "   - Stop service: sudo systemctl stop ${APP_NAME}"
echo ""
