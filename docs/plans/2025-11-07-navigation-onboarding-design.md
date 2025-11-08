# Platform Navigation & Onboarding Improvements - Design Document

**Date:** 2025-11-07
**Status:** Design Complete - Ready for Implementation
**Goal:** Solve navigation confusion by adding tooltips, quick start cards, and a guided data→agent→chat journey

---

## Problem Statement

Users report three critical navigation issues:
1. **Don't know where to start** - No clear entry point or guided flow
2. **Unclear what each page does** - Menu labels like "AI Templates" or "Automations" are confusing
3. **Too many menu items** - 11 items across 3 sections feels overwhelming

---

## Solution Overview

**Three-Part Solution:**
1. **Add menu tooltips** - Explain every menu item on hover
2. **Dashboard Quick Start cards** - Guide users through: Upload Data → Create Agent → Chat
3. **Enhanced upload experience** - Two equal paths: File Upload OR Data Source Connection

**User Journey:** Data-first approach where users upload/connect data first, then create agents to analyze it, then start chatting.

---

## Design Details

### Part 1: Sidebar Menu Tooltips

**Implementation:**
- Add React Bootstrap `OverlayTrigger` + `Tooltip` to each nav link
- 500ms hover delay before tooltip appears
- Tooltip positioned to the right of menu item
- Dismisses on click or mouse leave

**Tooltip Content:**

**INSIGHTS Section:**
- Home → "Your personalized homepage and quick start guide"
- Dashboard → "Platform analytics and activity overview"
- Reports & Data → "Upload files and view your datasets"

**AI ASSISTANT Section:**
- Ask AI → "Chat with your AI agents and get insights"
- AI Assistants → "Create and manage your AI agents"
- AI Templates → "Save and reuse agent configurations"

**WORKSPACE Section:**
- Data Connections → "Connect to databases and external tools"
- Automations → "Set up automated data pipelines and workflows"
- Organization → "Manage teams and permissions"
- Settings → "Configure your account preferences"

**Technical Approach:**
```javascript
<OverlayTrigger
  placement="right"
  delay={{ show: 500, hide: 0 }}
  overlay={<Tooltip>{item.description}</Tooltip>}
>
  <Nav.Link as={Link} to={item.path}>
    <Icon /> {item.label}
  </Nav.Link>
</OverlayTrigger>
```

---

### Part 2: Dashboard Quick Start Cards

**Location:** Top of DashboardPage, above analytics charts

**Layout:** 3 horizontal cards with connecting arrows (1 → 2 → 3)

**Card 1: Connect Your Data** 📊

**Visual Design:**
- Icon: File/Database icon (large, animated on hover)
- Title: "1. Connect Your Data"
- Description: "Upload a file or connect to your data sources"

**Two Equal Buttons (side-by-side):**

**Button A: "Upload File"**
- Icon: Upload cloud
- Subtext: "CSV, Excel"
- Style: Solid blue button
- Action: Opens enhanced upload modal

**Button B: "Connect Data Source"**
- Icon: Plug
- Subtext: "Database, Apps"
- Style: Outline blue button
- Action: Opens data source connection wizard

**Status Tracking:**
- **No data**: Both buttons visible, card pulsing
- **Has datasets or connections**: Shows "✓ 3 datasets • 2 connections", green border, both buttons change to "Add More"
- **Completion**: Unlocks Card 2

---

**Card 2: Create an AI Agent** 🤖

**Visual Design:**
- Icon: Robot (locked/grayed if no data)
- Title: "2. Create an AI Agent"
- Description: "Build an intelligent assistant to analyze your data"

**States:**
- **No data yet**: Grayed out, shows "Complete step 1 first" message
- **Has data, no agents**: Blue "Create Agent" button → opens wizard with dataset pre-selected
- **Has agents**: Shows "✓ 5 agents created", green border, button becomes "Create Another"

**Completion**: Unlocks Card 3

---

**Card 3: Start Chatting** 💬

**Visual Design:**
- Icon: Chat bubbles (locked/grayed if no agents)
- Title: "3. Start Chatting"
- Description: "Ask your AI agent questions about your data"

**States:**
- **No agents yet**: Grayed out, "Create an agent first"
- **Has agents**: Blue "Start Chatting" button → opens chat page with most recent agent selected
- **Has chat history**: Shows "✓ 12 conversations", green border

---

**Card Design Specs:**
- Height: 200px
- Border-radius: 12px
- Box-shadow: Subtle elevation
- Connecting arrows: SVG arrows between cards showing flow
- Pulse animation: Gentle scale animation on active card
- Mobile: Stack vertically, arrows point down instead of right

---

### Part 3: Enhanced File Upload Modal

**Current State → Improved State:**

**Before:**
- Simple file input button
- No validation
- No preview
- Generic success message

**After: Drag-and-Drop Upload**

**Step 1: Drop Zone**
```
┌─────────────────────────────────────────┐
│   🌥️ (large cloud upload icon)           │
│                                         │
│   Drag & drop your CSV or Excel file   │
│   here, or click to browse              │
│                                         │
│   Supported: .csv, .xlsx, .xls         │
│   Max size: 50MB                        │
└─────────────────────────────────────────┘
```

