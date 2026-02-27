# PRD — QR RULE: Gym Membership & Check-In System

## Project Overview

Build a gym membership management system where each member has a **single, permanent QR code** that never changes or expires. Access validity is controlled by membership dates and a daily attendance record — not the QR code itself.

---

## Tech Stack (fill in as needed)

- Frontend: `___`
- Backend: `___`
- Database: `___`
- QR Generation: `___`

---

## UI/UX Design Specification

> **Design language: Dark Neomorphic Dashboard**
> Inspired by Fitonist. Not a generic admin panel. Data is the hero — large numbers, smooth charts, minimal chrome.

---

### Color Tokens

```css
/* Backgrounds */
--bg-base:        #0A0A0F;   /* page background — near black with blue undertone */
--bg-card:        #12121A;   /* card surface */
--bg-card-hover:  #1A1A26;   /* card on hover */
--bg-input:       #1E1E2E;   /* inputs, selects, inner panels */

/* Accent */
--accent-primary:   #3B82F6;   /* blue — main CTA, active states, highlights */
--accent-secondary: #10B981;   /* green — success, check-in confirmed, active badges */
--accent-warning:   #F59E0B;   /* amber — expiring soon, already checked in */
--accent-danger:    #EF4444;   /* red — expired, suspended, denied */

/* Text */
--text-primary:   #F9FAFB;   /* headings, hero numbers */
--text-secondary: #9CA3AF;   /* labels, sublabels */
--text-muted:     #4B5563;   /* placeholders, dividers */

/* Chart colors */
--chart-1: #3B82F6;   /* blue */
--chart-2: #10B981;   /* green */
--chart-3: #F59E0B;   /* amber */
--chart-4: #8B5CF6;   /* purple — 4th series only */
```

---

### Typography

```css
font-family: 'Inter', sans-serif;

/* Hero numbers (big stat cards) */
--text-hero:   font-size: 48px; font-weight: 700; letter-spacing: -2px;

/* Section numbers (secondary stats) */
--text-stat:   font-size: 28px; font-weight: 600; letter-spacing: -1px;

/* Card titles */
--text-title:  font-size: 13px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em;

/* Body / labels */
--text-body:   font-size: 14px; font-weight: 400; color: var(--text-secondary);

/* Badges / tags */
--text-badge:  font-size: 11px; font-weight: 600;
```

---

### Card Styling

```css
.card {
  background:    var(--bg-card);
  border-radius: 20px;
  border:        1px solid rgba(255, 255, 255, 0.05);
  padding:       24px;
  /* No drop shadow — rely on bg contrast only */
}

/* Charts bleed to card edges — remove horizontal padding on chart wrapper */
.card .chart-wrapper {
  margin-left:  -24px;
  margin-right: -24px;
  margin-bottom: -24px;
}
```

---

### Layout Grid

```
Dashboard / Analytics page uses an asymmetric CSS grid.
DO NOT use equal-width columns throughout.

Suggested grid template for dashboard:
  - Row 1: [large card 2fr] [medium card 1fr] [medium card 1fr]
  - Row 2: [small card 1fr] [small card 1fr] [large card 2fr]

Key rule: no two adjacent rows should have the same card layout.
This prevents the "spreadsheet" look.

Use CSS Grid, not flexbox, for the page layout.
Gap between cards: 16px.
```

---

### Stat Cards (Hero Number Style)

Each summary card follows this exact structure:

```
┌─────────────────────────────┐
│ CARD TITLE          [filter]│  ← 13px uppercase label + inline tab filter
│                             │
│ 4,365                       │  ← hero number, 48px bold
│ +12.4% ↑  vs last week      │  ← green pill badge for positive delta
│                             │
│ [chart bleeding to edges]   │  ← area or bar chart, no axes labels
└─────────────────────────────┘
```

**Delta badge rules:**
- Positive delta → green pill (`--accent-secondary`) with ↑ arrow
- Negative delta → red pill (`--accent-danger`) with ↓ arrow
- Neutral / no change → gray pill

**Inline filter tabs** (Today / Week / Month / Range):
- Sit in the top-right of the card
- Active tab: white pill with dark text
- Inactive tab: no background, `--text-muted`
- Font size: 12px

---

### Charts

Use **Recharts** or **Chart.js**. Apply these rules to all charts:

