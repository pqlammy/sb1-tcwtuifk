# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Environment Variable Warnings

If you see warnings about missing environment variables when running `docker-compose up -d`, update your `.env` file with the following complete configuration:

```env
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

API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000
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
```

### 2. Docker Compose Version Warning

If you see the warning about obsolete version attribute, update your `docker-compose.yml` by removing the `version: "3.8"` line at the top of the file.

### 3. Manifest Not Found Errors

If you encounter manifest errors for Supabase images, follow these steps:

1. Pull the images explicitly first:
   ```bash
   docker pull supabase/postgres:14.1.0
   docker pull supabase/studio:latest
   docker pull supabase/kong:latest
   docker pull supabase/gotrue:latest
   docker pull postgrest/postgrest:latest
   docker pull supabase/storage-api:latest
   docker pull supabase/postgres-meta:latest
   docker pull supabase/realtime:latest
   ```

2. Update image versions in docker-compose.yml:
   ```yaml
   # Replace 'latest' tags with specific versions
   studio:
     image: supabase/studio:20240315
   
   kong:
     image: supabase/kong:0.2.1
   
   auth:
     image: supabase/gotrue:v2.132.3
   
   rest:
     image: postgrest/postgrest:v12.0.1
   
   db:
     image: supabase/postgres:14.1.0
   
   storage:
     image: supabase/storage-api:v0.40.4
   
   meta:
     image: supabase/postgres-meta:v0.68.0
   
   realtime:
     image: supabase/realtime:v2.25.7
   ```

3. Clean up Docker:
   ```bash
   # Remove unused images and containers
   docker system prune -a
   
   # Remove existing volumes
   docker-compose down -v
   ```

4. Restart Docker daemon:
   ```bash
   sudo systemctl restart docker
   ```

5. Try starting the services again:
   ```bash
   docker-compose up -d
   ```

### 4. Checking Service Status

After starting the services, verify they are running correctly:

```bash
# Check service status
docker-compose ps

# Check logs for specific service
docker-compose logs studio
docker-compose logs db
docker-compose logs auth

# Check all logs
docker-compose logs
```

### 5. Database Connection Issues

If you can't connect to the database:

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps db
   ```

2. Check database logs:
   ```bash
   docker-compose logs db
   ```

3. Try connecting directly:
   ```bash
   docker-compose exec db psql -U postgres
   ```

4. Verify database volume permissions:
   ```bash
   ls -la volumes/db
   sudo chown -R 999:999 volumes/db
   ```

### 6. Studio Access Issues

If you can't access the Studio interface:

1. Check Studio logs:
   ```bash
   docker-compose logs studio
   ```

2. Verify network connectivity:
   ```bash
   curl http://localhost:3000
   ```

3. Check if the port is open:
   ```bash
   sudo netstat -tulpn | grep 3000
   ```

### 7. Authentication Issues

If authentication is not working:

1. Check auth service logs:
   ```bash
   docker-compose logs auth
   ```

2. Verify JWT settings:
   ```bash
   # Check if JWT_SECRET is set correctly
   docker-compose exec auth env | grep JWT
   ```

3. Test authentication endpoint:
   ```bash
   curl http://localhost:8000/auth/v1/verify
   ```

### 8. Storage Issues

If file storage is not working:

1. Check storage permissions:
   ```bash
   ls -la volumes/storage
   sudo chown -R 1000:1000 volumes/storage
   ```

2. Verify storage service:
   ```bash
   docker-compose logs storage
   ```

### 9. Backup and Recovery

If you need to start fresh:

1. Backup your data:
   ```bash
   # Backup database
   docker-compose exec db pg_dump -U postgres postgres > backup.sql
   
   # Backup storage
   tar -czf storage_backup.tar.gz volumes/storage
   ```

2. Reset everything:
   ```bash
   # Stop all services
   docker-compose down -v
   
   # Remove all data
   sudo rm -rf volumes
   
   # Recreate directories
   mkdir -p volumes/storage volumes/db
   
   # Fix permissions
   sudo chown -R 999:999 volumes/db
   sudo chown -R 1000:1000 volumes/storage
   ```

3. Start fresh:
   ```bash
   docker-compose up -d
   ```

Remember to always check the logs (`docker-compose logs`) for detailed error messages when troubleshooting issues.