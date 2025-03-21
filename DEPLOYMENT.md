# Complete Website Deployment Guide

This guide will walk you through deploying the entire Genner Gibelguuger website, including both the frontend application and Supabase backend.

## Part 1: Server Setup

### 1.1 Server Requirements

For a production environment, ensure your server meets these minimum requirements:
- Ubuntu 22.04 LTS
- 4GB RAM (8GB recommended)
- 40GB SSD storage
- Public IP address
- Domain name pointing to your server

### 1.2 Initial Server Setup

1. Update your system:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Install essential tools:
```bash
sudo apt install -y \
  curl \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw
```

3. Configure firewall:
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

4. Install Node.js 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Part 2: Frontend Application Deployment

### 2.1 Application Setup

1. Create application directory:
```bash
sudo mkdir -p /var/www/gennergibelguuger
sudo chown -R $USER:$USER /var/www/gennergibelguuger
```

2. Clone the repository:
```bash
cd /var/www/gennergibelguuger
git clone https://your-repository-url.git .
```

3. Install dependencies:
```bash
npm install
```

4. Create production environment file:
```bash
cat > .env.production << EOL
VITE_SUPABASE_URL=https://your-domain.com
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENCRYPTION_KEY=your-encryption-key
EOL
```

5. Build the application:
```bash
npm run build
```

### 2.2 Nginx Configuration

1. Create Nginx configuration:
```bash
sudo tee /etc/nginx/sites-available/gennergibelguuger << EOL
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gennergibelguuger/dist;
    index index.html;

    # Frontend application
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # API endpoints will be configured later with Supabase
}
EOL
```

2. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/gennergibelguuger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Part 3: Supabase Backend Deployment

### 3.1 Install Docker

1. Install Docker prerequisites:
```bash
sudo apt install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release
```

2. Add Docker's GPG key:
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

3. Add Docker repository:
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

4. Install Docker:
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl enable --now docker

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3.2 Supabase Setup

1. Create Supabase directory:
```bash
mkdir ~/supabase
cd ~/supabase
```

2. Create environment file:
```bash
cat > .env << EOL
############
# Secrets
# YOU MUST CHANGE THESE BEFORE GOING INTO PRODUCTION
############

POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

############
# Database
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# API Proxy
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API
############

API_EXTERNAL_URL=https://your-domain.com
SITE_URL=https://your-domain.com
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false

############
# Email Auth
############

ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender

############
# Auth Paths
############

MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

############
# Studio
############

STUDIO_PORT=3000
PUBLIC_REST_URL=http://localhost:8000/rest/v1/
EOL
```

