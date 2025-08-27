# Cloudflare WAF & CDN Configuration for FBPro.MCP

## Overview

This document provides the complete Cloudflare setup for securing and accelerating FBPro.MCP in production.

## Domain Setup

### Primary Domains
- **Frontend**: `app.fbpro.ai` → Vercel deployment
- **API**: `api.fbpro.ai` → Koyeb deployment
- **Marketing**: `fbpro.ai` → Marketing site (optional)

### DNS Configuration
```
Type    Name    Content                 Proxy   TTL
A       @       YOUR_MARKETING_IP       Yes     Auto
CNAME   app     app-fbpro-ai.vercel.app Yes     Auto  
CNAME   api     fbpro-api.koyeb.app     Yes     Auto
```

## Security Settings

### SSL/TLS Configuration
- **SSL Mode**: Full (strict)
- **Min TLS Version**: 1.2
- **TLS 1.3**: Enabled
- **Always Use HTTPS**: Yes
- **HSTS**: Enabled (max-age: 31536000, includeSubdomains: true)

### WAF Rules

#### Rate Limiting Rules
```yaml
# API Rate Limiting
Rule Name: "API Rate Limit"
Expression: (http.request.uri.path contains "/api/")
Action: Block
Rate: 60 requests per 1 minute
Characteristics: IP address

# Auth Rate Limiting  
Rule Name: "Auth Rate Limit"
Expression: (http.request.uri.path contains "/auth/")
Action: Block  
Rate: 30 requests per 1 minute
Characteristics: IP address

# Content Generation Rate Limiting
Rule Name: "AI Content Rate Limit"
Expression: (http.request.uri.path contains "/api/demo/generate-content")
Action: Block
Rate: 10 requests per 1 minute  
Characteristics: IP address
```

#### Firewall Rules
```yaml
# Block Known Bad IPs
Rule Name: "Block Malicious IPs"
Expression: (ip.src in $malicious_ips)
Action: Block

# Allow Only HTTPS
Rule Name: "Force HTTPS"
Expression: (ssl ne true)
Action: Redirect
URL: https://$host$path$query

# Block SQL Injection Attempts
Rule Name: "SQL Injection Protection"
Expression: (http.request.uri.query contains "union select" or 
           http.request.uri.query contains "drop table" or
           http.request.body contains "' or 1=1")
Action: Block

# Geographic Restrictions (optional)
Rule Name: "Geo Block High Risk Countries"
Expression: (ip.geoip.country in {"CN" "RU" "KP"})
Action: Challenge
```

#### Bot Management
```yaml
# Bot Fight Mode: Enabled
# Challenge Page: Enabled for suspicious requests
# Browser Integrity Check: Enabled

# Custom Bot Rules:
Rule Name: "Allow Search Engines"
Expression: (cf.bot_management.verified_bot and 
           cf.bot_management.static_resource)
Action: Allow

Rule Name: "Challenge Unverified Bots"  
Expression: (cf.bot_management.score lt 30)
Action: Managed Challenge
```

### Security Headers

#### Content Security Policy (CSP)
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://js.stripe.com https://*.vercel.app 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob: https://*.cloudinary.com;
  connect-src 'self' https://api.fbpro.ai https://api.stripe.com;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://api.fbpro.ai;
```

#### Additional Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY  
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Performance Optimization

### Caching Rules
```yaml
# Static Assets Caching
Rule: "Static Assets"
Expression: (http.request.uri.path matches "^.*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$")
Cache Level: Cache Everything
Edge TTL: 1 month
Browser TTL: 1 week

# API Caching (selective)
Rule: "API Models Cache"
Expression: (http.request.uri.path eq "/api/ai/models")
Cache Level: Cache Everything  
Edge TTL: 1 hour
Browser TTL: 10 minutes

