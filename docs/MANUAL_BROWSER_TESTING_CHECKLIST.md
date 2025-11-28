# Manual Browser Testing Checklist

## Test Environment
- **URL**: https://agentprovision.com
- **Credentials**: test@example.com / password
- **Date**: 2025-11-28

---

## ✅ Critical User Flows

### 1. Authentication Flow
- [ ] Navigate to https://agentprovision.com
- [ ] Click "Login" or navigate to /login
- [ ] Enter credentials: test@example.com / password
- [ ] Click "Login" button
- [ ] **Expected**: Redirect to /dashboard
- [ ] **Verify**: User is logged in and can see dashboard

### 2. Agent Creation with Claude 4.5
- [ ] Navigate to /agents
- [ ] Click "Create Agent" button in header
- [ ] **Verify**: Modal appears with "Create New Agent" title
- [ ] Fill in form:
  - Name: "Test Agent Claude 4.5"
  - Model: Select "Claude 4.5 Sonnet" from dropdown
  - Description: "Testing new model"
  - System Prompt: "You are a helpful assistant"
- [ ] **Verify**: "Claude 4.5 Opus" option is visible in dropdown
- [ ] **Verify**: "Claude 4.5 Sonnet" option is visible in dropdown
- [ ] Click "Create Agent" button
- [ ] **Expected**: Agent is created and appears in the list
- [ ] **Verify**: New agent shows "claude-4-5-sonnet" badge

### 3. Dataset Management
- [ ] Navigate to /datasets
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: Existing datasets are displayed
- [ ] Click "Upload Dataset" button (if available)
- [ ] **Verify**: Upload modal or wizard appears
- [ ] Close modal/wizard
- [ ] **Verify**: Can navigate back to datasets list

### 4. Chat Session Creation
- [ ] Navigate to /chat
- [ ] Click "New session" button
- [ ] **Verify**: Modal appears with agent kit and dataset dropdowns
- [ ] Select an agent kit from dropdown
- [ ] Select a dataset from dropdown
- [ ] Click "Start Session" or "Create session"
- [ ] **Expected**: Modal closes and chat interface appears
- [ ] Type "Hello" in the chat input
- [ ] Press Enter or click Send
- [ ] **Verify**: Message is sent
- [ ] **Verify**: Response is received from agent

### 5. LLM Settings Page
- [ ] Navigate to /llm-settings
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: LLM providers are displayed (OpenAI, Anthropic, etc.)
- [ ] **Verify**: Can see API key input fields
- [ ] **Verify**: Can see "Save" buttons for each provider

### 6. Dashboard Analytics
- [ ] Navigate to /dashboard
- [ ] **Verify**: Dashboard loads without errors
- [ ] **Verify**: Statistics cards are displayed
- [ ] **Verify**: Recent activity or charts are visible
- [ ] **Verify**: Quick actions are available

### 7. Agent Wizard Flow
- [ ] Navigate to /agents
- [ ] Click "Create Agent" button (main one, not quick form)
- [ ] **Verify**: Wizard interface appears
- [ ] Step through wizard:
  - Step 1: Basic Info
  - Step 2: Personality/Model selection
  - Step 3: Tools/Skills
  - Step 4: Datasets
  - Step 5: Review
- [ ] **Verify**: Can navigate back and forth between steps
- [ ] **Verify**: Claude 4.5 models appear in model selection
- [ ] Complete wizard
- [ ] **Verify**: Agent is created successfully

### 8. Databricks Integration Status
- [ ] Navigate to /settings
- [ ] Scroll to "Databricks Integration" section
- [ ] **Verify**: MCP Server connection status is displayed
- [ ] **Verify**: Unity Catalog status is shown
- [ ] **Verify**: Available capabilities are listed

### 9. Branding Customization
- [ ] Navigate to /branding
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: Can see company name input
- [ ] **Verify**: Can see logo URL input
- [ ] **Verify**: Can see color pickers
- [ ] **Verify**: Can see AI assistant name input

### 10. Memory & Knowledge Graph
- [ ] Navigate to /memory
- [ ] **Verify**: Page loads without errors
- [ ] **Verify**: Can see entities or knowledge items
- [ ] **Verify**: Search functionality works

---

## 🐛 Known Issues to Check

### Issue 1: Modal Not Closing
- **Location**: /agents - Create Agent modal
- **Steps**: Create an agent and submit
- **Expected**: Modal should close automatically
- **Check**: Does modal close or stay open?

### Issue 2: Enter Key in Chat
- **Location**: /chat
- **Steps**: Type message and press Enter
- **Expected**: Message should send
- **Check**: Does Enter key work or need to click Send button?

### Issue 3: Agent Kit Auto-Creation
- **Location**: /agents and /chat
- **Steps**: Create a new agent, then go to chat
- **Expected**: New agent should appear in agent kit dropdown
- **Check**: Is the agent immediately available for chat?

---

## 📸 Screenshots to Capture

1. **Claude 4.5 in Dropdown**: Screenshot of model dropdown showing both Claude 4.5 options
2. **Agent Created**: Screenshot of agents list with newly created Claude 4.5 agent
3. **Chat Interface**: Screenshot of active chat session
4. **Dashboard**: Screenshot of main dashboard
5. **LLM Settings**: Screenshot of LLM providers page

---

## ✅ Test Results

### Tester: _______________
### Date: _______________
### Browser: _______________
### Pass Rate: _____ / 10 flows

### Notes:
```
[Add any observations, bugs found, or improvements needed]
```

---

## 🔄 Regression Testing

After any deployment, verify these critical paths:
1. Login → Dashboard
2. Create Agent with Claude 4.5
3. Create Chat Session
4. Send Message in Chat
5. View Analytics

**All 5 paths must work for deployment to be considered successful.**