```
Line / Area charts:
  - Smooth curves (type="monotone" in Recharts)
  - Area fill: gradient from accent color (30% opacity) to transparent
  - No X/Y axis lines — use only subtle horizontal grid lines
  - Grid lines: rgba(255,255,255,0.05)
  - Tooltip: dark card style, rounded, shows date + value
  - Active dot: filled circle with glow ring (box-shadow)

Bar charts:
  - Bars have fully rounded tops (borderRadius: 6px top only)
  - Active/hovered bar: full accent color
  - Inactive bars: rgba(accent, 0.3) — muted, not hidden
  - No axis labels on X — use short day abbreviations only (Mon, Tue...)

Donut / Pie charts:
  - Inner radius = 60% (donut, not pie)
  - Display total or main metric in center hole
  - Segment gap: 3px
  - Labels: percentage inside segment if segment > 15%, otherwise legend below

Heatmap (attendance calendar):
  - Cell shape: rounded square
  - Empty day: var(--bg-input)
  - Low:    rgba(59, 130, 246, 0.2)
  - Medium: rgba(59, 130, 246, 0.5)
  - High:   rgba(59, 130, 246, 1.0)
```

---

### Status Badges

```
Active    → green pill  bg: rgba(16, 185, 129, 0.15)  text: #10B981
Expired   → red pill    bg: rgba(239, 68, 68, 0.15)   text: #EF4444
Suspended → amber pill  bg: rgba(245, 158, 11, 0.15)  text: #F59E0B
1 Day     → gray pill   bg: rgba(156, 163, 175, 0.15) text: #9CA3AF
Weekly    → blue pill   bg: rgba(59, 130, 246, 0.15)  text: #3B82F6
Monthly   → purple pill bg: rgba(139, 92, 246, 0.15)  text: #8B5CF6

All badges: border-radius 999px, padding 3px 10px, font-size 11px, font-weight 600
```

---

### Scan Result Screen

The scan response screen must be visually immediate and unambiguous:

```
┌──────────────────────────────────┐
│                                  │
│   [result banner — full width]   │  ← 56px tall, accent color bg
│   ✅ CHECK-IN SUCCESSFUL         │     or 🔴 DENIED / 🟡 DUPLICATE
│                                  │
│        [profile photo]           │  ← 80px circle, border = result color
│                                  │
│        John Santos               │  ← 24px bold white
│        Monthly Member            │  ← 13px secondary
│                                  │
│   Start: Jan 1   End: Jan 31     │
│   Status: ● Active               │
│   Total Visits: 14               │
│                                  │
└──────────────────────────────────┘

Auto-dismiss after 4 seconds. Progress bar at bottom of card counts down.
On mobile: full-screen overlay. On desktop: centered modal, max-width 400px.
```

---

### Navigation

```
Sidebar (desktop):
  - Width: 240px collapsed to 64px icon-only on toggle
  - Background: var(--bg-card)
  - Active nav item: left border 3px solid var(--accent-primary) + bg highlight
  - Nav items: Dashboard, Members, Analytics, Scanner, Settings

Top bar (mobile):
  - Tab bar at bottom of screen
  - Icons only with active dot indicator
```

---

### Tables (Member History, Logs)

```css
/* Table rows */
thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding: 12px 16px;
}

tbody tr {
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.15s;
}

tbody tr:hover {
  background: var(--bg-card-hover);
}

/* Member name cell — always includes avatar thumbnail */
.member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.member-cell img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
```

---

### Micro-interactions

- All cards: `transition: transform 0.2s` — lift `translateY(-2px)` on hover
- Buttons: no harsh borders — use background-only with `opacity: 0.8` on hover
- Number counters on dashboard: animate from 0 to final value on page load (600ms ease-out)
- Chart bars/lines: animate in on mount (500ms stagger per bar)
- Scan result banner: slide down from top (300ms ease-out)
- Loading states: skeleton screens using `--bg-input` with shimmer animation — never spinners

---

### What to Avoid

- ❌ White or light backgrounds anywhere
- ❌ Bootstrap or default MUI/Ant Design component styles
- ❌ Equal-width card grids (looks like a spreadsheet)
- ❌ Pie charts (use donuts instead)
- ❌ Axis lines on charts (use faint grid lines only)
- ❌ Colored text on colored backgrounds (low contrast)
- ❌ Drop shadows (use surface color contrast instead)
- ❌ Generic table stripes (use hover highlight only)

---

## Core QR Rules

These rules must be enforced at all times:

