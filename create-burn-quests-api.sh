#!/bin/bash
#
# create-burn-quests-api.sh <event_id>
# Creates burn event quests using the API endpoint
#

if [ -z "$1" ]; then
  echo "Usage: $0 <event_id>"
  exit 1
fi

EVENT_ID=$1
API_BASE="${API_BASE:-https://five55-backend-wn5h.onrender.com}"

echo "Creating burn event quests for event ID: $EVENT_ID"
echo ""

# Helper function to create quest
create_quest() {
  curl -s -X POST "${API_BASE}/quests" \
    -H "Content-Type: application/json" \
    -d "$1" | jq -r '.ID // empty'
}

# Day 1 - NOISE Quests
echo "Creating Day 1 (NOISE) quests..."

create_quest '{
  "title": "Spread the Flame",
  "type": "social_post",
  "frequency": "once",
  "rules": {"hashtags": ["555BurnEvent"], "min_likes": 0},
  "reward_points": 5000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 1,
  "category": "social"
}'

create_quest '{
  "title": "First Burn Witness",
  "type": "social_post",
  "frequency": "once",
  "rules": {"event": "burn_witness", "must_tweet": true},
  "reward_points": 3000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 1,
  "category": "social"
}'

create_quest '{
  "title": "Ignition Trio",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_games": 3, "different_games": true},
  "reward_points": 5000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 1,
  "category": "game"
}'

create_quest '{
  "title": "Flame Starter",
  "type": "referral",
  "frequency": "once",
  "rules": {"min_referrals": 1, "referee_must_complete_quest": true},
  "reward_points": 3000,
  "reward_type": "points",
  "caps": {"per_wallet": 3},
  "event_id": '"$EVENT_ID"',
  "event_day": 1,
  "category": "referral"
}'

create_quest '{
  "title": "Tutorial Video Challenge",
  "type": "content_creation",
  "frequency": "once",
  "rules": {"type": "video", "must_include_referral_link": true, "metric": "unique_referral_clicks"},
  "reward_points": 111111,
  "reward_type": "usdc",
  "reward_usdc": 10.0,
  "event_id": '"$EVENT_ID"',
  "event_day": 1,
  "category": "special"
}'

# Day 2 - INFERNO Quests
echo "Creating Day 2 (INFERNO) quests..."

create_quest '{
  "title": "Arcade Master",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_score": 10000, "category": "arcade"},
  "reward_points": 8000,
  "reward_type": "usdc",
  "reward_usdc": 1.0,
  "caps": {"cap_awards": 5},
  "event_id": '"$EVENT_ID"',
  "event_day": 2,
  "category": "game"
}'

create_quest '{
  "title": "RPG Grinder",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_games": 5},
  "reward_points": 6000,
  "reward_type": "usdc",
  "reward_usdc": 1.0,
  "caps": {"cap_awards": 5},
  "event_id": '"$EVENT_ID"',
  "event_day": 2,
  "category": "game"
}'

create_quest '{
  "title": "Inferno Tweet",
  "type": "social_post",
  "frequency": "once",
  "rules": {"hashtags": ["555Inferno"], "must_include_score": true},
  "reward_points": 3000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 2,
  "category": "social"
}'

create_quest '{
  "title": "Marathon Player",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_games": 10},
  "reward_points": 10000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 2,
  "category": "game"
}'

# Day 3 - WILDFIRE Quests
echo "Creating Day 3 (WILDFIRE) quests..."

create_quest '{
  "title": "Referral Sprint",
  "type": "referral",
  "frequency": "once",
  "rules": {"min_referrals": 5, "referee_must_complete_quest": true},
  "reward_points": 15000,
  "reward_type": "usdc",
  "reward_usdc": 5.0,
  "caps": {"cap_awards": 2},
  "event_id": '"$EVENT_ID"',
  "event_day": 3,
  "category": "referral"
}'

create_quest '{
  "title": "Viral Post",
  "type": "social_post",
  "frequency": "once",
  "rules": {"min_likes": 100},
  "reward_points": 5000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 3,
  "category": "social"
}'

create_quest '{
  "title": "Wildfire Streak",
  "type": "play_score",
  "frequency": "once",
  "rules": {"personal_bests": 3, "different_games": true},
  "reward_points": 8000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 3,
  "category": "game"
}'

create_quest '{
  "title": "Community Flame",
  "type": "social_engagement",
  "frequency": "once",
  "rules": {"min_replies": 10, "to_other_players": true},
  "reward_points": 4000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 3,
  "category": "social"
}'

# Day 4 - BLAZE Quests
echo "Creating Day 4 (BLAZE) quests..."

create_quest '{
  "title": "Top 10 Finish",
  "type": "play_score",
  "frequency": "once",
  "rules": {"must_rank_top": 10},
  "reward_points": 10000,
  "reward_type": "usdc",
  "reward_usdc": 2.0,
  "caps": {"cap_awards": 5},
  "event_id": '"$EVENT_ID"',
  "event_day": 4,
  "category": "game"
}'

create_quest '{
  "title": "Gameplay Clip",
  "type": "content_creation",
  "frequency": "once",
  "rules": {"type": "video", "min_duration": 30},
  "reward_points": 5000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 4,
  "category": "content"
}'

create_quest '{
  "title": "Speed Demon",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_games": 15, "max_duration_hours": 3},
  "reward_points": 12000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 4,
  "category": "game"
}'

create_quest '{
  "title": "Thread Creator",
  "type": "social_post",
  "frequency": "once",
  "rules": {"type": "thread", "min_tweets": 5},
  "reward_points": 6000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 4,
  "category": "social"
}'

# Day 5 - SUPERNOVA Quests
echo "Creating Day 5 (SUPERNOVA) quests..."

create_quest '{
  "title": "Perfect Week",
  "type": "completion",
  "frequency": "once",
  "rules": {"must_complete_quest_each_day": true, "days": [1,2,3,4,5]},
  "reward_points": 20000,
  "reward_type": "usdc",
  "reward_usdc": 5.0,
  "caps": {"cap_awards": 2},
  "event_id": '"$EVENT_ID"',
  "event_day": 5,
  "category": "completion"
}'

create_quest '{
  "title": "Final Push",
  "type": "play_score",
  "frequency": "once",
  "rules": {"min_points_day5": 25000},
  "reward_points": 15000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 5,
  "category": "game"
}'

create_quest '{
  "title": "Supernova Tweet",
  "type": "social_post",
  "frequency": "once",
  "rules": {"hashtags": ["555Supernova"], "summarize_event": true},
  "reward_points": 8000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 5,
  "category": "social"
}'

create_quest '{
  "title": "All Games Challenge",
  "type": "play_score",
  "frequency": "once",
  "rules": {"play_all_games": true, "min_once_each": true},
  "reward_points": 10000,
  "reward_type": "points",
  "event_id": '"$EVENT_ID"',
  "event_day": 5,
  "category": "game"
}'

echo ""
echo "✅ All 20 burn event quests created!"
echo ""
echo "Summary:"
echo "- Day 1 (NOISE): 5 quests (10 USDC budget)"
echo "- Day 2 (INFERNO): 4 quests (10 USDC budget)"
echo "- Day 3 (WILDFIRE): 4 quests (10 USDC budget)"
echo "- Day 4 (BLAZE): 4 quests (10 USDC budget)"
echo "- Day 5 (SUPERNOVA): 4 quests (10 USDC budget)"
echo ""
echo "Total: 20 quests, 50 USDC daily budget"
echo "Plus 210 USDC for meta prizes = 260 USDC total"

