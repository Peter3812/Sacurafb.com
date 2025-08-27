# Content Security Policy (CSP) Configuration for FBPro.MCP

## Overview

This document defines the Content Security Policy (CSP) headers for FBPro.MCP to prevent XSS attacks and other code injection vulnerabilities while maintaining full functionality.

## Production CSP Header

### Complete CSP Header
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://js.stripe.com https://*.vercel.app https://challenges.cloudflare.com 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob: https://*.cloudinary.com https://res.cloudinary.com https://*.facebook.com https://*.fbcdn.net;
  connect-src 'self' https://api.fbpro.ai https://api.stripe.com https://graph.facebook.com https://api.openai.com;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://api.fbpro.ai;
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

## Directive Breakdown

### `default-src 'self'`
- **Purpose**: Sets the default policy for all resource types
- **Value**: Only allow resources from the same origin
- **Fallback**: Used when specific directives are not defined

### `script-src`
```http
script-src 'self' https://js.stripe.com https://*.vercel.app https://challenges.cloudflare.com 'unsafe-inline';
```
- **'self'**: App's own JavaScript files
- **https://js.stripe.com**: Stripe payment processing scripts
- **https://*.vercel.app**: Vercel deployment scripts (dev/preview)
- **https://challenges.cloudflare.com**: Cloudflare bot challenge scripts
- **'unsafe-inline'**: ⚠️ Required for React inline scripts (minimize usage)

### `style-src`
```http
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
```
- **'self'**: App's own CSS files
- **'unsafe-inline'**: Required for Tailwind CSS and dynamic styles
- **https://fonts.googleapis.com**: Google Fonts CSS
- **https://cdnjs.cloudflare.com**: CDN stylesheets (Font Awesome, etc.)

### `font-src`
```http
font-src 'self' https://fonts.gstatic.com data:;
```
- **'self'**: Locally hosted fonts
- **https://fonts.gstatic.com**: Google Fonts files
- **data:**: Data URLs for embedded fonts

### `img-src`
```http
img-src 'self' data: https: blob: https://*.cloudinary.com https://res.cloudinary.com https://*.facebook.com https://*.fbcdn.net;
```
- **'self'**: App's own images
- **data:**: Data URLs for inline images/icons
- **https:**: Allow all HTTPS images (broad for flexibility)
- **blob:**: Blob URLs for dynamic image generation
- **https://*.cloudinary.com**: Cloudinary image CDN
- **https://*.facebook.com**: Facebook profile images/assets
- **https://*.fbcdn.net**: Facebook CDN images

### `connect-src`
```http
connect-src 'self' https://api.fbpro.ai https://api.stripe.com https://graph.facebook.com https://api.openai.com;
```
- **'self'**: API calls to same origin
- **https://api.fbpro.ai**: Production API endpoint
- **https://api.stripe.com**: Stripe API calls
- **https://graph.facebook.com**: Facebook Graph API
- **https://api.openai.com**: OpenAI API calls (if client-side)

### `frame-src`
```http
frame-src 'self' https://js.stripe.com;
```
- **'self'**: Allow embedding own content
- **https://js.stripe.com**: Stripe payment iframes

### `object-src 'none'`
- **Purpose**: Prevent embedding of plugins (Flash, Java, etc.)
- **Security**: Eliminates entire class of vulnerabilities

### `base-uri 'self'`
- **Purpose**: Restrict the base URL for relative URLs
- **Security**: Prevents base tag injection attacks

### `form-action`
```http
form-action 'self' https://api.fbpro.ai;
```
- **'self'**: Forms can submit to same origin
- **https://api.fbpro.ai**: Forms can submit to API

### `frame-ancestors 'none'`
- **Purpose**: Prevent the page from being embedded in iframes
- **Security**: Clickjacking protection (similar to X-Frame-Options: DENY)

### `upgrade-insecure-requests`
- **Purpose**: Automatically upgrade HTTP requests to HTTPS
- **Security**: Ensures all requests use encrypted transport

## Environment-Specific CSP

### Development CSP
For local development, use a more relaxed policy:
```http
Content-Security-Policy: 
  default-src 'self' 'unsafe-inline' 'unsafe-eval';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https: ws: wss:;
  frame-src 'self' https://js.stripe.com;
```

### Staging CSP
For staging, use production CSP but add staging domains:
```http
connect-src 'self' https://api-staging.fbpro.ai https://api.stripe.com https://graph.facebook.com;
```

## CSP Reporting

### Report-Only Mode (Testing)
```http
Content-Security-Policy-Report-Only: 
  default-src 'self';
  script-src 'self' https://js.stripe.com;
  report-uri https://api.fbpro.ai/csp-report;
```

### Report Endpoint Implementation
```typescript
// Add to server/routes.ts
app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.warn('CSP Violation:', JSON.stringify(req.body, null, 2));
  // Log to monitoring system (Sentry, etc.)
  res.status(204).end();
});
```

## CSP Violation Handling

### Common Violations and Fixes

#### Inline Script Violations
```javascript
// ❌ Inline script (violates CSP)
<script>window.config = {...}</script>

// ✅ Move to external file or use nonce
<script nonce="random-nonce">window.config = {...}</script>
```

#### Inline Style Violations
```html
<!-- ❌ Inline styles (violates CSP if 'unsafe-inline' not allowed) -->
<div style="color: red;">Text</div>

<!-- ✅ Use CSS classes -->
<div class="text-red-500">Text</div>
```

#### Dynamic Script Loading
```javascript
// ❌ Dynamic script creation
const script = document.createElement('script');
script.src = 'untrusted-source.js';

// ✅ Only load from trusted sources in CSP
script.src = 'https://js.stripe.com/v3/';
```

## CSP Implementation Steps

### 1. Start with Report-Only Mode
Deploy CSP in report-only mode to identify violations without breaking functionality.

### 2. Monitor and Adjust
- Monitor CSP violation reports
- Identify legitimate violations
- Adjust policy to allow necessary resources

### 3. Gradually Tighten Policy
```javascript
// Phase 1: Allow broader sources
script-src 'self' 'unsafe-inline' https:;

// Phase 2: Restrict to specific domains
script-src 'self' 'unsafe-inline' https://js.stripe.com;

// Phase 3: Remove unsafe directives (ideal)
script-src 'self' https://js.stripe.com;
```

### 4. Enable Enforcement Mode
Once violations are resolved, switch from report-only to enforcement mode.

## CSP Testing Tools

### Browser DevTools
Check Console tab for CSP violations:
```
Refused to load the script 'https://evil.com/script.js' because it violates the following Content Security Policy directive: "script-src 'self'"
```

### CSP Evaluator
Use Google's CSP Evaluator: https://csp-evaluator.withgoogle.com/

### Automated Testing
```javascript
// Add to test suite
describe('CSP Compliance', () => {
  it('should not have CSP violations on homepage', async () => {
    const violations = await page.evaluateOnNewDocument(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.cspViolations.push(e);
      });
    });
    
    await page.goto('https://app.fbpro.ai');
    const cspViolations = await page.evaluate(() => window.cspViolations);
    expect(cspViolations).toHaveLength(0);
  });
});
```

## Maintenance

### Regular CSP Review
- **Monthly**: Review CSP violation reports
- **Quarterly**: Audit CSP policy for unnecessary permissions
- **On Changes**: Update CSP when adding new third-party services

### CSP Version Control
Track CSP changes in version control:
```javascript
// config/csp.js
export const cspPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://js.stripe.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    // ... other directives
  }
};
```

This allows for proper code review and rollback capabilities.