# Countdown Announcements Feature

## Overview

Flip countdown timer announcements with digital clock-style animations. Counts down to a target date/time with smooth card-flip transitions on each digit change.

## Architecture Flow

```
User → AnnouncementsPage → Backend API → Database
                ↓
        ControlPanelApp (loads & broadcasts)
                ↓
        BroadcastChannel (same browser) / WebSocket (OBS)
                ↓
        Overlay Page → AnnouncementsOverlay → FlipCountdown
```

## Components

### Frontend Components

1. **FlipCountdown.tsx** - Core countdown component
   - Real-time countdown calculation
   - Individual flip card per digit
   - Auto mode for smart unit visibility
   - Panchang-Bold font for numbers

2. **FlipCountdown.module.css** - 3D flip animations
   - Perspective transforms
   - Smooth easing transitions
   - Card shadows and depth effects

3. **AnnouncementsOverlay.tsx** - Overlay renderer
   - Handles all announcement styles
   - Manages placement and sizing
   - Integrates FlipCountdown component

4. **AnnouncementsPage.tsx** - Management UI
   - Create/edit/delete interface
   - Time presets (+10min, +1h, +1d, +1w)
   - Auto mode toggle
   - Live preview while editing
   - Past date validation

5. **ControlPanelApp.tsx** - State broadcaster
   - Loads announcements from backend
   - Broadcasts via BroadcastChannel
   - Sends to overlay page in real-time

### Backend Components

1. **model/model.go** - Database model
   - Announcement struct with countdown fields
   - JSON serialization tags for API responses

2. **handler/announcements.go** - API endpoints
   - CRUD operations
   - Countdown field validation
   - Special handling for countdown style

3. **Database Table**: `announcements`
   - Standard announcement fields
   - Countdown-specific fields:
     - `target_time` (TIMESTAMP)
     - `countdown_show_days` (BOOLEAN)
     - `countdown_show_hours` (BOOLEAN)
     - `countdown_show_minutes` (BOOLEAN)
     - `countdown_show_seconds` (BOOLEAN)
     - `countdown_auto_mode` (BOOLEAN)

## Data Flow

### 1. Creating a Countdown

```
User fills form → POST /api/announcements → 
Backend validates → Saves to DB → 
Returns announcement with ID → 
Frontend refreshes list → 
ControlPanelApp broadcasts to overlay
```

### 2. Displaying on Overlay

```
ControlPanelApp loads announcements (every 30s or on change) →
Broadcasts via BroadcastChannel →
Overlay page receives update →
AnnouncementsOverlay filters visible announcements →
FlipCountdown renders for 'countdown' style →
Updates every second with flip animations
```

## UX Features

### Smart Time Presets
- **+10 min** - Quick countdown for imminent events
- **+1 hour** - Short-term announcements
- **+1 day** - Next-day events
- **+1 week** - Weekly milestones

### Auto Mode
When enabled, automatically shows/hides units based on time remaining:
- Hides "Days" if < 1 day
- Hides "Hours" if < 1 hour  
- Always shows minutes and seconds
- Keeps display clean and relevant

### Manual Mode
Full control over which units display:
- Toggle Days on/off
- Toggle Hours on/off
- Toggle Minutes on/off
- Toggle Seconds on/off

### Validation
- Prevents past dates with `min` attribute
- Shows warning if past date is detected
- Client-side validation before submission
- Backend validation for countdown requirements

### Live Preview
- Shows countdown while creating (before saving)
- Updates in real-time as settings change
- Also shows in standard Preview section
- Matches exact overlay appearance

## API Endpoints

