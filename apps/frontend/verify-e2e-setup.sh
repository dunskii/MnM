#!/bin/bash

# =========================================
# Playwright E2E Setup Verification Script
# =========================================

echo "==========================================="
echo "Playwright E2E Setup Verification"
echo "==========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        return 1
    fi
}

# Counter
PASSED=0
FAILED=0

echo "Checking Configuration Files..."
echo "-------------------------------"
check_file "playwright.config.ts" && ((PASSED++)) || ((FAILED++))
check_file "package.json" && ((PASSED++)) || ((FAILED++))
echo ""

echo "Checking E2E Directory Structure..."
echo "-----------------------------------"
check_dir "e2e" && ((PASSED++)) || ((FAILED++))
check_dir "e2e/setup" && ((PASSED++)) || ((FAILED++))
check_dir "e2e/helpers" && ((PASSED++)) || ((FAILED++))
check_dir "e2e/fixtures" && ((PASSED++)) || ((FAILED++))
check_dir "e2e/flows" && ((PASSED++)) || ((FAILED++))
echo ""

echo "Checking Helper Files..."
echo "-----------------------"
check_file "e2e/setup/global-setup.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/helpers/auth.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/helpers/test-data.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/helpers/api-mocks.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/fixtures/test-fixtures.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/global.d.ts" && ((PASSED++)) || ((FAILED++))
echo ""

echo "Checking Test Files..."
echo "---------------------"
check_file "e2e/flows/smoke.spec.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/flows/authentication.spec.ts" && ((PASSED++)) || ((FAILED++))
check_file "e2e/flows/hybrid-booking.spec.ts" && ((PASSED++)) || ((FAILED++))
echo ""

echo "Checking Documentation..."
echo "------------------------"
check_file "e2e/README.md" && ((PASSED++)) || ((FAILED++))
check_file "E2E_QUICKSTART.md" && ((PASSED++)) || ((FAILED++))
check_file "E2E_SETUP_SUMMARY.md" && ((PASSED++)) || ((FAILED++))
echo ""

echo "Checking NPM Dependencies..."
echo "---------------------------"
if grep -q "@playwright/test" package.json; then
    echo -e "${GREEN}✓${NC} @playwright/test installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} @playwright/test not found in package.json"
    ((FAILED++))
fi
echo ""

echo "Checking NPM Scripts..."
echo "----------------------"
if grep -q '"e2e":' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} npm run e2e script missing"
    ((FAILED++))
fi

if grep -q '"e2e:ui":' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e:ui script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} npm run e2e:ui script missing"
    ((FAILED++))
fi

if grep -q '"e2e:debug":' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e:debug script"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} npm run e2e:debug script missing"
    ((FAILED++))
fi
echo ""

echo "Checking Playwright Installation..."
echo "----------------------------------"
if [ -d "node_modules/@playwright" ]; then
    echo -e "${GREEN}✓${NC} Playwright installed in node_modules"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Playwright not found in node_modules"
    echo -e "${YELLOW}  Run: npm install${NC}"
    ((FAILED++))
fi
echo ""

echo "Counting Tests..."
echo "----------------"
TEST_COUNT=$(npx playwright test --list --project=chromium 2>/dev/null | grep -c "›" || echo "0")
if [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $TEST_COUNT tests"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} No tests found or Playwright not installed"
    echo -e "${YELLOW}  Run: npm install${NC}"
    ((FAILED++))
fi
echo ""

echo "==========================================="
echo "Verification Summary"
echo "==========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! E2E setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Ensure backend is running on http://localhost:5000"
    echo "2. Seed test database with test users"
    echo "3. Run tests: npm run e2e:ui"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    exit 1
fi
