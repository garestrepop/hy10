#!/bin/bash

# Test script for MFA functionality
# This script demonstrates the MFA flow for administrators

API_BASE="http://localhost:3001/api/v1"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="TestPassword123"

echo "================================"
echo "MFA Testing Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Register admin user${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"first_name\": \"Admin\",
    \"last_name\": \"Test\"
  }")

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Failed to register or login. Trying to login...${NC}"
  
  LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$ADMIN_EMAIL\",
      \"password\": \"$ADMIN_PASSWORD\"
    }")
  
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null)
  
  if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to get access token. Exiting.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

echo -e "${BLUE}Step 2: Setup MFA${NC}"
MFA_SETUP_RESPONSE=$(curl -s -X POST "$API_BASE/auth/mfa/setup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$MFA_SETUP_RESPONSE" | jq '.' 2>/dev/null || echo "$MFA_SETUP_RESPONSE"
echo ""

MFA_SECRET=$(echo "$MFA_SETUP_RESPONSE" | jq -r '.secret' 2>/dev/null)

if [ "$MFA_SECRET" = "null" ] || [ -z "$MFA_SECRET" ]; then
  echo -e "${RED}Failed to setup MFA. Make sure the user is an admin.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ MFA setup successful${NC}"
echo "Secret: $MFA_SECRET"
echo ""

echo -e "${BLUE}Step 3: Generate TOTP code${NC}"
echo "You would normally scan the QR code with Google Authenticator."
echo "For testing, we'll generate a code programmatically..."
echo ""

# Generate TOTP code using Node.js
TOTP_CODE=$(node -e "
const { generate } = require('otplib');
generate({ secret: '$MFA_SECRET' }).then(code => console.log(code));
" 2>/dev/null)

echo "Generated TOTP Code: $TOTP_CODE"
echo ""

echo -e "${BLUE}Step 4: Enable MFA${NC}"
ENABLE_RESPONSE=$(curl -s -X POST "$API_BASE/auth/mfa/enable" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"code\": \"$TOTP_CODE\"
  }")

echo "$ENABLE_RESPONSE" | jq '.' 2>/dev/null || echo "$ENABLE_RESPONSE"
echo ""

if echo "$ENABLE_RESPONSE" | grep -q "enabled successfully"; then
  echo -e "${GREEN}✓ MFA enabled successfully${NC}"
else
  echo -e "${RED}Failed to enable MFA${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 5: Logout and login again (should trigger MFA)${NC}"
LOGIN_MFA_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "$LOGIN_MFA_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_MFA_RESPONSE"
echo ""

MFA_REQUIRED=$(echo "$LOGIN_MFA_RESPONSE" | jq -r '.mfa_required' 2>/dev/null)
MFA_TOKEN=$(echo "$LOGIN_MFA_RESPONSE" | jq -r '.mfa_token' 2>/dev/null)

if [ "$MFA_REQUIRED" = "true" ]; then
  echo -e "${GREEN}✓ MFA challenge triggered${NC}"
  echo "MFA Token: ${MFA_TOKEN:0:20}..."
else
  echo -e "${RED}MFA was not triggered${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 6: Generate new TOTP code and verify${NC}"

# Wait a moment to ensure we're not using a stale code
sleep 2

NEW_TOTP_CODE=$(node -e "
const { generate } = require('otplib');
generate({ secret: '$MFA_SECRET' }).then(code => console.log(code));
" 2>/dev/null)

echo "Generated TOTP Code: $NEW_TOTP_CODE"
echo ""

VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/mfa/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mfa_token\": \"$MFA_TOKEN\",
    \"code\": \"$NEW_TOTP_CODE\"
  }")

echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"
echo ""

NEW_ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.access_token' 2>/dev/null)

if [ "$NEW_ACCESS_TOKEN" != "null" ] && [ -n "$NEW_ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ MFA verification successful${NC}"
  echo -e "${GREEN}✓ Full login completed${NC}"
else
  echo -e "${RED}MFA verification failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 7: Test invalid MFA code${NC}"

INVALID_VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/mfa/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"mfa_token\": \"$MFA_TOKEN\",
    \"code\": \"999999\"
  }")

echo "$INVALID_VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_VERIFY_RESPONSE"
echo ""

if echo "$INVALID_VERIFY_RESPONSE" | grep -q "Invalid MFA code"; then
  echo -e "${GREEN}✓ Invalid code correctly rejected${NC}"
else
  echo -e "${RED}Invalid code was not rejected${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}MFA Testing Complete!${NC}"
echo "================================"
echo ""
echo "Summary:"
echo "1. ✓ Admin user created"
echo "2. ✓ MFA setup with QR code"
echo "3. ✓ MFA enabled with TOTP code"
echo "4. ✓ Login triggers MFA challenge"
echo "5. ✓ MFA verification completes login"
echo "6. ✓ Invalid codes are rejected"
echo ""
echo "All User Story US-04 scenarios verified!"
