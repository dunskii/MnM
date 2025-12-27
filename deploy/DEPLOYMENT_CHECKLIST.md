# Music 'n Me - Production Deployment Checklist

This comprehensive checklist ensures a smooth and secure production deployment to DigitalOcean App Platform.

---

## Pre-Deployment Preparation

### 1. Code & Testing

- [ ] All features from Week 12 completed and tested
- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing
- [ ] Load testing completed successfully
  - [ ] Dashboard load test: `npm run load-test:dashboard`
  - [ ] Calendar load test (500+ events): `npm run load-test:calendar`
  - [ ] Hybrid booking concurrency test: `npm run load-test:hybrid`
  - [ ] Full load test (200 concurrent users): `npm run load-test:report`
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] ESLint checks passed (`npm run lint`)
- [ ] No console.log or debug statements in production code
- [ ] All TODO/FIXME comments addressed or documented

### 2. Database Preparation

- [ ] All Prisma migrations created and tested locally
- [ ] Migration files reviewed for destructive operations
- [ ] Database seed data prepared (if needed)
- [ ] Backup strategy confirmed
- [ ] Database indexes optimized for production queries
- [ ] Foreign key constraints verified
- [ ] Cascade delete rules reviewed

### 3. Environment Variables

#### Backend Environment Variables

- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` generated (openssl rand -base64 64)
- [ ] `JWT_REFRESH_SECRET` generated (different from JWT_SECRET)
- [ ] `ENCRYPTION_KEY` generated (openssl rand -base64 32)
- [ ] `DATABASE_URL` configured (DigitalOcean managed DB)
- [ ] `REDIS_URL` configured (DigitalOcean managed Redis)
- [ ] Stripe keys configured:
  - [ ] `STRIPE_SECRET_KEY` (live key)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (live key)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production webhook secret)
- [ ] SendGrid configured:
  - [ ] `SENDGRID_API_KEY` (production key)
  - [ ] `SENDGRID_FROM_EMAIL` verified sender
  - [ ] Email templates created in SendGrid dashboard
- [ ] Google OAuth & Drive API configured:
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `GOOGLE_REDIRECT_URI` (production URL)
  - [ ] Service account credentials
  - [ ] Drive API enabled in Google Cloud Console
  - [ ] OAuth consent screen configured
- [ ] `FRONTEND_URL` set to production domain
- [ ] All secrets stored securely (DigitalOcean dashboard, never in code)

#### Frontend Environment Variables

- [ ] `VITE_API_URL` set to production API URL
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (live key)
- [ ] `VITE_GOOGLE_CLIENT_ID` configured
- [ ] Feature flags set correctly
- [ ] Environment file not committed to Git

### 4. Third-Party Service Configuration

#### Stripe

- [ ] Live mode enabled
- [ ] Webhook endpoint configured: `https://musicnme.com.au/api/v1/webhooks/stripe`
- [ ] Webhook events selected:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Webhook signature verification tested
- [ ] Payment methods enabled (credit cards minimum)
- [ ] Currency set to AUD
- [ ] Test transactions completed successfully

#### SendGrid

- [ ] Sender domain verified (`musicnme.com.au`)
- [ ] SPF and DKIM records added to DNS
- [ ] Email templates created:
  - [ ] Welcome email
  - [ ] Invoice notification
  - [ ] Payment confirmation
  - [ ] Lesson reminder
  - [ ] Password reset
  - [ ] Meet & greet confirmation
- [ ] Template IDs added to environment variables
- [ ] Unsubscribe group created
- [ ] Test emails sent and received

#### Google Cloud Platform

- [ ] Project created (`music-n-me-prod`)
- [ ] Google Drive API enabled
- [ ] OAuth 2.0 credentials created
- [ ] OAuth consent screen configured:
  - [ ] App name: "Music 'n Me"
  - [ ] User support email set
  - [ ] Developer contact email set
  - [ ] Authorized domains added
  - [ ] Scopes added: `drive.file`, `drive.readonly`
