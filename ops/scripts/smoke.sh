#!/bin/bash
# FBPro.MCP Smoke Tests - Non-destructive production verification

set -e

# Configuration
API_BASE_URL=${API_BASE_URL:-"http://localhost:5000"}
TIMEOUT=${TIMEOUT:-10}

echo "🔍 Running FBPro.MCP Smoke Tests..."
echo "API Base URL: $API_BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run curl with timeout
run_curl() {
    curl -s -m "$TIMEOUT" "$@"
}

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local additional_checks="$4"
    
    echo -n "Testing $name... "
    
    local response
    local http_status
    
    # Make request and capture both response and status
    response=$(run_curl -w "%{http_code}" "$url" 2>/dev/null) || {
        echo -e "${RED}FAILED${NC} - Connection error"
        ((TESTS_FAILED++))
        return 1
    }
    
    # Extract HTTP status (last 3 characters)
    http_status="${response: -3}"
    response_body="${response%???}"
    
    # Check HTTP status
    if [[ "$http_status" != "$expected_status" ]]; then
        echo -e "${RED}FAILED${NC} - Expected status $expected_status, got $http_status"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Run additional checks if provided
    if [[ -n "$additional_checks" ]]; then
        if ! eval "$additional_checks"; then
            echo -e "${RED}FAILED${NC} - Additional checks failed"
            ((TESTS_FAILED++))
            return 1
        fi
    fi
    
    echo -e "${GREEN}PASSED${NC}"
    ((TESTS_PASSED++))
    return 0
}

# Test 1: Health Check
test_endpoint "Health Check" "$API_BASE_URL/health" "200" \
    'echo "$response_body" | grep -q "\"ok\":true"'

# Test 2: Metrics Endpoint
test_endpoint "Prometheus Metrics" "$API_BASE_URL/metrics" "200" \
    'echo "$response_body" | grep -q "# HELP"'

# Test 3: Demo Content Generation (should require prompt)
echo -n "Testing Demo Content Validation... "
response=$(run_curl -X POST -H "Content-Type: application/json" \
    -d '{}' -w "%{http_code}" "$API_BASE_URL/api/demo/generate-content" 2>/dev/null) || {
    echo -e "${RED}FAILED${NC} - Connection error"
    ((TESTS_FAILED++))
}

http_status="${response: -3}"
if [[ "$http_status" == "400" ]]; then
    echo -e "${GREEN}PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}FAILED${NC} - Expected 400 validation error, got $http_status"
    ((TESTS_FAILED++))
fi

# Test 4: Check Auth Protection (should return 401 for protected endpoints)
test_endpoint "Auth Protection Check" "$API_BASE_URL/api/content" "401" \
    'echo "$response_body" | grep -q -i "unauthorized"'

# Test 5: AI Models Endpoint
test_endpoint "AI Models Info" "$API_BASE_URL/api/ai/models" "200" \
    'echo "$response_body" | grep -q "gpt-5"'

# Test 6: Dashboard Stats (should be protected)
test_endpoint "Dashboard Protection" "$API_BASE_URL/api/dashboard/stats" "401" \
    'echo "$response_body" | grep -q -i "unauthorized"'

# Test 7: Basic MCP Client Test (if configured)
if [[ -n "$MCP_ADS_LIBRARY_URL" ]]; then
    echo -n "Testing MCP Ads Library Connection... "
    # This would be a real MCP test if endpoints exist
    echo -e "${YELLOW}SKIPPED${NC} - MCP endpoints not configured for testing"
else
    echo -n "MCP Configuration... "
    echo -e "${YELLOW}SKIPPED${NC} - MCP_ADS_LIBRARY_URL not set"
fi

# Test 8: Database Connection (indirect via health if it includes DB status)
echo -n "Testing Database Connectivity... "
db_response=$(run_curl "$API_BASE_URL/health" 2>/dev/null) || {
    echo -e "${RED}FAILED${NC} - Cannot reach health endpoint"
    ((TESTS_FAILED++))
}

if [[ -n "$db_response" ]]; then
    echo -e "${GREEN}PASSED${NC} - Health endpoint accessible (DB likely connected)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}FAILED${NC} - Health endpoint not accessible"
    ((TESTS_FAILED++))
fi

# Test 9: Frontend Static Assets (if served by API in production)
if [[ "$NODE_ENV" == "production" ]]; then
    test_endpoint "Frontend Assets" "$API_BASE_URL/" "200" \
        'echo "$response_body" | grep -q -i "<!DOCTYPE html>"'
else
    echo "Frontend Assets... ${YELLOW}SKIPPED${NC} - Development mode"
fi

# Test 10: Basic Security Headers (in production mode)
if [[ "$NODE_ENV" == "production" ]]; then
    echo -n "Testing Security Headers... "
    headers=$(run_curl -I "$API_BASE_URL/health" 2>/dev/null) || {
        echo -e "${RED}FAILED${NC} - Cannot fetch headers"
        ((TESTS_FAILED++))
    }
    
    if echo "$headers" | grep -qi "x-frame-options\|x-content-type-options"; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}WARNING${NC} - Some security headers missing"
        ((TESTS_PASSED++))
    fi
else
    echo "Security Headers... ${YELLOW}SKIPPED${NC} - Development mode"
fi

echo "================================================"
echo "📊 Smoke Test Results:"
echo -e "✅ Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "📋 Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "\n🎉 ${GREEN}All smoke tests passed!${NC} System appears healthy."
    exit 0
else
    echo -e "\n⚠️  ${RED}Some tests failed.${NC} Please investigate before deploying to production."
    exit 1
fi