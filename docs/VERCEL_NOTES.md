# Vercel Deployment Guide for FBPro.MCP Frontend

## Overview

This guide covers deploying the FBPro.MCP React frontend to Vercel for production hosting.

## Prerequisites

- Vercel account (free tier available)
- GitHub repository access
- Production environment variables
- Domain configuration access

## Step-by-Step Deployment

### 1. Vercel Account Setup

#### Create Account
1. Visit [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Authorize Vercel to access repositories

#### Import Project
1. Click "New Project" in Vercel dashboard
2. Import from GitHub: `your-org/fbpro-mcp`
3. Select framework preset: **React**
4. Configure build settings:
   ```
   Build Command: npm run build
   Output Directory: client/dist
   Install Command: npm install
   ```

### 2. Environment Configuration

#### Required Environment Variables
```bash
# API Connection
VITE_API_BASE_URL=https://api.fbpro.ai

# Stripe Integration
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# Analytics (Optional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=XXXXXXX

# Feature Flags (Optional)
VITE_ENABLE_BETA_FEATURES=false
VITE_ENABLE_ANALYTICS=true

# Sentry (Error Tracking)
VITE_SENTRY_DSN=https://YOUR_SENTRY_DSN
VITE_SENTRY_ENVIRONMENT=production
```

#### Setting Environment Variables
1. Go to Project Settings → Environment Variables
2. Add each variable for **Production** environment
3. Optionally set different values for **Preview** branches

### 3. Build Configuration

#### Vercel Configuration File
Create `vercel.json` in project root:
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "functions": {
    "client/dist/index.html": {
      "maxDuration": 30
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.fbpro.ai/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Package.json Scripts
Ensure these scripts exist in `package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "build:analyze": "vite build --mode analyze"
  }
}
```

### 4. Domain Configuration

#### Custom Domain Setup
1. **Add Domain** in Vercel Project Settings
2. **Configure DNS** with your domain provider:
   ```
   Type: CNAME
   Name: app (or @)
   Value: cname.vercel-dns.com
   ```
3. **Verify Domain** in Vercel dashboard
4. **SSL Certificate** automatically provisioned

#### Domain Examples
- Production: `app.fbpro.ai`
- Staging: `staging.fbpro.ai`
- Development: `dev.fbpro.ai`

### 5. Deployment Pipeline

#### Automatic Deployments
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from any branch/PR
- **Development**: Manual deployments

#### Branch Configuration
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": false
    }
  }
}
```

### 6. Performance Optimization

#### Build Optimizations
1. **Bundle Analysis**:
   ```bash
   npm run build:analyze
   ```

2. **Asset Optimization**:
   - Automatic image optimization with Vercel
   - Gzip compression enabled by default
   - Brotli compression for modern browsers

3. **Edge Caching**:
   ```json
   {
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

#### Performance Monitoring
- Lighthouse CI integration
- Web Vitals tracking
- Real User Monitoring (RUM)

### 7. Security Configuration

#### Content Security Policy
Configure CSP headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://js.stripe.com; connect-src 'self' https://api.fbpro.ai https://api.stripe.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

#### Environment Secrets
- Never commit environment variables to git
- Use Vercel's environment variable management
- Rotate keys regularly in production

### 8. Monitoring & Analytics

#### Error Tracking
```typescript
// Configure Sentry for frontend error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

#### Analytics Integration
```typescript
// Google Analytics 4
import { gtag } from 'ga-gtag';

gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
  page_title: document.title,
  page_location: window.location.href,
});
```

### 9. CI/CD Integration

#### GitHub Actions
Create `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths: ['client/**', 'shared/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 10. Testing & Quality

#### Preview Deployments
- Every PR gets automatic preview deployment
- Test changes before merging to main
- Share preview URLs with stakeholders

#### Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  pull_request:
    paths: ['client/**']

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouserc.js'
```

#### Lighthouse Configuration
Create `lighthouserc.js`:
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}],
      },
    },
  },
};
```

### 11. Rollback Procedures

#### Manual Rollback
1. Go to Vercel dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

#### Automated Rollback
```bash
# Using Vercel CLI
vercel rollback [DEPLOYMENT_URL] --token=$VERCEL_TOKEN
```

#### Rollback Criteria
- 5xx error rate > 1%
- Performance regression > 50%
- Critical functionality broken
- User-reported issues affecting > 10% users

### 12. Cost Optimization

#### Vercel Pricing Tiers
- **Hobby**: Free (good for development)
- **Pro**: $20/month (production-ready)
- **Team**: $99/month (collaboration features)

#### Cost Monitoring
- Monitor bandwidth usage
- Optimize build times
- Use edge caching effectively
- Consider image optimization

### 13. Troubleshooting

#### Common Issues

##### Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm install  # Update dependencies
npm run build  # Test locally first
```

##### Environment Variable Issues
- Verify all VITE_ prefixed variables are set
- Check spelling and values
- Test in preview environment first

##### Domain Issues
- DNS propagation can take 24-48 hours
- Verify CNAME record configuration
- Check SSL certificate status

##### Performance Issues
- Analyze bundle size
- Check for unnecessary dependencies
- Optimize images and assets
- Use lazy loading for components

### 14. Best Practices

#### Development Workflow
1. Develop on feature branches
2. Test with preview deployments
3. Merge to main for production deploy
4. Monitor deployment success

#### Security
- Regularly update dependencies
- Use security headers
- Implement CSP policies
- Monitor for vulnerabilities

#### Performance
- Use code splitting
- Implement lazy loading
- Optimize images
- Monitor Core Web Vitals

## Support Resources

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [React Deployment Guide](https://vercel.com/guides/deploying-react-with-vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Community Support
- [Vercel Discord](https://discord.gg/vercel)
- [GitHub Discussions](https://github.com/vercel/vercel/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vercel)

### FBPro.MCP Support
- Email: devops@fbpro.ai
- Slack: #deployment-support
- Documentation: [Internal Deployment Docs]

---

**Note**: This deployment guide assumes the API is deployed separately to Koyeb or another service. Ensure API endpoints are accessible and CORS is configured properly for the Vercel-hosted frontend.