- [ ] Service account created for Drive sync
- [ ] Service account key downloaded and secured
- [ ] Service account granted access to Drive folders
- [ ] API quotas reviewed (1000 requests/min default)

### 5. Domain & SSL Configuration

- [ ] Domain `musicnme.com.au` registered
- [ ] DNS records configured:
  - [ ] A record pointing to DigitalOcean
  - [ ] CNAME for `www` subdomain
  - [ ] SPF record for SendGrid
  - [ ] DKIM record for SendGrid
- [ ] SSL certificate auto-provisioned by DigitalOcean
- [ ] HTTPS redirect enabled
- [ ] Certificate expiration monitoring enabled

---

## DigitalOcean Setup

### 1. Account & Billing

- [ ] DigitalOcean account created
- [ ] Payment method added
- [ ] Billing alerts configured
- [ ] Monthly budget set
- [ ] Team members invited (if applicable)

### 2. Managed Database (PostgreSQL)

- [ ] Database cluster created:
  - [ ] Engine: PostgreSQL 15
  - [ ] Size: db-s-1vcpu-1gb (or higher based on load tests)
  - [ ] Region: Sydney (syd)
  - [ ] Nodes: 1 (can scale to 2 for HA)
- [ ] Database `musicnme` created
- [ ] User `musicnme_user` created with strong password
- [ ] Connection pool enabled (recommended: 10-20 connections)
- [ ] SSL mode enforced
- [ ] Firewall rules configured (App Platform only)
- [ ] Automated backups enabled:
  - [ ] Daily backups
  - [ ] 7-day retention (or longer)
  - [ ] Backup time set to low-traffic hours
- [ ] Point-in-time recovery enabled
- [ ] Database monitoring enabled

### 3. Managed Redis

- [ ] Redis cluster created:
  - [ ] Engine: Redis 7
  - [ ] Size: db-s-1vcpu-1gb
  - [ ] Region: Sydney (syd)
  - [ ] Eviction policy: allkeys-lru
- [ ] Password authentication enabled
- [ ] Persistence enabled (appendonly yes)
- [ ] Firewall rules configured (App Platform only)
- [ ] Monitoring enabled

### 4. App Platform Configuration

- [ ] GitHub repository connected
- [ ] App created from `deploy/digitalocean/app.yaml`
- [ ] Services configured:
  - [ ] **API Service**:
    - [ ] Source: `apps/backend`
    - [ ] Dockerfile: `deploy/docker/Dockerfile.backend`
    - [ ] Instance size: professional-xs (1 vCPU, 2GB RAM)
    - [ ] Instance count: 2 (for high availability)
    - [ ] Health check: `/health`
    - [ ] Environment variables set (all secrets)
  - [ ] **Web Service** (Frontend):
    - [ ] Source: `apps/frontend`
    - [ ] Build command: `npm run build`
    - [ ] Output dir: `/dist`
    - [ ] Environment variables set (build-time)
  - [ ] **Worker Service** (Background jobs):
    - [ ] Source: `apps/backend`
    - [ ] Type: WORKER
    - [ ] Instance size: basic-xxs (0.5 vCPU, 512MB)
- [ ] Database attached to services
- [ ] Redis attached to services
- [ ] CORS configured correctly
- [ ] Routes configured:
  - [ ] `/api` → API service
  - [ ] `/` → Web service
- [ ] Auto-deploy enabled on `main` branch
- [ ] Deployment notifications configured

### 5. Monitoring & Alerts

- [ ] DigitalOcean monitoring enabled
- [ ] Alert policies configured:
  - [ ] CPU utilization > 80%
  - [ ] Memory utilization > 80%
  - [ ] Disk usage > 85%
  - [ ] Database connection failures
  - [ ] API error rate > 5%
  - [ ] Deployment failures
- [ ] Email notifications set up
- [ ] Uptime monitoring configured (Uptime Robot or similar)
- [ ] Error tracking configured (Sentry optional)

---

## Deployment Steps

### Step 1: Database Migration

