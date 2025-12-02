#!/bin/bash
# Check if bot is extracting referral codes and hyperlinks

echo "=== Checking Bot's Code Extraction ==="
echo ""

echo "1. Hyperlink resolution attempts:"
pm2 logs eliza --lines 1000 --nostream | grep -i "hyperlink" | tail -10
echo ""

echo "2. Referral code detection:"
pm2 logs eliza --lines 1000 --nostream | grep -i "referral" | tail -10
echo ""

echo "3. Wallet resolution successes (non-null):"
pm2 logs eliza --lines 1000 --nostream | grep '"wallet"' | grep -v '"wallet":null' | tail -10
echo ""

echo "4. Check for HYPERLINK_API_KEY errors:"
pm2 logs eliza --lines 1000 --nostream | grep -i "hyperlink_api_key\|not configured" | tail -5
echo ""

echo "5. Check for Hyperlink API 401 errors:"
pm2 logs eliza --lines 1000 --nostream | grep -i "hyperlink api error: 401" | tail -5
echo ""

echo "=== Analysis ==="
echo ""
echo "If #1 is empty: Bot never tries hyperlink resolution"
echo "If #2 is empty: Bot never finds referral codes"  
echo "If #3 is empty: Wallet resolution ALWAYS fails (all null)"
echo "If #4 shows errors: HYPERLINK_API_KEY missing/wrong"
echo "If #5 shows errors: Hyperlink API rejecting requests"

