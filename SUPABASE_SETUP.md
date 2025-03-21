# Supabase Installation and Configuration Guide

## 1. Prerequisites

Ensure your Ubuntu server meets these requirements:
- Ubuntu 22.04 LTS or newer
- At least 4GB RAM
- At least 20GB storage
- Docker and Docker Compose installed
- Root or sudo access

## 2. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl enable --now docker

# Add your user to docker group
sudo usermod -aG docker $USER
```

## 3. Supabase Installation

Create a new directory for Supabase:

```bash
mkdir ~/supabase
cd ~/supabase
```

Create the configuration files:

```bash
# Create environment file
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
# Database - You can change these to any PostgreSQL database that has logical replication enabled.
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
# default user is postgres

############
# API Proxy - Configuration for the Kong Reverse proxy.
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API - Configuration for PostgREST.
############

PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth - Configuration for the GoTrue authentication server.
############

## General
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=http://localhost:8000

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender

## Phone auth
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false

############
# Studio - Configuration for the Dashboard
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project

STUDIO_PORT=3000
PUBLIC_REST_URL=http://localhost:8000/rest/v1/
EOL

# Create docker-compose.yml
cat > docker-compose.yml << EOL
version: "3.8"
services:
  studio:
    image: supabase/studio:latest
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
    image: kong:2.1
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
    image: supabase/gotrue:latest
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
    image: postgrest/postgrest:latest
    restart: unless-stopped
    environment:
      PGRST_DB_URI: postgres://postgres:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}
      PGRST_DB_SCHEMA: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"

  db:
    image: supabase/postgres:latest
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
    image: supabase/storage-api:latest
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
    image: supabase/postgres-meta:latest
    restart: unless-stopped
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: \${POSTGRES_HOST}
      PG_META_DB_PASSWORD: \${POSTGRES_PASSWORD}

  realtime:
    image: supabase/realtime:latest
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

# Create Kong configuration
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

## 4. Start Supabase

```bash
# Create required directories
mkdir -p volumes/storage volumes/db

# Set proper permissions
sudo chown -R 999:999 volumes/db
sudo chown -R 1000:1000 volumes/storage

# Start all services
docker compose up -d
```

## 5. Supabase Configuration

1. Access the Supabase Studio:
   - Open `http://your-server-ip:3000` in your browser
   - Log in with your admin credentials

2. Create Database Schema:
   - Go to SQL Editor
   - Run the following SQL to create required tables and policies:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  gennervogt_id uuid REFERENCES auth.users(id),
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for own contributions"
ON contributions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  auth.uid() = gennervogt_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "Enable insert access for authenticated users"
ON contributions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR
  auth.role() = 'service_role'
);

CREATE POLICY "Enable update access for admins"
ON contributions FOR UPDATE
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete access for admins"
ON contributions FOR DELETE
TO authenticated
USING (auth.role() = 'service_role');

-- Create view for user data
CREATE OR REPLACE VIEW user_data AS
SELECT id, email, role
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON user_data TO authenticated;
```

3. Configure Authentication:
   - Go to Authentication settings
   - Enable Email auth provider
   - Configure SMTP settings if you want to send emails
   - Set minimum password length to 8
   - Enable "Confirm email" if desired

4. Create Admin User:
   - Go to Authentication > Users
   - Click "Create User"
   - Enter admin email and password
   - After creation, click on the user
   - Set custom user metadata: `{ "role": "service_role" }`

5. Generate API Keys:
   - Go to Project Settings > API
   - Copy the `anon` public key and `service_role` key
   - Update your frontend environment variables:

```bash
VITE_SUPABASE_URL=http://your-server-ip:8000
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENCRYPTION_KEY=your-encryption-key
```

## 6. Security Configuration

1. Configure Firewall:
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000/tcp  # Supabase Studio
sudo ufw allow 8000/tcp  # Supabase API
sudo ufw enable
```

2. Set up SSL (optional but recommended):
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com
```

3. Configure Nginx as reverse proxy:
```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/supabase

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /rest/v1/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Backup Configuration

Create a backup script:
```bash
sudo nano /usr/local/bin/backup-supabase.sh

#!/bin/bash
BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec supabase-db-1 pg_dump -U postgres postgres > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz volumes/storage

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

chmod +x /usr/local/bin/backup-supabase.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-supabase.sh") | crontab -
```

## 8. Monitoring

1. Install monitoring tools:
```bash
sudo apt install -y prometheus node-exporter grafana
```

2. Configure Prometheus:
```bash
sudo nano /etc/prometheus/prometheus.yml

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
```

3. Configure Grafana:
- Access Grafana at `http://your-server-ip:3000`
- Add Prometheus as data source
- Import Docker and Node Exporter dashboards

## 9. Maintenance

Regular maintenance tasks:
1. Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Update Docker images:
```bash
cd ~/supabase
docker compose pull
docker compose up -d
```

3. Monitor logs:
```bash
docker compose logs -f
```

4. Check disk usage:
```bash
df -h
docker system df
```

5. Clean up old Docker images:
```bash
docker system prune -a
```

## 10. Troubleshooting

Common issues and solutions:

1. Database connection issues:
```bash
# Check database logs
docker compose logs db

# Connect to database
docker compose exec db psql -U postgres
```

2. API issues:
```bash
# Check Kong logs
docker compose logs kong

# Check REST API logs
docker compose logs rest
```

3. Authentication issues:
```bash
# Check auth service logs
docker compose logs auth
```

4. Storage issues:
```bash
# Check storage permissions
ls -la volumes/storage
sudo chown -R 1000:1000 volumes/storage
```

Remember to:
- Regularly check logs for errors
- Monitor system resources
- Keep backups in multiple locations
- Update security patches promptly
- Document any configuration changes