```bash
# Connect to production database
export DATABASE_URL="postgresql://user:password@host:25060/musicnme?sslmode=require"

# Run migrations (from local machine or CI/CD)
cd apps/backend
npx prisma migrate deploy

# Verify migration success
npx prisma db pull
npx prisma validate
```

- [ ] Migrations completed without errors
- [ ] Database schema matches Prisma schema
- [ ] All tables created successfully
- [ ] Indexes created
- [ ] Constraints applied

### Step 2: Seed Production Data (if needed)

```bash
# Seed initial data (school setup, admin user, etc.)
npm run db:seed
```

- [ ] Admin user created
- [ ] Default school settings created
- [ ] Default lesson types created
- [ ] Default instruments created
- [ ] Test data NOT included in production

### Step 3: Deploy Backend

- [ ] Push code to `main` branch
- [ ] Auto-deployment triggered
- [ ] Build logs reviewed (no errors)
- [ ] Health check passing
- [ ] API responding at `https://musicnme.com.au/api/v1`

### Step 4: Deploy Frontend

- [ ] Frontend build triggered
- [ ] Build logs reviewed (no errors)
- [ ] Static files deployed to CDN
- [ ] Website accessible at `https://musicnme.com.au`
- [ ] All pages loading correctly
- [ ] No console errors in browser

### Step 5: Verify Integrations

#### Stripe Integration

- [ ] Test payment flow (use live mode test card)
- [ ] Webhook events received
- [ ] Payment intent created successfully
- [ ] Invoice generated after payment
- [ ] Confirmation email sent

#### SendGrid Integration

- [ ] Welcome email sent to new user
- [ ] Invoice notification sent
- [ ] Password reset email sent
- [ ] All emails delivered (check SendGrid activity)
- [ ] Unsubscribe link working

#### Google Drive Integration

- [ ] OAuth flow working
- [ ] User can connect Drive account
- [ ] Teacher can upload files
- [ ] Files sync to Drive successfully
- [ ] Students can download files
- [ ] Background sync job running every 15 minutes

### Step 6: Functional Testing

- [ ] **Authentication**:
  - [ ] User registration working
  - [ ] Login working (all roles)
  - [ ] Logout working
  - [ ] Password reset working
  - [ ] JWT refresh working
- [ ] **Admin Functions**:
  - [ ] Dashboard loading
  - [ ] Create/edit users
  - [ ] Create/edit lessons
  - [ ] View reports
  - [ ] Manage school settings
- [ ] **Teacher Functions**:
  - [ ] View all classes
  - [ ] Mark attendance
  - [ ] Upload resources
  - [ ] Add teacher notes (required)
  - [ ] View student progress
- [ ] **Parent Functions**:
  - [ ] View family schedule
  - [ ] Pay invoices (Stripe)
  - [ ] Book hybrid individual sessions
  - [ ] Download resources
  - [ ] View children's progress
- [ ] **Meet & Greet**:
  - [ ] Public booking form accessible
  - [ ] Email verification working
  - [ ] Payment required (Stripe)
  - [ ] Admin approval workflow
  - [ ] Registration pre-populated
- [ ] **Hybrid Lessons**:
  - [ ] Parent can see available slots
  - [ ] Booking race conditions handled correctly
  - [ ] 24-hour cancellation rule enforced
  - [ ] Calendar shows placeholders
  - [ ] Confirmation emails sent

### Step 7: Performance Testing

- [ ] Run load tests against production:
  ```bash
  # Update target URL in artillery.yml to production URL
  npm run load-test:report
  ```
- [ ] Review results:
  - [ ] Error rate < 1%
  - [ ] p95 response time < 1000ms
  - [ ] p99 response time < 2000ms
  - [ ] 200 concurrent users supported
  - [ ] Database connection pool not exhausted
  - [ ] Redis queue healthy
- [ ] Calendar performance with 500+ events acceptable
- [ ] Dashboard loads in < 2 seconds
- [ ] Hybrid booking handles concurrent requests correctly

### Step 8: Security Verification