- QR codes **never expire**
- QR codes are **reusable** for the lifetime of the membership
- A QR code can only be used **once per calendar day**
- QR codes are **never regenerated** — one code per member, forever
- QR codes contain **no date data** — just a unique member identifier
- **Membership record** (`start_date` / `end_date`) controls validity
- **Attendance record** controls the daily check-in limit

---

## Database Schema

### `members` table

```sql
id              UUID        PRIMARY KEY
name            VARCHAR     NOT NULL
email           VARCHAR     -- required for weekly/monthly, optional for 1-day
photo_url       VARCHAR     -- optional for 1-day, required for weekly/monthly
membership_type ENUM        -- '1_day' | 'weekly' | 'monthly'
start_date      DATE        NOT NULL
end_date        DATE        NOT NULL
status          ENUM        -- 'active' | 'suspended' | 'cancelled'
qr_code         VARCHAR     UNIQUE NOT NULL  -- static identifier, never changes
payment_amount  DECIMAL
created_at      TIMESTAMP
```

### `attendance` table

```sql
id              UUID        PRIMARY KEY
member_id       UUID        REFERENCES members(id)
check_in_date   DATE        NOT NULL   -- date only, not datetime
created_at      TIMESTAMP              -- actual scan time

UNIQUE(member_id, check_in_date)       -- enforces once-per-day at DB level
```

### `renewals` table

```sql
id                  UUID        PRIMARY KEY
member_id           UUID        REFERENCES members(id)
membership_type     ENUM        -- '1_day' | 'weekly' | 'monthly'
previous_end_date   DATE        NOT NULL
new_end_date        DATE        NOT NULL
payment_amount      DECIMAL     NOT NULL
renewed_by          VARCHAR     -- admin identifier
created_at          TIMESTAMP
```

> Used for revenue history, renewal frequency, and member lifetime value analytics.

---

## QR Scan Flow

When a QR code is scanned, run this validation sequence in order:

```
1. Look up member by qr_code value
   → Not found: return { status: 'invalid_qr' }

2. Check member.status === 'active'
   → status === 'suspended': return { status: 'suspended' }

3. Check today >= member.start_date AND today <= member.end_date
   → Outside range: return { status: 'expired' }

4. Check attendance table for (member_id, today)
   → Record exists: return { status: 'already_checked_in' }
   → No record: INSERT attendance record, return { status: 'success' }
```

### Scan Result States

| Status | Description |
|---|---|
| `success` | Check-in accepted, attendance record created |
| `already_checked_in` | Member already scanned today |
| `expired` | Today is outside membership date range |
| `suspended` | Member account is suspended |
| `invalid_qr` | QR not found in system |

---

## QR Scan Response Screen

After every scan — **regardless of result** — display a member info screen. This lets staff visually verify identity.

### Required display fields

- Profile photo (show placeholder avatar if none on file)
- Full name
- Membership type
- Start date and end date
- Status badge (Active / Expired / Suspended)
- Total visits (count of all-time attendance records)
- **Result banner** — color-coded and visually dominant:
  - 🟢 Green → `success`
  - 🔴 Red → `expired` | `suspended` | `invalid_qr`
  - 🟡 Yellow → `already_checked_in`

### Performance requirement

The scan response screen must render within **1 second** of a valid scan.

---

## Member Creation Flow

### Step 1 — Admin selects membership type

Options: `1 Day` | `Weekly` | `Monthly`

---

### If `1 Day` selected

**Required fields:**
- Name
- Payment amount

**Optional fields:**
- Photo
- Email

**System sets automatically:**
- `start_date` = today
- `end_date` = today
- `qr_code` = generated on save
- `status` = `active`

---

### If `Weekly` or `Monthly` selected

**Required fields:**
- Name
- Email
- Photo
- Payment amount

**System sets automatically:**
- `start_date` = today
- `end_date` = today + 7 days (weekly) or today + 30 days (monthly)
- `qr_code` = generated on save
- `status` = `active`

---

## Renew Logic

When admin renews a membership:

1. Extend `end_date`:
   - If membership is still active: `new_end_date = current end_date + duration`
   - If membership is expired: `new_end_date = today + duration`
2. Keep `qr_code` unchanged — member uses the same QR
3. Set `status` = `active` if it was expired
4. Access resumes immediately on save

Duration: Weekly = +7 days, Monthly = +30 days

---

## Member Profile Page

### Display

- Profile photo (or placeholder)
- Name
- Membership type
- Start date
- End date
- Status badge
- Total visits

### Actions

