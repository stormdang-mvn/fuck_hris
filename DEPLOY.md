# 🚀 HRIS Deployment Guide

## Quick Deploy (5 phút)

### 1️⃣ Build trên Windows
```powershell
npm run build-only
```

### 2️⃣ Copy lên server
```powershell
scp -r dist server deploy.sh hvn@192.168.100.163:~/
```

### 3️⃣ Deploy trên Ubuntu
```bash
ssh hvn@192.168.100.163
bash deploy.sh
```

✅ **Done!** Access: `http://192.168.100.163:3000`

---

## 🔧 Service Management

```bash
# View logs (real-time)
sudo journalctl -u hris -f

# Restart
sudo systemctl restart hris

# Stop
sudo systemctl stop hris

# Status
sudo systemctl status hris
```

---

## 🔄 Update App (chỉ cần 3 bước)

```powershell
# 1. Build mới
npm run build-only

# 2. Copy dist + server
scp -r dist server hvn@192.168.100.163:~/hris/

# 3. Restart service
ssh hvn@192.168.100.163 "cd ~/hris/server && npm install && sudo systemctl restart hris"
```

---

## 🐛 Troubleshooting

**Service không start:**
```bash
sudo journalctl -u hris -n 50
```

**Port 3000 bị chiếm:**
```bash
sudo netstat -tulpn | grep 3000
```

**API không hoạt động:**
- Check logs: `sudo journalctl -u hris -f`
- Test server manually: `cd ~/hris/server && node server.js`

---

## 📁 Server Structure
```
/home/hvn/hris/
├── dist/              # Built frontend files
├── server/
│   ├── server.js      # Express server with proxy
│   ├── package.json
│   └── node_modules/
└── Service: /etc/systemd/system/hris.service
```

---

## ⚙️ Configuration

**Change port:** Edit `/etc/systemd/system/hris.service`
```ini
Environment=PORT=8080
```
Then: `sudo systemctl daemon-reload && sudo systemctl restart hris`

**Change API endpoint:** Edit `server/server.js`
```javascript
target: 'https://your-api-url.com'
```