- [ ] HTTPS enforced (no HTTP access)
- [ ] Security headers present:
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security
  - [ ] Content-Security-Policy
- [ ] CORS configured (only musicnme.com.au allowed)
- [ ] Rate limiting working (test with repeated requests)
- [ ] Login rate limiting working (test with failed logins)
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection working
- [ ] JWT expiration enforced
- [ ] Sensitive data encrypted
- [ ] No secrets in client-side code
- [ ] Database SSL connections enforced
- [ ] Redis password authentication working

---

## Post-Deployment Verification

### 1. Monitoring (First 24 Hours)

- [ ] Monitor error logs (first hour)
- [ ] Monitor performance metrics
- [ ] Check database connection pool usage
- [ ] Check Redis memory usage
- [ ] Monitor email delivery rates
- [ ] Monitor payment success rates
- [ ] Check background job queue health

### 2. User Acceptance Testing

- [ ] Admin user tests core workflows
- [ ] Test teacher creates account and logs in
- [ ] Test parent creates account and pays invoice
- [ ] Test student views schedule
- [ ] Gather initial feedback

### 3. Documentation

- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document rollback procedure
- [ ] Update API documentation
- [ ] Share admin credentials securely

---

## Rollback Procedure (If Issues Arise)

### Immediate Rollback

If critical issues are discovered:

1. **Rollback Application**:
   ```bash
   # Via DigitalOcean dashboard
   # Go to App → Deployments → Select previous deployment → Rollback
   ```

2. **Rollback Database** (if migration caused issue):
   ```bash
   # Restore from automated backup
   # Via DigitalOcean dashboard → Databases → Backups → Restore
   ```

3. **Notify Users**:
   - [ ] Post status update (if status page exists)
   - [ ] Send email to active users
   - [ ] Update social media (if applicable)

4. **Investigate Issue**:
   - [ ] Review error logs
   - [ ] Identify root cause
   - [ ] Create hotfix branch
   - [ ] Test fix locally
   - [ ] Redeploy when ready

---

## Week 1 Production Support

### Daily Checks (Days 1-7)

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor payment success rate
- [ ] Monitor email delivery
- [ ] Monitor background job failures
- [ ] Check disk space usage
- [ ] Review user feedback

### Weekly Tasks

- [ ] Database backup verification
- [ ] Security scan (OWASP ZAP or similar)
- [ ] Dependency updates (security patches only)
- [ ] Performance optimization (if needed)
- [ ] User feedback review
- [ ] Incident postmortem (if applicable)

---

## Success Criteria

Deployment is considered successful when:

- [ ] All services are running and healthy
- [ ] All integrations (Stripe, SendGrid, Google) working
- [ ] Zero critical errors in first 24 hours
- [ ] Performance meets SLA (p95 < 1s, error rate < 1%)
- [ ] All user roles can complete core workflows
- [ ] Payment processing working correctly
- [ ] Email notifications being delivered
- [ ] Background jobs processing successfully
- [ ] No data loss or corruption
- [ ] SSL certificate valid
- [ ] Monitoring and alerts operational

---

## Emergency Contacts

| Service | Contact | Purpose |
|---------|---------|---------|
| DigitalOcean Support | support@digitalocean.com | Infrastructure issues |
| Stripe Support | https://support.stripe.com | Payment processing |
| SendGrid Support | support@sendgrid.com | Email delivery |
| Google Cloud Support | https://cloud.google.com/support | OAuth/Drive API |
| DNS Provider | varies | Domain/DNS issues |

---

## Notes

- Keep this checklist updated as deployment process evolves
- Document any deviations from the plan
- Capture lessons learned for future deployments
- Store all credentials in secure password manager (1Password, LastPass, etc.)
- Never share secrets via email or Slack
- Schedule deployment during low-traffic hours (Australian evenings)
- Have backup team member available during deployment

---

**Last Updated**: 2025-12-26
**Deployment Date**: TBD
**Deployed By**: TBD
**Deployment Status**: ⏳ Pending