| Action | Behavior |
|---|---|
| **Renew** | Open renew modal → extend `end_date`, keep QR |
| **Suspend** | Set `status = 'suspended'` → blocks scan immediately |
| **Show QR** | Display QR code for printing or sharing |

---

## Dashboard (MVP)

### Summary Cards

| Card | Query |
|---|---|
| Total Active Members | `status = 'active' AND today BETWEEN start_date AND end_date` |
| Expiring in 7 Days | Active members where `end_date BETWEEN today AND today + 7` |
| Today's Check-Ins | `COUNT(attendance WHERE check_in_date = today)` |
| Today's Revenue | `SUM(payment_amount WHERE DATE(created_at) = today)` |
| Walk-in Count | `COUNT(members WHERE membership_type = '1_day' AND DATE(created_at) = today)` |
| Monthly Revenue | `SUM(payment_amount WHERE created_at IN current month)` |

### Graphs

- **Weekly Attendance** — bar chart, Mon–Sun, count of check-ins per day
- **Weekly Sales** — bar chart, Mon–Sun, total revenue per day

---

## Analytics Page

Separate page from the main dashboard. Provides historical data, trends, and member behavior insights. All sections support a **date range filter** (presets: Last 7 Days, Last 30 Days, Last 3 Months, Last 12 Months, Custom Range).

---

### Section 1 — Revenue Analytics

#### Summary row (filtered by selected date range)

| Metric | Query |
|---|---|
| Total Revenue | `SUM(payment_amount) FROM members + renewals WHERE created_at IN range` |
| New Member Revenue | `SUM(payment_amount) FROM members WHERE created_at IN range` |
| Renewal Revenue | `SUM(payment_amount) FROM renewals WHERE created_at IN range` |
| Avg Revenue per Member | `Total Revenue / COUNT(DISTINCT member_id)` |
| Highest Revenue Day | `MAX(daily_sum)` within range |

#### Charts

- **Revenue Over Time** — line chart, daily or weekly granularity depending on range
  - Two lines: New Members vs Renewals
- **Revenue by Membership Type** — pie or donut chart
  - Breakdown: 1 Day / Weekly / Monthly
- **Monthly Revenue Comparison** — grouped bar chart
  - Compare current month vs previous month side by side per week

---

### Section 2 — Membership Analytics

#### Summary row

| Metric | Query |
|---|---|
| New Members (range) | `COUNT FROM members WHERE created_at IN range` |
| Renewals (range) | `COUNT FROM renewals WHERE created_at IN range` |
| Churned Members | Members whose `end_date` fell within range and were NOT renewed |
| Net Member Growth | New Members − Churned |
| Renewal Rate | `renewals / (renewals + churned)` as % |

#### Charts

- **New Members Over Time** — bar chart by day/week
- **Membership Type Distribution** — donut chart (active members only)
  - 1 Day / Weekly / Monthly breakdown
- **Membership Status Breakdown** — stacked bar chart over time
  - Active / Expired / Suspended counts per week

---

### Section 3 — Attendance Analytics

#### Summary row

| Metric | Query |
|---|---|
| Total Check-Ins (range) | `COUNT FROM attendance WHERE check_in_date IN range` |
| Avg Daily Check-Ins | `Total / COUNT(DISTINCT check_in_date)` |
| Busiest Day (all time) | `MAX(COUNT) GROUP BY check_in_date` |
| Busiest Day of Week | `GROUP BY DAYOFWEEK(check_in_date)`, find highest avg |
| Peak Hour | `GROUP BY HOUR(created_at)`, find highest avg (requires time data) |

#### Charts

- **Daily Check-Ins Over Time** — line chart within selected range
- **Check-Ins by Day of Week** — bar chart (Mon–Sun), average across the range
  - Helps identify which days are busiest
- **Check-In Heatmap** — calendar heatmap showing intensity per day
  - Color scale: light = low traffic, dark = high traffic
- **Hourly Distribution** — bar chart showing average check-ins per hour of day
  - Grouped: Morning (6–12), Afternoon (12–17), Evening (17–22)

---

### Section 4 — Member History Table

A searchable, filterable, paginated table of all members — active and historical.

#### Columns

| Column | Description |
|---|---|
| Name | Member name, links to profile page |
| Photo | Thumbnail |
| Type | 1 Day / Weekly / Monthly |
| Status | Active / Expired / Suspended badge |
| Start Date | Original membership start |
| End Date | Current end date |
| Total Visits | Lifetime attendance count |
| Last Seen | Most recent `check_in_date` |
| Total Paid | `SUM(payment_amount)` from members + renewals |
| Renewals | Count of renewal records |
| Joined | `created_at` date |

