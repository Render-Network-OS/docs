# Bot Referral Code & Paylink Detection

## What the Bot Checks For

### 1. Hyperlink/Paylink Codes

**Pattern:** `555.rendernet.work/p/{CODE}` or `rendernet.work/p/{CODE}`

**Code location:** `555-bot/packages/client-twitter/src/integrations/hyperlink.ts`

```typescript
const pattern = /(?:https?:\/\/)?(?:555\.)?rendernet\.work\/p\/([a-zA-Z0-9_-]+)/gi;
```

**Examples that match:**
- `https://555.rendernet.work/p/abc123` ✅
- `555.rendernet.work/p/xyz789` ✅
- `rendernet.work/p/test456` ✅
- `http://555.rendernet.work/p/demo` ✅

**Examples that DON'T match:**
- `555hyper.link/p/abc123` ❌ (different domain!)
- `555.rendernet.work/@username` ❌ (no /p/)
- Just `abc123` without URL ❌

---

### 2. Referral Codes

**Pattern:** URL params with `?ref={CODE}` or standalone alphanumeric codes

**Code location:** `555-bot/packages/client-twitter/src/integrations/webhook.ts`

```typescript
function extractReferralCode(text?: string): string | undefined {
  // Matches:
  // - 555.rendernet.work/?ref={CODE}
  // - rendernet.work/?ref={CODE}
  // - ?ref={CODE}
  // - Standalone 8-10 char alphanumeric codes
}
```

**Examples that match:**
- `555.rendernet.work/?ref=ABC12345` ✅
- `?ref=XYZ789` ✅
- `REF CODE: og3iy5oe` ✅ (8 char code)
- `og3iy5oe` (standalone, 8 chars) ✅

---

## How Bot Uses These

### Step 1: Extract Codes from Tweet
```typescript
// In ingestion.ts (lines 237-246)
const codes = extractHyperlinkCodes(tweet.text);
for (const code of codes) {
    const resolved = await resolveWalletFromHyperlink(runtime, code);
    if (resolved) {
        wallet = resolved.wallet;
        chainType = resolved.chainType;
        break;
    }
}
```

### Step 2: Resolve Wallet via Hyperlink API
```
GET http://api.555hyper.link/pub/v1/links/{code}
→ Returns: { wallet, chainType, creatorId }
```

### Step 3: Send to Backend with Referral
```typescript
const payload = buildPostPublishedPayload({
    tweet,
    handle,
    wallet,
    includeSnapshot: false
});

// Payload includes:
{
  platform: "twitter",
  type: "post_published",
  tweet_id: "...",
  handle: "...",
  wallet: "..." (if resolved),
  referral_code: "..." (if found),
  text: "...",
  hashtags: [...],
  mentions: [...]
}
```

---

## Check If It's Working

### On Bot Server:

```bash
# 1. Check for hyperlink resolution attempts
pm2 logs eliza --lines 500 | grep -i "hyperlink"

# Look for:
# ✅ "Hyperlink code abc123 not found" (trying but not found)
# ✅ "Cached wallet mapping" (successful resolution)
# ❌ "HYPERLINK_API_KEY not configured" (config missing)
# ❌ "Hyperlink API error: 401" (auth failing)

# 2. Check for referral code extraction
pm2 logs eliza --lines 500 | grep -i "referral"

# 3. Check events being sent with wallet data
pm2 logs eliza --lines 100 | grep "wallet"
```

---

## Test Cases from Real Tweets

From your bot logs, I saw this tweet:
```
"🕹️🔥5 Day Burn and Quest event from @555render @RNDRNTWRK...
REF CODE: og3iy5oe"
```

**The bot should:**
1. ✅ Detect `#555RNDR` hashtag → qualifies
2. ✅ Extract referral code `og3iy5oe` → included in payload
3. ✅ Send to backend with `referral_code: "og3iy5oe"`
4. ✅ Backend resolves wallet from referral code

---

## Potential Issues

### Issue 1: Bot Looking for Wrong Domain

Bot checks for:
```
555.rendernet.work/p/CODE
```

But actual hyperlinks might be:
```
555hyper.link/p/CODE
```

**Check:** Are users posting links with the domain the bot expects?

### Issue 2: API Key Not Working

From earlier, we fixed `HYPERLINK_API_BASE` but bot might still have issues.

**Check bot logs for:**
```bash
pm2 logs eliza | grep -i "hyperlink api"
```

Look for 401 errors or "not configured" warnings.

### Issue 3: All Wallets are Null

From your bot logs, I noticed:
```
"wallet": null
"wallet": null
"wallet": null
```

**This means:**
- Bot IS extracting codes
- Bot IS trying to resolve wallets
- **But resolution is failing** (returns null)

---

## Debug Wallet Resolution

### Check if bot is even trying:

```bash
pm2 logs eliza --lines 1000 | grep -i "resolv\|hyperlink code\|twitter handle"
```

**You should see:**
- `"Hyperlink code xxx not found"` → Bot tried, code doesn't exist
- `"No hyperlink found for Twitter handle @xxx"` → Handle not registered
- `"Cached wallet mapping"` → Success!

**If you see nothing:**
→ Bot isn't even attempting hyperlink resolution

---

## Quick Test

### 1. Create a test hyperlink:

Use the Hyperlink API to create a link for your Twitter handle:
```bash
curl -X POST http://api.555hyper.link/pub/v1/users \
  -H "X-API-Key: 62d54258a0185884e3028871cf95512ab5067d8cce080cfe0512f7177d7773ed" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_twitter_handle",
    "wallet": "YOUR_SOLANA_WALLET"
  }'
```

### 2. Post a tweet mentioning yourself:

```
Testing @555render with my wallet setup! #555rndr
```

### 3. Check bot resolves your wallet:

```bash
pm2 logs eliza | grep -i "your_handle"
```

Should show: `wallet: "YOUR_SOLANA_WALLET"` instead of `null`

---

## Commands to Run Now

```bash
# On bot server:

# 1. Check hyperlink resolution attempts
pm2 logs eliza --lines 500 | grep -i "hyperlink" | tail -20

# 2. Check if ANY wallet is ever resolved (not null)
pm2 logs eliza --lines 500 | grep '"wallet":' | grep -v "null" | head -10

# 3. Check for resolution errors
pm2 logs eliza --lines 500 | grep -i "error resolving\|api error"
```

**Run these and show me the output - this will tell us if wallet resolution is working!**