# HTML Caching
Rule: "HTML Pages"
Expression: (http.request.uri.path matches "^/$" or http.request.uri.path matches ".*\\.html$")
Cache Level: Cache Everything
Edge TTL: 1 hour
Browser TTL: 5 minutes
```

### Page Rules
```yaml
# Frontend App
URL: app.fbpro.ai/*
Settings:
  - SSL: Full (strict)
  - Always Use HTTPS: On
  - Browser Cache TTL: 4 hours
  
# API
URL: api.fbpro.ai/*  
Settings:
  - SSL: Full (strict)
  - Always Use HTTPS: On
  - Security Level: High
  - Cache Level: Bypass (for dynamic content)
```

## Monitoring & Alerts

### Analytics Dashboard
Enable Cloudflare Analytics for:
- Request volume and patterns
- Threat detection and blocking
- Performance metrics (origin response time)
- Cache hit ratios

### Alert Configuration
```yaml
# High Error Rate Alert
Metric: HTTP 5xx errors
Threshold: > 5% for 5 minutes
Notification: Email + Slack

# DDoS Attack Alert  
Metric: Requests per minute
Threshold: > 10,000 requests/min
Notification: Email + SMS

# Origin Down Alert
Metric: Origin response
Threshold: Connection timeout > 30s
Notification: Email + PagerDuty
```

## Access Control

### IP Access Rules
```yaml
# Allow Office IPs (if applicable)
Type: Allow
Value: YOUR_OFFICE_IP/32
Zone: All zones

# Block Known VPN Providers (optional)
Type: Block  
Value: VPN_IP_RANGES
Zone: api.fbpro.ai
```

### User Agent Blocking
```yaml
# Block Scrapers
Rule: "Block Scrapers"
Expression: (http.user_agent contains "scrapy" or 
           http.user_agent contains "crawler" or
           lower(http.user_agent) contains "bot")
Action: Block
```

## Deployment Checklist

### Pre-Production
- [ ] DNS records configured and propagated
- [ ] SSL certificates validated
- [ ] WAF rules tested in simulation mode
- [ ] Rate limits configured for expected traffic
- [ ] Bot management settings optimized

### Production Deploy
- [ ] Enable WAF rules in blocking mode
- [ ] Configure security headers
- [ ] Set up monitoring and alerts
- [ ] Test all endpoints through CDN
- [ ] Verify cache behavior for static assets

### Post-Deploy Monitoring
- [ ] Monitor false positives in WAF logs
- [ ] Check cache hit ratios
- [ ] Verify origin response times
- [ ] Review threat analytics weekly

## Troubleshooting

### Common Issues
1. **High False Positive Rate**: Adjust bot score thresholds
2. **Cache Misses**: Review cache rules and TTL settings  
3. **Origin Overload**: Increase cache TTL for static content
4. **Blocked Legitimate Users**: Whitelist known good IPs

### Debug Mode
To troubleshoot issues:
1. Enable Development Mode temporarily
2. Check Real-time Logs in Cloudflare dashboard
3. Use curl with CF-Ray header to trace requests
4. Monitor origin server logs for blocked requests

### Emergency Procedures
```bash
# Disable WAF (emergency only)
# Via API: Set security_level to "essentially_off"
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"essentially_off"}'

# Re-enable after issue resolution
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"medium"}'
```

## Security Best Practices

1. **Regular Rule Review**: Monthly review of WAF logs and rule effectiveness
2. **IP Reputation**: Keep malicious IP lists updated  
3. **Rate Limit Tuning**: Adjust based on legitimate usage patterns
4. **Certificate Monitoring**: Set up alerts for SSL cert expiration
5. **Access Audit**: Regular review of access rules and permissions

## Performance Optimization Tips

1. **Cache Strategy**: Cache static assets aggressively, API responses selectively
2. **Compression**: Enable Brotli compression for text assets
3. **HTTP/2**: Ensure HTTP/2 is enabled for all domains
4. **Image Optimization**: Use Cloudflare Image Resizing for dynamic images
5. **Workers**: Consider Cloudflare Workers for edge computing needs