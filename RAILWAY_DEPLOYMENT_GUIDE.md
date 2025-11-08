# Railway.app Documentation & Deployment Guide

## Table of Contents

1. [About Railway](#about-railway)
2. [Setting Up for Production](#setting-up-for-production)
3. [Railway Free Plan: Pros and Cons](#railway-free-plan-pros-and-cons)
4. [Railway vs Other Hosting Solutions](#railway-vs-other-hosting-solutions)
5. [Production Readiness Checklist](#production-readiness-checklist)
6. [Best Practices for Deployment](#best-practices-for-deployment)
7. [Pricing Models](#pricing-models)

---

## About Railway

Railway is a deployment platform designed to streamline the software development life-cycle, starting with instant deployments and effortless scale, extending to CI/CD integrations and built-in observability.

### Key Features

**Flexible Deployment Sources**
- **Code Repositories**: With or without Dockerfiles. Railway will build an OCI compliant image based on what you provide.
- **Docker Images**: Directly from Docker Hub, GitHub Container Registry, GitLab Container Registry, Microsoft Container Registry, or Quay.io. Both public and private image registries are supported.

**Hassle-Free Setup**
- **Sane Defaults**: Out of the box, your project is deployed with sane defaults to get you up and running as fast as possible.
- **Configuration Tuning**: When you're ready, there are plenty of knobs and switches to optimize as needed.

**Development Features**
- **Variables & Secrets**: Easily manage configuration values and sensitive data
- **Environment Management**: Create both static and ephemeral environments
- **Observability**: Built-in observability tools to monitor deployments
- **CLI & API Integration**: Build Railway into any workflow using the CLI or API

---

## Setting Up for Production

### Environment Variables Setup

When deploying to production on Railway:

1. **Navigate to Project Settings**
   - Go to your project's Variables tab
   - Click "New Variable" to add individual variables
   - Or use "RAW Editor" to import a `.env` file

2. **Essential Production Variables**
   - Database connection strings (DATABASE_URL)
   - API keys and secrets
   - Environment-specific configuration
   - JWT secrets
   - External service credentials (Stripe, etc.)

3. **Using Reference Variables**
   - Reference shared variables: `${{ shared.VARIABLE_KEY }}`
   - Reference other services: `${{ SERVICE_NAME.VAR }}`
   - Reference same service: `${{ VARIABLE_NAME }}`
   - Example: `DATABASE_URL=${{ PostgreSQL.DATABASE_URL }}`

### Deployment Configuration

**Key Files for Production Setup**

1. **Procfile** (optional, case-sensitive)
   - Used to specify custom start commands
   - Example: `web: npm start`

2. **Dockerfile** (optional)
   - Railway can auto-detect without it
   - Custom Dockerfile provides more control

3. **railway.json / railway.toml**
   - Config as Code for version-controlled Railway settings
   - Allows tracking changes alongside source code

### Domain Configuration

1. **Generate a Railway Service Domain**
   - Services deployed on Railway receive a `.up.railway.app` domain by default
   - Example: `your-app-production.up.railway.app`

2. **Custom Domain Setup**
   - Navigate to Service Settings → Networking
   - Add custom domain and follow DNS configuration steps
   - Railway handles SSL/TLS provisioning and renewal automatically

### Database Setup

1. **Deploying Databases**
   - PostgreSQL
   - MySQL
   - MongoDB
   - Redis
   - Other open-source databases via Docker images

2. **Database Configuration**
   - Railway automatically provides `DATABASE_URL` environment variable
   - Connection strings are accessible to services in the same project

---

## Railway Free Plan: Pros and Cons

### PROS of Railway Free Plan

✅ **No Credit Card Required Initially**
- Start with a one-time $5 trial credit
- Test the platform risk-free

✅ **Generous Trial Allowance**
- $5 in usage credits (one-time)
- 30-day trial period
- Remaining credits carry over if you upgrade

✅ **Good for Experimentation**
- Perfect for hobby projects
- Ideal for learning and prototyping
- Can test multiple services during trial

✅ **Flexible Usage-Based Billing**
- Only pay for what you actually use
- No overprovisioning penalties
- Per-second billing granularity

✅ **Multiple Deployment Regions**
- Access to 8 global regions during trial
- Includes US, EU, and Southeast Asia

✅ **Built-in Features During Trial**
- Preview environments
- GitHub integration
- Environment management
- All platform features available

### CONS of Railway Free Plan

❌ **Services Stop When Credits Exhaust**
- Once $5 credits are used, services stop running
- Requires upgrade to a paid plan to continue
- No grace period or warning (after trial ends)

❌ **Limited Resource Allocation After Trial**
- Only 0.5 GB RAM per service (after trial)
- Only 1 vCPU per service (after trial)
- Limited to 1 project (after trial)
- Limited to 3 services per project (after trial)
- Very restricted volume storage (0.5 GB)

❌ **No Continuous Uptime for Production**
- Not suitable for production applications
- Cannot guarantee 24/7 availability
- Designed for temporary testing only

❌ **Limited Build Resources**
- 10 minute build timeout
- Restricted concurrent builds (1 after trial)
- Limited ephemeral disk (1 GB)

❌ **Scaling Restrictions**
- Only 1 replica (after trial)
- No horizontal scaling capability
- Cannot handle production traffic

❌ **Domain Limitations**
- Limited to 1 custom domain (during trial only)
- Only 2 service domains

❌ **Observability Limits**
- Only 3 days log retention (after trial)
- Limited log history

❌ **No Redundancy**
- Single instance deployment
- No high availability options
- If service crashes, no backup

### Verdict on Free Plan

**Good for:** Hobby projects, learning, prototyping, temporary deployments

**NOT suitable for:** Production applications, long-term projects, sites requiring 24/7 uptime

---

## Railway vs Other Hosting Solutions

### Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| **Free Tier** | $5 one-time credit, then paid only | Always-on free tier for certain services |
| **App Sleep Behavior** | Stops when credits exhaust | May spin down on inactivity, doesn't auto-shutdown |
| **Background Jobs** | No native support (requires workaround) | Built-in support |
| **Cron Jobs** | Recently added, functional but limited | Well-integrated, more flexible |
| **Pricing Model** | Usage-based (pay per second) | Fixed monthly tiers |
| **Databases** | PostgreSQL, MySQL, Redis, MongoDB built-in | PostgreSQL, Redis only natively |
| **Team Pricing** | $20/user/month on Pro | $29/user/month on Team plan |
| **Build Minutes** | Included in plans | Monthly quota per plan |

**Choose Railway if:** You prefer flexible, usage-based billing and occasional workloads

**Choose Render if:** You want predictable pricing and built-in background workers for production

### Railway vs VPS Hosting (AWS EC2, DigitalOcean, etc.)

| Area | Railway | VPS |
|------|---------|-----|
| **Setup Complexity** | Minutes (zero-config) | Hours (full responsibility) |
| **OS & Patches** | Automatic | Manual |
| **Scaling** | Automatic vertical & horizontal | Manual scaling required |
| **Monitoring** | Built-in logs & metrics | Must integrate tools (Prometheus, Grafana) |
| **Security** | SOC 2 Type II, GDPR, automatic patches | Your responsibility |
| **Multi-Region** | One-click deploy globally | Complex DNS/load balancer setup |
| **Cost** | Usage-based, only active compute | Fixed monthly, pay even when idle |
| **DevOps Overhead** | Minimal | Significant |

**Choose Railway if:** You want managed infrastructure with minimal ops overhead

**Choose VPS if:** You need maximum control and are willing to manage infrastructure

### Railway Advantages Summary

✅ **Ease of Deployment**
- Connect GitHub repo, instant deployment
- Zero configuration required
- Auto language/framework detection

✅ **Developer Experience**
- Real-time collaboration in dashboard
- Preview environments for PRs
- One-click rollbacks

✅ **Cost Efficiency**
- Usage-based billing (only pay when running)
- No overprovisioning penalties
- Many users report 40-75% savings vs Heroku/AWS

✅ **Global Scale Made Simple**
- Multi-region deployment with one click
- Automatic traffic routing
- Built-in CDN-like performance

✅ **Production Ready**
- SOC 2 Type II certified
- GDPR compliant
- HIPAA support (Enterprise)
- DDoS protection

✅ **Comprehensive Platform**
- Databases included (PostgreSQL, MySQL, Redis, MongoDB)
- Private networking for services
- Built-in observability

### Railway Disadvantages Summary

❌ **No Native Background Workers**
- Must configure as separate services
- More manual setup required

❌ **Cron Jobs Have Limitations**
- No dynamic parameters
- Cannot pass input variables
- Less flexible than dedicated job services

❌ **Egress Costs**
- Outbound traffic charges ($0.05/GB)
- Can add up for data-heavy applications

❌ **Build Time Limits**
- 90 minutes max (even on Pro)
- Can be restrictive for large builds

❌ **Not Ideal for Certain Workloads**
- Large data processing jobs
- Real-time applications requiring low latency
- Compute-intensive tasks

❌ **Trial Credit Structure**
- One-time $5 credit expires in 30 days
- Services completely stop if credits run out

---

## Production Readiness Checklist

### Performance and Reliability

**✓ Serve from the Right Region**
- Deploy as close to users as possible
- Minimize network hops and latency
- Consider CDN for static content
- Use Railway's multiple global regions

**✓ Use Private Networking Between Services**
- Reduce latency between internal services
- Avoid egress charges for service-to-service communication
- Configure reference variables to use `RAILWAY_PRIVATE_DOMAIN`

**✓ Configure Restart Policy**
- Handle unexpected crashes automatically
- Implement proper error recovery
- Set appropriate restart strategies

**✓ Configure at Least 2 Replicas**
- Ensure high availability
- Handle instance failures gracefully
- Continue serving if one instance crashes

**✓ Confirm Compute Capacity**
- Review plan resource limits (vCPU, memory)
- Upgrade if necessary for desired performance
- Monitor actual usage patterns

**✓ Deploy Database with Redundancy**
- Use cluster or replica set configuration
- Ensure data remains available if node fails
- Example: Redis HA with Sentinel template

### Observability and Monitoring

**✓ Familiarize with Log Explorer**
- Query logs across all services in one place
- Faster issue diagnosis
- Better debugging capability

**✓ Setup Webhooks and Notifications**
- Email alerts for deployment status changes
- Enable in Account Settings
- Configure webhooks to Slack or Discord for real-time notifications

**✓ Monitor Key Metrics**
- CPU, memory, and network usage
- Deployment status and build logs
- Application error rates

### Quality Assurance

**✓ Implement Check Suites**
- Run tests before deployment
- Configure Railway to wait for GitHub workflows
- Ensure code quality gates pass

**✓ Use Environments**
- Separate development and production
- Use PR environments for testing changes
- Prevent breaking changes in production

**✓ Use Config as Code**
- Maintain Railway config in JSON/TOML
- Version control infrastructure changes
- Track configuration history

**✓ Understand Deployment Rollback**
- Know how to quickly revert to previous versions
- Keep deployment history
- Test rollback procedures

### Security

**✓ Use Private Networking**
- Keep services unexposed to public network
- Reduce attack surface
- Use private domains for internal communication

**✓ Implement Security Layer**
- Use services like Cloudflare WAF
- Enable DDoS mitigation
- Monitor for suspicious activity

**✓ Manage Secrets Properly**
- Use sealed variables for sensitive data
- Never commit secrets to repository
- Rotate credentials regularly
- Use reference variables for dynamic values

### Disaster Recovery

**✓ Deploy to Two Regions**
- Prepare for regional outages
- Use App Sleep to reduce idle costs
- Implement automatic failover

**✓ Regular Data Backups**
- Enable backups for services with volumes
- Test backup restoration
- Maintain backup retention policy
- Document recovery procedures

---

## Best Practices for Deployment

### 1. Use Private Networking When Possible

Benefits:
- Faster communication between services
- No egress charges for internal traffic
- Increased security by avoiding public network exposure

Implementation:
- Use `RAILWAY_PRIVATE_DOMAIN` for database connections
- Reference internal services via private domains
- Keep service-to-service communication internal

Example:
```
DATABASE_URL=postgres://user:password@database.railway.internal:5432/dbname
```

### 2. Keep Related Services in Same Project

Advantages:
- Access to private networking
- Shared variable management
- Reduced dashboard clutter
- Easier environment management

Strategy:
- Group application with its database
- Keep backend and frontend together if possible
- Use the "Create" button to add services to existing project

### 3. Use Reference Variables

Benefits:
- Avoid hardcoding values
- Automatic updates when references change
- Reduced configuration errors
- Easier migrations and updates

Examples:
```
// Reference another service's domain
VITE_BACKEND_HOST=${{Backend.RAILWAY_PUBLIC_DOMAIN}}

// Reference database connection
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

// Reference shared variables
API_KEY=${{shared.API_KEY}}
```

### 4. Implement Proper Health Checks

Purpose:
- Detect unhealthy instances
- Trigger automatic restarts
- Ensure availability
- Prevent broken connections

Configuration:
- Set health check endpoint
- Configure check interval and timeout
- Set failure threshold

### 5. Optimize for Usage

Techniques:
- Set usage limits to prevent unexpected bills
- Enable App Sleep for inactive services
- Monitor resource consumption
- Right-size service allocations

### 6. Use Config as Code

Benefits:
- Version control infrastructure
- Consistent deployments
- Team collaboration on config
- Easy rollbacks

Format:
- `railway.json` (JSON format)
- `railway.toml` (TOML format)
- Committed to git repository

### 7. Implement Proper CI/CD

Steps:
1. Enable GitHub autodeploys
2. Configure check suites
3. Wait for tests to pass before deployment
4. Use PR environments for testing
5. Implement rollback procedures

### 8. Monitor and Alert

Setup:
- Configure email notifications
- Setup webhook integrations (Slack, Discord)
- Monitor deployment status
- Track application performance
- Set up custom alerts for critical metrics

---

## Pricing Models

### Plan Comparison

#### Free Trial
- **Cost**: $5 one-time credit (expires in 30 days)
- **Projects**: 5 during trial, then 1
- **Services per project**: 5 during trial, then 3
- **RAM**: Up to 1 GB per service during trial, then 0.5 GB
- **CPU**: Up to 2 vCPU during trial, then 1 vCPU
- **Volume storage**: 0.5 GB
- **Replicas**: 2 during trial, then 1
- **Build timeout**: 20 mins during trial, then 10 mins
- **Custom domains**: 1 during trial, then 0
- **Log retention**: 7 days during trial, then 3 days
- **Support**: Community only

#### Hobby Plan
- **Cost**: $1/month + $5 monthly usage credits (pay extra if exceeded)
- **Projects**: 50
- **Services**: 50 per project
- **RAM**: Up to 8 GB per service
- **CPU**: Up to 8 vCPU per service
- **Volume storage**: 5 GB
- **Replicas**: Up to 5 per service
- **Build timeout**: 40 mins
- **Custom domains**: 2
- **Service domains**: 4
- **Log retention**: 7 days
- **Concurrent builds**: 3
- **Global regions**: Included
- **Support**: Community support

#### Pro Plan
- **Cost**: $20/month + $20 monthly usage credits (pay extra if exceeded)
- **Projects**: 100 (unlimited with request)
- **Services**: 100 per project
- **RAM**: Up to 32 GB per service
- **CPU**: Up to 32 vCPU per service
- **Volume storage**: 250 GB
- **Replicas**: Up to 50 per service
- **Build timeout**: 90 mins
- **Custom domains**: 20
- **Service domains**: 20
- **Log retention**: 30 days
- **Concurrent builds**: 10
- **Concurrent regions**: Included
- **Unlimited team seats**: Included
- **Priority support**: Yes
- **Granular access control**: Yes

#### Enterprise Plan
- **Cost**: Custom pricing
- **Features**: All Pro features plus:
  - SSO (Single Sign-On)
  - Audit logs
  - HIPAA BAAs ($1,000 add-on)
  - Support SLOs
  - 90-day log history
  - Dedicated VMs ($10,000 add-on)
  - Bring your own cloud (BYOC)
  - Enterprise support ($2,000 add-on)

### Usage-Based Pricing

Railway charges separately for:

- **Memory**: $0.00000386 per GB/second
- **CPU**: $0.00000772 per vCPU/second
- **Volumes**: $0.00000006 per GB/second
- **Egress**: $0.05 per GB (outbound traffic)

### Cost Optimization Tips

1. **Use Hobby Plan for Production**
   - $20/month base is reasonable for small to medium projects
   - $20 monthly credit reduces actual cost
   - Can upgrade resources as needed

2. **Enable App Sleep**
   - Services sleep after 10 minutes of inactivity
   - No compute charges while sleeping
   - Ideal for bursty workloads
   - Automatic wake-up on requests

3. **Use Private Networking**
   - No egress charges for internal service communication
   - Saves money on database queries
   - Faster than public routing

4. **Optimize Resource Allocation**
   - Start with minimum and scale up as needed
   - Monitor actual usage
   - Use auto-scaling features
   - Avoid over-provisioning

5. **Take Advantage of Included Credits**
   - Hobby: $5/month credit
   - Pro: $20/month credit
   - Use credits toward actual usage

### Cost Savings Examples

Real user experiences:
- **Common (startup)**: Migrated from Heroku, saved 75% with auto-scaling
- **BoxOutSports**: Moved $5.5k/month from AWS+Heroku to $300/month on Railway
- **Every**: Reduced $100k/year AWS bill by 90% with improved developer experience
- **General estimate**: Most customers save ~40% switching from other platforms

---

## Getting Started on Railway

### Step 1: Create Account
1. Go to [railway.com](https://railway.com)
2. Sign up (no credit card required for trial)
3. Receive $5 trial credit (30 days)

### Step 2: Connect Repository
1. Click "Deploy from GitHub repo"
2. Connect your GitHub account
3. Select the repository to deploy

### Step 3: Set Environment Variables
1. Click on deployed service
2. Navigate to Variables tab
3. Add variables manually or import `.env` file
4. Use Raw Editor for bulk imports

### Step 4: Configure Domain
1. Go to Service Settings → Networking
2. Either:
   - Generate Railway domain (automatic `.up.railway.app`)
   - Add custom domain (follow DNS setup)

### Step 5: Deploy
1. Confirm all configurations
2. Railway automatically builds and deploys
3. Monitor logs in dashboard
4. Service is live!

### Step 6: Upgrade for Production
1. Once trial ends, upgrade to Hobby or Pro plan
2. Services continue running with paid plan
3. Select appropriate plan based on needs
4. Add billing information

---

## Key Takeaways

### When Railway is Right
- Rapid development and deployment needed
- Small to medium applications
- Cost-conscious projects
- Startups and indie hackers
- Applications with variable traffic
- Need for multi-region deployment
- Prefer managed infrastructure

### When Consider Alternatives
- Need native background worker support
- Very high egress traffic (bandwidth-intensive)
- Require fixed monthly pricing (use Render instead)
- Need maximum compute control (use VPS)
- Enterprise compliance requirements beyond Railway's offerings

### Final Recommendation for Your Website

Railway is an **excellent choice** for your website because:

1. ✅ Easy GitHub integration for automated deploys
2. ✅ Built-in database hosting (PostgreSQL, MySQL, Redis)
3. ✅ Usage-based pricing matches variable traffic
4. ✅ Global regions for better performance
5. ✅ Private networking reduces database costs
6. ✅ Preview environments for testing PRs
7. ✅ Production-ready with SOC 2 compliance
8. ✅ Affordable for small to medium sites

**Recommended Setup:**
- Use **Hobby Plan** ($20/month + $5 monthly credits)
- Deploy frontend and backend in same project
- Use private networking for database
- Enable 2+ replicas for high availability
- Set up monitoring and alerts
- Enable App Sleep for cost optimization

---

*Documentation compiled from Railway official documentation*
*Last updated: November 8, 2025*
