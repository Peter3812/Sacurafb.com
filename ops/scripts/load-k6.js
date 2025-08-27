// FBPro.MCP Load Testing Script with K6
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
let errorRate = new Rate('errors');
let responseTrend = new Trend('response_time');

// Test configuration
export let options = {
  scenarios: {
    // Smoke test scenario
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test scenario
    load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 20 },  // Ramp up
        { duration: '5m', target: 50 },  // Stay at load
        { duration: '2m', target: 100 }, // Peak load  
        { duration: '1m', target: 100 }, // Peak sustain
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'load' },
    },
  },
  
  // Performance thresholds
  thresholds: {
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    http_req_duration: ['p(95)<800'], // 95th percentile under 800ms
    http_req_duration: ['p(99)<1000'], // 99th percentile under 1s
  },
};

// Test configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000';
const TIMEOUT = '10s';

// Helper function to make authenticated request (if needed)
function makeRequest(url, options = {}) {
  const defaultOptions = {
    timeout: TIMEOUT,
    ...options,
  };
  
  return http.get(url, defaultOptions);
}

// Test scenarios
export default function() {
  // Test 1: Health Check (always should be fast)
  let healthResponse = makeRequest(`${BASE_URL}/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
    'health contains ok:true': (r) => r.json('ok') === true,
  });
  
  errorRate.add(healthResponse.status !== 200);
  responseTrend.add(healthResponse.timings.duration);
  
  // Test 2: Metrics endpoint (should handle concurrent load)  
  let metricsResponse = makeRequest(`${BASE_URL}/metrics`);
  check(metricsResponse, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 500ms': (r) => r.timings.duration < 500,
    'metrics contains prometheus data': (r) => r.body.includes('# HELP'),
  });
  
  errorRate.add(metricsResponse.status !== 200);
  responseTrend.add(metricsResponse.timings.duration);
  
  // Test 3: AI Models Info (cached endpoint)
  let modelsResponse = makeRequest(`${BASE_URL}/api/ai/models`);
  check(modelsResponse, {
    'models status is 200': (r) => r.status === 200,
    'models response time < 300ms': (r) => r.timings.duration < 300,
    'models contains gpt-5': (r) => r.body.includes('gpt-5'),
  });
  
  errorRate.add(modelsResponse.status !== 200);
  responseTrend.add(modelsResponse.timings.duration);
  
  // Test 4: Protected endpoint (should handle auth correctly)
  let protectedResponse = makeRequest(`${BASE_URL}/api/content`);
  check(protectedResponse, {
    'protected returns 401': (r) => r.status === 401,
    'protected response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Test 5: Demo content validation (should handle POST requests)
  let validationResponse = http.post(`${BASE_URL}/api/demo/generate-content`, 
    JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT,
    });
  
  check(validationResponse, {
    'validation returns 400': (r) => r.status === 400,
    'validation response time < 100ms': (r) => r.timings.duration < 100,
    'validation contains error message': (r) => r.body.includes('required'),
  });
  
  errorRate.add(validationResponse.status !== 400);
  responseTrend.add(validationResponse.timings.duration);
  
  // Test 6: Static assets (if in production mode)
  if (__ENV.NODE_ENV === 'production') {
    let staticResponse = makeRequest(`${BASE_URL}/`);
    check(staticResponse, {
      'static assets load': (r) => r.status === 200,
      'static response time < 1s': (r) => r.timings.duration < 1000,
      'static contains HTML': (r) => r.body.includes('<!DOCTYPE html>'),
    });
    
    errorRate.add(staticResponse.status !== 200);
    responseTrend.add(staticResponse.timings.duration);
  }
  
  // Random delay to simulate realistic user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log(`🚀 Starting load test against: ${BASE_URL}`);
  
  // Verify system is accessible before starting load test
  let healthCheck = http.get(`${BASE_URL}/health`, { timeout: '5s' });
  if (healthCheck.status !== 200) {
    throw new Error(`System not ready: ${healthCheck.status}`);
  }
  
  console.log('✅ System health check passed, proceeding with load test');
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('🏁 Load test completed');
  
  // Could add cleanup logic here if needed
  // e.g., clearing test data, sending notifications, etc.
}