### GET /v1/announcements
Returns all announcements for authenticated user, including countdown fields.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "manual",
      "text": "Countdown",
      "style": "countdown",
      "placement": "top-bar",
      "duration": 5,
      "backgroundColor": "#000000",
      "textColor": "#ffffff",
      "fontSize": 16,
      "is_visible": true,
      "target_time": "2025-11-19T20:00:00Z",
      "countdown_show_days": true,
      "countdown_show_hours": true,
      "countdown_show_minutes": true,
      "countdown_show_seconds": true,
      "countdown_auto_mode": false
    }
  ]
}
```

### POST /v1/announcements
Creates a new countdown announcement.

**Request**:
```json
{
  "type": "manual",
  "text": "",
  "style": "countdown",
  "placement": "center",
  "duration": 10,
  "backgroundColor": "#000000",
  "textColor": "#ffffff",
  "fontSize": 16,
  "isVisible": true,
  "targetTime": "2025-11-20T15:00:00Z",
  "countdownShowDays": true,
  "countdownShowHours": true,
  "countdownShowMinutes": true,
  "countdownShowSeconds": true,
  "countdownAutoMode": false
}
```

### PUT /v1/announcements/{id}
Updates an existing countdown.

### DELETE /v1/announcements/{id}
Deletes a countdown announcement.

## Placement Options

All standard placement options supported:
- `full-screen` - Full viewport
- `top-bar` - Top center strip
- `bottom-bar` - Bottom center strip
- `center` - Dead center
- `top-left` - Upper left corner
- `top-right` - Upper right corner
- `bottom-left` - Lower left corner
- `bottom-right` - Lower right corner

## Styling

### Colors
- `backgroundColor` - Card background color
- `textColor` - Digit and label color

### Typography
- Uses **Panchang-Bold** font (same as headers)
- Font size scales all elements proportionally
- Tabular numbers for consistent digit width

### Animations
- 3D flip animation on digit change
- 0.6s duration with cubic-bezier easing
- Smooth, professional transitions

## Testing

### Manual Test Steps

1. **Create Countdown**:
   - Navigate to Control Panel → Announcements
   - Click "+ New Announcement"
   - Select "Countdown" style
   - Click "+1 hour" preset
   - Enable visibility
   - Click "Create"

2. **Verify Control Panel**:
   - Countdown appears in "Your Announcements"
   - Preview section shows countdown ticking
   - Edit/Delete buttons work

3. **Verify Overlay**:
   - Open `http://localhost:3000/overlay/[streamer-id]`
   - Countdown displays in selected placement
   - Updates every second
   - Flip animations trigger on digit changes

4. **Test Settings**:
   - Change placement - countdown moves
   - Change colors - countdown updates
   - Toggle auto mode - units show/hide intelligently
   - Toggle manual units - specific units show/hide

## Troubleshooting

### Countdown Not Showing on Overlay

**Check**:
1. Is `isVisible` set to `true`?
2. Is the streamer ID correct in the overlay URL?
3. Open browser console - any errors?
4. Check if BroadcastChannel is working (same browser)

**Solution**:
- Ensure countdown announcement has `is_visible = true` in database
- Verify ControlPanelApp is broadcasting (check console logs)
- Refresh overlay page to re-establish BroadcastChannel

### Preview Erratic

**Issue**: Preview flickering or not updating properly.

**Solution**:
- Fixed by ensuring `previewAnnouncements` includes form data when editing
- Only shows preview when form is open AND visibility is ON
- Uses consistent field mapping

### 400 Bad Request

**Issue**: Backend rejecting countdown creation.

**Causes**:
1. Missing `targetTime` for countdown style
2. Invalid date format
3. Missing JSON tags on backend model

**Solutions**:
- Client validates `targetTime` before submission
- Backend uses default "Countdown" text for empty text field
- All model fields have proper JSON tags

### Delete Shows "undefined" ID

**Issue**: Frontend has `undefined` announcement ID.

**Solution**:
- Added JSON serialization tags to `Announcement` struct
- Backend now returns proper `id` field
- Frontend maps it correctly in `ControlPanelApp`

## Production Deployment

See `/backend/migrations/PRODUCTION_DEPLOYMENT.md` for complete deployment guide.

**Quick Steps**:
1. Backup production database
2. Deploy backend code
3. Deploy frontend code
4. Run migration: `psql $DATABASE_URL -f migrations/002_add_countdown_fields.sql`
5. Verify migration succeeded
6. Test countdown creation

## Performance

- **Update Frequency**: 1 second (minimal CPU)
- **Animation Cost**: CSS transforms (GPU accelerated)
- **Network**: No polling (BroadcastChannel is local)
- **Database**: Indexed on `target_time` for queries

## Future Enhancements

- [ ] Custom flip card themes (glossy, matte, neon)
- [ ] Sound effects on digit flip
- [ ] Confetti/animation when countdown reaches zero
- [ ] Multiple countdown templates (event, stream start, etc.)
- [ ] Countdown completion triggers (auto-message, alert)