3. Create Docker Compose file:
```bash
cat > docker-compose.yml << EOL
services:
  studio:
    image: supabase/studio:20240315
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_URL: http://kong:8000
      SUPABASE_REST_URL: http://kong:8000/rest/v1/
      SUPABASE_PUBLIC_URL: http://localhost:8000
      SUPABASE_ANON_KEY: \${ANON_KEY}
      SUPABASE_SERVICE_KEY: \${SERVICE_ROLE_KEY}

  kong:
    image: supabase/kong:0.2.1
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl
    volumes:
      - ./volumes/kong.yml:/var/lib/kong/kong.yml:ro

  auth:
    image: supabase/gotrue:v2.132.3
    restart: unless-stopped
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: \${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_HOST: \${POSTGRES_HOST}
      GOTRUE_DB_PORT: \${POSTGRES_PORT}
      GOTRUE_DB_DATABASE: \${POSTGRES_DB}
      GOTRUE_DB_USERNAME: postgres
      GOTRUE_DB_PASSWORD: \${POSTGRES_PASSWORD}
      GOTRUE_SITE_URL: \${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: \${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: \${DISABLE_SIGNUP}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXP: \${JWT_EXPIRY}
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      MAILER_AUTOCONFIRM: \${ENABLE_EMAIL_AUTOCONFIRM}
      MAILER_SECURE_EMAIL_CHANGE_ENABLED: true
      SMTP_ADMIN_EMAIL: \${SMTP_ADMIN_EMAIL}
      SMTP_HOST: \${SMTP_HOST}
      SMTP_PORT: \${SMTP_PORT}
      SMTP_USER: \${SMTP_USER}
      SMTP_PASS: \${SMTP_PASS}
      SMTP_SENDER_NAME: \${SMTP_SENDER_NAME}
      MAILER_URLPATHS_CONFIRMATION: \${MAILER_URLPATHS_CONFIRMATION}
      MAILER_URLPATHS_INVITE: \${MAILER_URLPATHS_INVITE}
      MAILER_URLPATHS_RECOVERY: \${MAILER_URLPATHS_RECOVERY}
      MAILER_URLPATHS_EMAIL_CHANGE: \${MAILER_URLPATHS_EMAIL_CHANGE}

  rest:
    image: postgrest/postgrest:v12.0.1
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://postgres:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}
      PGRST_DB_SCHEMA: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"

  db:
    image: supabase/postgres:14.1.0
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      JWT_SECRET: \${JWT_SECRET}
      JWT_EXP: \${JWT_EXPIRY}
    volumes:
      - ./volumes/db:/var/lib/postgresql/data

  storage:
    image: supabase/storage-api:v0.40.4
    restart: unless-stopped
    environment:
      ANON_KEY: \${ANON_KEY}
      SERVICE_KEY: \${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: \${JWT_SECRET}
      DATABASE_URL: postgres://postgres:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}
      PGOPTIONS: "-c search_path=storage,public"
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    volumes:
      - ./volumes/storage:/var/lib/storage

  meta:
    image: supabase/postgres-meta:v0.68.0
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: \${POSTGRES_HOST}
      PG_META_DB_PASSWORD: \${POSTGRES_PASSWORD}

  realtime:
    image: supabase/realtime:v2.25.7
    restart: unless-stopped
    environment:
      DB_HOST: \${POSTGRES_HOST}
      DB_PORT: \${POSTGRES_PORT}
      DB_NAME: \${POSTGRES_DB}
      DB_USER: postgres
      DB_PASSWORD: \${POSTGRES_PASSWORD}
      PORT: 4000
      JWT_SECRET: \${JWT_SECRET}
      REPLICATION_MODE: RLS
      REPLICATION_POLL_INTERVAL: 100
      SECURE_CHANNELS: "true"
      JWT_CLAIM_VALIDATORS: "role=service_role"

volumes:
  db:
    driver: local
  storage:
    driver: local
EOL
```

4. Create Kong configuration:
```bash
mkdir -p volumes
cat > volumes/kong.yml << EOL
_format_version: "2.1"
_transform: true

services:
  - name: auth-v1
    url: http://auth:9999/verify
    routes:
      - name: auth-v1-route
        strip_path: true
        paths:
          - /auth/v1/verify
    plugins:
      - name: cors
  - name: auth-v1-admin
    url: http://auth:9999/admin
    routes:
      - name: auth-v1-admin-route
        strip_path: true
        paths:
          - /auth/v1/admin
    plugins:
      - name: cors
  - name: auth-v1-callback
    url: http://auth:9999/callback
    routes:
      - name: auth-v1-callback-route
        strip_path: true
        paths:
          - /auth/v1/callback
    plugins:
      - name: cors
  - name: rest
    url: http://rest:3000
    routes:
      - name: rest-route
        strip_path: true
        paths:
          - /rest/v1
    plugins:
      - name: cors
  - name: realtime
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-route
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
  - name: storage
    url: http://storage:5000
    routes:
      - name: storage-route
        strip_path: true
        paths:
          - /storage/v1
    plugins:
      - name: cors
  - name: meta
    url: http://meta:8080
    routes:
      - name: meta-route
        strip_path: true
        paths:
          - /meta/v1
    plugins:
      - name: cors

plugins:
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-MD5
        - Content-Type
        - Date
        - apikey
        - Authorization
      exposed_headers:
        - Content-Length
        - Content-Range
      credentials: true
      max_age: 3600
EOL
```

5. Create directories and set permissions:
```bash
mkdir -p volumes/storage volumes/db
sudo chown -R 999:999 volumes/db
sudo chown -R 1000:1000 volumes/storage
```

6. Pull Docker images:
```bash
docker pull supabase/postgres:14.1.0
docker pull supabase/studio:20240315
docker pull supabase/kong:0.2.1
docker pull supabase/gotrue:v2.132.3
docker pull postgrest/postgrest:v12.0.1
docker pull supabase/storage-api:v0.40.4
docker pull supabase/postgres-meta:v0.68.0
docker pull supabase/realtime:v2.25.7
```

7. Start Supabase:
```bash
docker compose up -d
```