#### Filters

- Status (Active / Expired / Suspended / All)
- Membership type (1 Day / Weekly / Monthly / All)
- Date joined (range picker)
- Search by name or email

#### Sort

All columns sortable. Default: newest first (`created_at DESC`).

---

### Section 5 — Attendance History Log

A paginated log of every individual check-in event.

#### Columns

| Column | Description |
|---|---|
| Date & Time | `created_at` timestamp |
| Member Name | Links to profile page |
| Photo | Thumbnail |
| Membership Type | At time of check-in |
| Status at Scan | What the scan result was (success only in this log) |

#### Filters

- Date range
- Membership type
- Search by member name

#### Export

- Export visible data as CSV

---

### Section 6 — Renewal History Log

A paginated log of all renewal events.

#### Columns

| Column | Description |
|---|---|
| Date | `renewals.created_at` |
| Member Name | Links to profile page |
| Type | Membership type renewed |
| Previous End Date | Before renewal |
| New End Date | After renewal |
| Amount Paid | `renewals.payment_amount` |

#### Filters

- Date range
- Membership type
- Search by member name

#### Export

- Export visible data as CSV

---

### Section 7 — Member Lifetime View (per-member drill-down)

Accessible from the Member History Table by clicking a member name, or from the Member Profile page via an "Analytics" tab.

#### Displays

- **Visit frequency chart** — bar chart of monthly check-in counts (all time)
- **Membership timeline** — visual timeline of membership periods (start → end) including renewals
- **Payment history** — list of all payments (creation + renewals) with dates and amounts
- **Total lifetime value** — sum of all payments ever made by this member
- **Average visits per active week** — `total visits / total active weeks`
- **Attendance streak** — current consecutive days checked in (if applicable)

---

### Analytics Page — Data Requirements

The following queries must be supported efficiently. Add indexes as needed:

```sql
-- Revenue by day
SELECT DATE(created_at) AS day, SUM(payment_amount) AS revenue
FROM members
WHERE created_at BETWEEN :start AND :end
GROUP BY day;

-- Renewals revenue by day
SELECT DATE(created_at) AS day, SUM(payment_amount) AS revenue
FROM renewals
WHERE created_at BETWEEN :start AND :end
GROUP BY day;

-- Check-ins by day
SELECT check_in_date, COUNT(*) AS checkins
FROM attendance
WHERE check_in_date BETWEEN :start AND :end
GROUP BY check_in_date;

-- Check-ins by day of week
SELECT DAYOFWEEK(check_in_date) AS dow, COUNT(*) AS total
FROM attendance
GROUP BY dow;

-- Members with lifetime stats
SELECT
  m.id, m.name, m.photo_url, m.membership_type, m.status,
  m.start_date, m.end_date, m.created_at,
  COUNT(a.id) AS total_visits,
  MAX(a.check_in_date) AS last_seen,
  m.payment_amount + COALESCE(SUM(r.payment_amount), 0) AS total_paid,
  COUNT(r.id) AS renewal_count
FROM members m
LEFT JOIN attendance a ON a.member_id = m.id
LEFT JOIN renewals r ON r.member_id = m.id
GROUP BY m.id;
```

**Recommended indexes:**
```sql
CREATE INDEX idx_attendance_date ON attendance(check_in_date);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_end_date ON members(end_date);
CREATE INDEX idx_renewals_member ON renewals(member_id);
CREATE INDEX idx_renewals_created ON renewals(created_at);
```

---

## Access Logic Summary

```
member exists
  └─ status === 'active'
       └─ today between start_date and end_date
            └─ no attendance record for today
                 └─ ✅ CHECK-IN SUCCESS
```

Any check failing returns a specific error state (see Scan Result States above).

---

## Out of Scope (MVP)

- Member-facing app or self-service portal
- Automated expiry notifications (email/SMS)
- Multi-location support
- Online payment processing
- Membership freeze/pause
- Discount or referral codes

---

## Open Questions

| # | Question |
|---|---|
| 1 | What format is the `qr_code` value — UUID, hash, or sequential ID? |
| 2 | Should renewal extend from `end_date` or from today when already expired? |
| 3 | How long should the scan result screen stay visible before auto-dismissing? |
| 4 | Should 1-Day members' photos added later appear retroactively on the scan screen? |
| 5 | Is `payment_amount` tracked per renewal event, or only at initial creation? |
