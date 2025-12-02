# Fix: Bot Not Sending Data to Backend

## The Issue

- ✅ Bot is scanning Twitter (you saw this in logs)
- ✅ Bot is finding qualifying tweets (`qualifies: true`)
- ✅ Backend endpoint exists and works
- ✅ Config looks correct
- ❌ **But backend has NO logs of receiving data**

---

## What to Check on Bot Server

### 1. Is `TWITTER_BOT_MAIN_API_BASE` actually loaded?

```bash
# SSH to bot server, then run:
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE
```

**Expected:**
```
TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com
```

**If missing:** The deployment didn't inject it! Need to add manually or redeploy.

### 2. Check bot logs for "not configured" error

```bash
pm2 logs eliza --lines 500 | grep "not configured"
```

**If you see:**
```
TWITTER_BOT_MAIN_API_BASE is not configured
```

→ **This is the problem!** Bot can't send without this variable.

### 3. Check bot logs for sending attempts

```bash
# Look for successful sends
pm2 logs eliza --lines 500 | grep "emitted post_published"

# Look for failed sends  
pm2 logs eliza --lines 500 | grep -E "(Failed to POST|Webhook)"
```

**If you see "emitted post_published":**
→ Bot IS sending! Backend might be rejecting (check auth)

**If you see "Failed to POST":**
→ Bot is trying but failing (network/auth issue)

**If you see nothing:**
→ Bot code path not executing (condition blocking it)

---

## Most Likely Fix

### The env var is probably missing from production!

**Quick fix:**
```bash
# On bot server
echo "" >> /opt/eliza/.env.production
echo "TWITTER_BOT_MAIN_API_BASE=https://five55-backend-wn5h.onrender.com" >> /opt/eliza/.env.production
echo "TWITTER_BOT_HMAC_SECRET=f840d41c74f1c4a1ff5dc21ab1d229143ba125308abe8e2ad07d9b9f54f17820" >> /opt/eliza/.env.production

# Restart bot
pm2 restart eliza

# Watch logs for "emitted post_published"
pm2 logs eliza --lines 0 | grep -E "(emitted|post_published|Failed to POST)"
```

**Within 60 seconds** (next scan), you should see tweets being sent!

---

## Check GitHub Actions Deployment

The workflow file has the variable listed:
```yaml
update_env_var "TWITTER_BOT_MAIN_API_BASE" "${{ secrets.TWITTER_BOT_MAIN_API_BASE }}"
```

**Check:**
1. Go to GitHub: https://github.com/Render-Network-OS/555-bot/settings/secrets/actions
2. Verify `TWITTER_BOT_MAIN_API_BASE` exists as a secret
3. Check recent workflow runs to see if it deployed successfully

---

## Test the Fix

After adding the env var and restarting:

### 1. Post a test tweet:
```
Testing @555render integration! #555rndr
```

### 2. Watch bot logs:
```bash
pm2 logs eliza --lines 0
```

### 3. Within 60-90 seconds, you should see:
```
✅ TwitterIngestion scan completed
✅ TwitterIngestion evaluated tweet (qualifies: true)
✅ TwitterIngestion emitted post_published event
   tweetId: xxx
   handle: your_handle
   wallet: xxx (or null)
```

### 4. Check backend logs (Render):
```
✅ POST /integrations/twitter/events 202
✅ Processing Twitter event: post_published
✅ Twitter handle: your_handle
✅ Quest completed: social_post
✅ Points awarded: 50
```

---

## Still Not Working?

### Check Bot Code Version

The code SHOULD send events after finding qualifying tweets. Check if the bot has the latest code:

```bash
# On bot server
cd /opt/eliza
git log --oneline -5

# Should include recent commits with twitter integration
```

### Check for DRY RUN Mode

Some bots have a dry run mode that prevents actual API calls:

```bash
cat /opt/eliza/.env.production | grep -i "dry\|test\|mock"
```

---

## Commands to Run RIGHT NOW

```bash
# SSH to bot server, then:

# 1. Check variable
cat /opt/eliza/.env.production | grep TWITTER_BOT_MAIN_API_BASE

# 2. Check logs for error
pm2 logs eliza --lines 300 | grep "not configured"

# 3. Check logs for send attempts  
pm2 logs eliza --lines 300 | grep "post_published"
```

**Run these 3 commands and tell me the output!**

That will immediately tell us if the env var is missing or if there's another issue.