### 3.3 Update Nginx Configuration

Update the Nginx configuration to proxy Supabase requests:

```bash
sudo tee /etc/nginx/sites-available/gennergibelguuger << EOL
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gennergibelguuger/dist;
    index index.html;

    # Frontend application
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Supabase API
    location /rest/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /auth/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /storage/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /realtime/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOL

sudo nginx -t
sudo systemctl restart nginx
```

## Part 4: Database Setup

### 4.1 Initialize Database

1. Copy migration files:
```bash
cp -r /var/www/gennergibelguuger/supabase/migrations ~/supabase/
```

2. Apply migrations:
```bash
cd ~/supabase
for file in migrations/*.sql; do
  docker compose exec db psql -U postgres -d postgres -f /var/lib/postgresql/data/$(basename $file)
done
```

### 4.2 Create Admin User

1. Access Supabase Studio at `https://your-domain.com/studio`
2. Go to Authentication > Users
3. Click "Create User"
4. Enter admin email and password
5. Set role to "service_role" in user metadata

## Part 5: Security Hardening

### 5.1 Configure Security Headers

```bash
sudo tee /etc/nginx/conf.d/security.conf << EOL
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
EOL

sudo systemctl restart nginx
```

### 5.2 Setup Automatic Updates

```bash
sudo apt install -y unattended-upgrades

sudo tee /etc/apt/apt.conf.d/50unattended-upgrades << EOL
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
EOL

sudo systemctl enable --now unattended-upgrades
```

## Part 6: Monitoring and Maintenance

### 6.1 Setup Monitoring

1. Install monitoring tools:
```bash
sudo apt install -y prometheus node-exporter grafana

sudo tee /etc/prometheus/prometheus.yml << EOL
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
EOL

sudo systemctl enable prometheus node-exporter grafana-server
sudo systemctl start prometheus node-exporter grafana-server
```

### 6.2 Setup Backups

Create backup script:
```bash
sudo tee /usr/local/bin/backup.sh << EOL
#!/bin/bash
BACKUP_DIR="/var/backups/gennergibelguuger"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup frontend
tar -czf \$BACKUP_DIR/frontend_\$DATE.tar.gz /var/www/gennergibelguuger

# Backup database
cd ~/supabase
docker compose exec db pg_dump -U postgres postgres > \$BACKUP_DIR/db_\$DATE.sql

# Backup uploads
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz ~/supabase/volumes/storage

# Keep only last 7 days of backups
find \$BACKUP_DIR -type f -mtime +7 -delete
EOL

chmod +x /usr/local/bin/backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup.sh") | crontab -
```

### 6.3 Regular Maintenance Tasks

Create a maintenance script:
```bash
sudo tee /usr/local/bin/maintenance.sh << EOL
#!/bin/bash

# Update system packages
apt update && apt upgrade -y

# Update Docker images
cd ~/supabase
docker compose pull
docker compose up -d

# Clean up Docker
docker system prune -af --volumes

# Restart services
systemctl restart nginx
docker compose restart

# Check SSL certificates
certbot renew --dry-run

# Check disk usage
df -h
EOL

chmod +x /usr/local/bin/maintenance.sh

# Add to crontab (run weekly)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/maintenance.sh") | crontab -
```

## Part 7: Troubleshooting

### 7.1 Common Issues

1. Frontend not loading:
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check application permissions
sudo chown -R www-data:www-data /var/www/gennergibelguuger
```

2. Supabase issues:
```bash
# Check container status
docker compose ps

# View container logs
docker compose logs

# Restart specific service
docker compose restart service_name

# Check database
docker compose exec db psql -U postgres -d postgres
```

3. SSL issues:
```bash
# Test Nginx config
sudo nginx -t

# Check SSL certificates
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal
```

### 7.2 Performance Optimization

1. Enable Nginx caching:
```bash
sudo tee /etc/nginx/conf.d/caching.conf << EOL
# Browser caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
gzip_disable "MSIE [1-6]\.";
EOL

sudo systemctl restart nginx
```

2. Optimize PostgreSQL:
```bash
sudo tee -a ~/supabase/volumes/db/postgresql.conf << EOL
# Memory Configuration
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB

# Checkpoint Configuration
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
EOL

docker compose restart db
```

Remember to:
- Regularly monitor system resources
- Keep all software updated
- Maintain regular backups
- Document all configuration changes
- Monitor error logs