**Step 2: File Preview (after drop/select)**
```
✓ revenue_2024.csv (1.2 MB)

Preview (first 5 rows):
┌──────┬─────────┬──────────┐
│ Date │ Revenue │ Region   │
├──────┼─────────┼──────────┤
│ 1/1  │ $5,200  │ West     │
│ 1/2  │ $6,100  │ East     │
│ ...  │ ...     │ ...      │
└──────┴─────────┴──────────┘

Dataset Name: [Revenue 2024        ]
Description:  [Uploaded on Nov 7 2025 • 365 rows • 3 columns]

[Cancel]  [Upload Dataset →]
```

**Step 3: Upload Progress**
```
Uploading revenue_2024.csv...
[████████░░░░░░░░] 65%
About 5 seconds remaining...
```

**Step 4: Success + Next Action**
```
✓ Dataset uploaded successfully!

What would you like to do next?

[→ Create Agent to Analyze This Data] (recommended)
[Upload Another Dataset]
[View Data Preview]
```

**Validation Rules:**
- File type: .csv, .xlsx, .xls only
- File size: Warn at 50MB, block at 100MB
- CSV parsing: Detect delimiter, encoding
- Row limit: Warn if > 1M rows

---

### Part 4: Data Source Connection Wizard

**Wizard Structure:** 3 steps (similar to Agent Wizard)

**Step 1: Choose Data Source**

Template selector with 5 connector types:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ PostgreSQL  │ │Google Sheets│ │  Salesforce │
│     🗄️      │ │     📊      │ │     ☁️      │
│ Connect to  │ │ Sync sheets │ │ Import CRM  │
│ database    │ │ automatically│ │ data        │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│  REST API   │ │ File Upload │
│     🔌      │ │     📁      │
│ Custom API  │ │ One-time CSV│
│ endpoint    │ │ import      │
└─────────────┘ └─────────────┘
```

**Step 2: Connection Details** (dynamic based on source type)

**For PostgreSQL/MySQL:**
```
Connection Details

Host:     [localhost             ]
Port:     [5432                  ]
Database: [mydb                  ]
Username: [postgres              ]
Password: [••••••••              ] 👁️

[Test Connection]  (shows green ✓ or red ✗)
```

**For Google Sheets:**
```
Google Sheets Connection

[🔵 Connect with Google Account]

After connecting, you'll select which sheets to sync.
```

**For REST API:**
```
API Configuration

Endpoint URL: [https://api.example.com/data]
Auth Type:    [Bearer Token ▼]
API Key:      [sk-...                     ]

Headers (optional):
Content-Type: application/json

[Test Connection]
```

**Step 3: Sync Configuration**

```
Sync Settings

Sync Frequency:
○ Manual (on-demand only)
● Hourly (recommended)
○ Daily
○ Real-time (enterprise)

Initial Import:
☑ Import all historical data (estimated: 10,000 rows)

Data Preview:
┌───────────────────────────────┐
│ Detected columns:             │
│ • id (integer)                │
│ • name (string)               │
│ • created_at (timestamp)      │
└───────────────────────────────┘

[Cancel]  [Start Syncing →]
```

**Post-Connection Behavior:**
- Shows real-time sync progress
- Creates dataset automatically when sync completes
- Returns to Dashboard with Card 1 marked complete (green ✓)
- Card 2 (Create Agent) becomes active

---

## Technical Architecture

**Components to Create:**

1. **Quick Start Cards:**
   - `QuickStartSection.js` - Container for 3 cards
   - `QuickStartCard.js` - Reusable card component
   - Tracks progress in localStorage: `quickstart_progress`

2. **Enhanced Upload:**
   - `FileDropZone.js` - Drag-and-drop component
   - `FilePreviewTable.js` - Show first 5 rows
   - `UploadProgress.js` - Progress bar with percentage
   - `UploadSuccessModal.js` - Post-upload actions

3. **Data Source Wizard:**
   - `DataSourceWizard.js` - Main wizard container
   - `ConnectorSelector.js` - Step 1: Choose source type
   - `ConnectionForm.js` - Step 2: Dynamic form per source
   - `SyncConfiguration.js` - Step 3: Sync settings
   - `ConnectionTest.js` - Reusable test connection component

4. **Menu Enhancements:**
   - Modify `Layout.js` to add tooltip descriptions to nav items
   - Add `description` field to each nav item object

**State Management:**
- Quick Start progress stored in localStorage
- Completion state derived from: `datasets.length > 0`, `agents.length > 0`, `chatSessions.length > 0`
- Progress persists across sessions

**API Requirements:**
- Existing: `POST /api/v1/datasets/ingest` (file upload)
- Existing: `POST /api/v1/data_sources` (create connection)
- New: `POST /api/v1/data_sources/test` (test connection before saving)
- New: `GET /api/v1/data_sources/{id}/sync/status` (poll sync progress)

---

## Design Complete

This design provides:
- ✅ Clear starting point (Dashboard Quick Start cards)
- ✅ Guided 3-step journey (Data → Agent → Chat)
- ✅ Two equal paths for data (Upload or Connect)
- ✅ Menu clarity (tooltips explain everything)
- ✅ Progress tracking (visual indicators and completion states)
- ✅ Sequential unlocking (can't skip steps)

**Ready to proceed with:**
1. Writing this design document to `docs/plans/2025-11-07-navigation-onboarding-design.md` ✓ (done)
2. Creating detailed implementation plan in `docs/plans/2025-11-07-navigation-onboarding-implementation.md`

Should I proceed with creating the implementation plan?
