# Agent Creation Wizard - Design Document

**Date**: 2025-11-07
**Status**: Design Complete
**Feature**: Agent Creation Wizard for Non-Technical Users

---

## Executive Summary

Transform the current single-modal agent creation form into a guided 5-step wizard that simplifies agent creation for non-technical users. The wizard uses templates, plain-language controls, and smart defaults while maintaining an escape hatch for experienced users who prefer the quick form.

---

## Goals

### Primary Goals
1. **Lower barrier to entry** - Non-technical users can create functional agents without understanding temperature, tokens, or system prompts
2. **Guide decision-making** - Templates and presets help users make good choices without overwhelming options
3. **Progressive disclosure** - Show simple defaults first, reveal advanced options only when needed
4. **Preserve speed** - Experienced users can bypass wizard with "quick form" escape hatch

### Success Metrics
- Reduced time-to-first-agent for new users
- Increased agent creation completion rate
- Reduced support questions about agent configuration

---

## User Personas

### Primary: Business User (Non-Technical)
- **Needs**: Create an agent to help with specific business task (support, data analysis, sales)
- **Pain**: Current form has technical jargon (temperature, max_tokens, system prompts)
- **Goal**: Get working agent quickly with sensible defaults

### Secondary: Power User (Technical)
- **Needs**: Quick agent creation with full control
- **Pain**: Multi-step wizards slow them down
- **Goal**: Fast access to all configuration options

---

## Architecture Overview

### Entry Points

**Primary Path** (Default):
```
"Create Agent" button → 5-Step Wizard → Agent Created
```

**Secondary Path** (Escape Hatch):
```
"Use quick form instead" link → Current Modal → Agent Created
```

### Wizard Structure

```
[Progress Stepper: 1 → 2 → 3 → 4 → 5]

Step 1: Choose Template
Step 2: Basic Information
Step 3: Personality & Behavior
Step 4: Skills & Data
Step 5: Review & Launch

[Back] [Save Draft] [Next/Create]
```

---

## Step-by-Step Design

### Step 1: Choose Template

**Purpose**: Give users a starting point based on common use cases

**Layout**:
- Heading: "What type of agent do you want to create?"
- Template cards in 2-column grid (3 rows on desktop)
- Subtle link at bottom: "Or start from one of your saved agent kits →"

**Built-in Templates** (5 options):

1. **Customer Support Agent** 🎧
   - Description: "Helpful and patient. Perfect for handling customer inquiries and FAQs"
   - Pre-config:
     - Personality: Formal & Professional
     - Temperature: 0.5
     - Max tokens: 1500
     - Tools: None (conversational only)
     - System prompt: "You are a helpful customer support agent..."

2. **Data Analyst Agent** 📊
   - Description: "Analytical and precise. Generates insights from your data using SQL queries"
   - Pre-config:
     - Personality: Formal & Professional
     - Temperature: 0.3
     - Max tokens: 2500
     - Tools: SQL Query ✓, Data Summary ✓
     - Prompts user to select datasets in Step 4

3. **Sales Assistant** 🤝
   - Description: "Persuasive and knowledgeable. Helps with product info and sales support"
   - Pre-config:
     - Personality: Friendly & Conversational
     - Temperature: 0.6
     - Max tokens: 2000
     - Tools: Calculator ✓
     - System prompt: "You are a knowledgeable sales assistant..."

4. **General Assistant** 🤖
   - Description: "Balanced and versatile. Good for general questions and tasks"
   - Pre-config:
     - Personality: Friendly & Conversational
     - Temperature: 0.7
     - Max tokens: 2000
     - Tools: Calculator ✓, Data Summary ✓
     - System prompt: "You are a helpful AI assistant..."

5. **Content Writer** ✍️
   - Description: "Creative and expressive. Helps draft content, emails, and documents"
   - Pre-config:
     - Personality: Creative & Expressive
     - Temperature: 0.8
     - Max tokens: 3000
     - Tools: None
     - System prompt: "You are a creative writing assistant..."

**Template Card Design**:
- Large icon (48px)
- Template name (heading)
- 2-line description
- "Select" button
- Hover state shows: "Includes: [tools], [personality]"

**Agent Kit Integration**:
- Link at bottom: "Or start from one of your saved agent kits →"
- Opens modal showing user's agent kits as cards
- Selecting kit pre-fills all wizard steps with kit configuration

**Validation**: Must select a template to proceed

---

### Step 2: Basic Information

**Purpose**: Capture agent identity and purpose

**Layout**: Single column form

**Fields**:

1. **Name*** (required)
   - Input type: Text
   - Placeholder: "e.g., Support Bot, Sales Assistant Sally"
   - Validation: 3-50 characters, required
   - Help text: "Give your agent a memorable name"

2. **Description** (optional)
   - Input type: Textarea (3 rows)
   - Placeholder: "What will this agent help with?"
   - Validation: Max 500 characters
   - Help text: "Briefly describe your agent's purpose"

3. **Avatar/Icon** (optional)
   - Input type: Icon picker or emoji selector
   - Default: Template's icon
   - Options: 20-30 preset icons + emoji picker
   - Help text: "Choose a visual identity for your agent"

**Pre-fill**: Name field pre-filled with template name (e.g., "Customer Support Agent"), user can edit

**Validation**: Name required before proceeding

---

### Step 3: Personality & Behavior

**Purpose**: Configure communication style without technical jargon

**Layout**: Two sections (primary presets, collapsible advanced)

**Section A: Personality Presets** (Primary)

Heading: "How should your agent communicate?"

Radio button cards (single selection):

1. **🎩 Formal & Professional**
   - Label: "Formal & Professional"
   - Description: "Precise, structured responses. Best for business contexts"
   - Maps to: `temperature: 0.4`, system prompt emphasis on professionalism

2. **💬 Friendly & Conversational**
   - Label: "Friendly & Conversational"
   - Description: "Warm, approachable tone. Great for customer interactions"
   - Maps to: `temperature: 0.7`, system prompt emphasis on friendliness

3. **✨ Creative & Expressive**
   - Label: "Creative & Expressive"
   - Description: "Imaginative, colorful language. Perfect for content creation"
   - Maps to: `temperature: 0.9`, system prompt emphasis on creativity

**Pre-select**: Based on template choice from Step 1

**Section B: Fine-tune Settings** (Collapsible)

Toggle/accordion: "Advanced: Fine-tune settings"

When expanded:

1. **Response Style** slider
   - Label: "Response Style"
   - Range: Precise (0.0) ↔ Creative (1.0)
   - Visual: Slider with emoji indicators 🎯 ↔ 🎨
   - Default: Based on personality preset
   - Maps to: `temperature` value

2. **Response Length** slider
   - Label: "Response Length"
   - Range: Concise (500) ↔ Detailed (4000)
   - Visual: Slider with text indicators
   - Default: Based on template
   - Maps to: `max_tokens` value

3. **Custom System Prompt** (textarea, optional)
   - Label: "System Prompt Override (Advanced)"
   - Placeholder: "You are a helpful assistant that..."
   - Validation: Max 2000 characters
   - Help text: "Override the default system prompt for this agent"

**Behavior**: Selecting a preset auto-adjusts the sliders. Manually adjusting sliders shows "(Custom)" badge on preset.

---

### Step 4: Skills & Data

**Purpose**: Configure agent capabilities and data access

**Layout**: Two sections (Skills, Datasets)

**Section A: Skills**

Heading: "What can your agent do?"

Info box (contextual based on template):
- "Data Analysts typically need these tools to analyze information"
- "Customer support agents work best with conversational skills"

**Tool Selection** (toggle switches with descriptions):

Available tools from `ToolRegistry`:

1. **SQL Query Tool**
   - Icon: 📊
   - Label: "SQL Query Tool"
   - Description: "Query and analyze datasets with SQL"
   - Default: ✓ for Data Analyst, ☐ for others
   - Requires: At least one dataset connected

2. **Data Summary Tool**
   - Icon: 📈
   - Label: "Data Summary Tool"
   - Description: "Generate statistical summaries of data"
   - Default: ✓ for Data Analyst & General Assistant, ☐ for others

3. **Calculator Tool**
   - Icon: 🧮
   - Label: "Calculator Tool"
   - Description: "Perform mathematical calculations"
   - Default: ✓ for Sales & General Assistant, ☐ for others

**Layout**: Each tool as card with toggle, icon, name, description

**Section B: Datasets** (Optional)

Heading: "Connect datasets (optional)"

Subheading: "Give your agent access to specific data for analysis"

**When no datasets exist**:
- Empty state: "No datasets uploaded yet"
- CTA: "Upload your first dataset →" (links to datasets page)

**When datasets exist**:
- Dataset cards in grid (2-3 per row)
- Each card shows:
  - Dataset name
  - Row count: "1,234 rows"
  - Column preview: "5 columns: id, name, revenue..."
  - Checkbox to select

**Skip option**: "Skip - no datasets needed" button

**Smart defaults**:
- Data Analyst template: Prompts to select at least one dataset
- Other templates: Datasets optional

**Validation**:
- If SQL Query Tool enabled, require at least one dataset
- Show warning if no datasets selected for Data Analyst template

---

### Step 5: Review & Launch

**Purpose**: Final review and testing before creation

**Layout**: Two-column (Summary left, Test right on desktop; stacked on mobile)

**Left Column: Summary Panel**

Heading: "Review your agent"

Display all configured settings:

1. **Template** (with icon)
   - Shows selected template name and icon
   - "(Customized)" badge if settings changed from template

2. **Basic Info**
   - Name
   - Description
   - Avatar/icon preview

3. **Personality**
   - Preset name (e.g., "Friendly & Conversational")
   - If custom: Shows temperature and max_tokens values

4. **Skills**
   - List of enabled tools with icons
   - "No special tools" if none selected

5. **Datasets**
   - Count + names (e.g., "3 datasets: Revenue 2024, Customer List, Product Catalog")
   - "No datasets connected" if none

**Edit links**: Each section has small "Edit" link to jump back to that step

**Right Column: Test Chat** (Optional but Recommended)

Heading: "Test your agent"

Subheading: "Try it out before creating"

**Mini chat interface**:
- Input field: "Ask your agent a question..."
- Send button
- Chat display area (max 5 messages for preview)
- Uses configured settings in preview mode (doesn't save conversation)

**Suggested prompts** (based on template):
- Data Analyst: "What's in my datasets?"
- Customer Support: "How can you help me?"
- Sales: "Tell me about your capabilities"

**Bottom Actions**:

1. **Primary**: "Create Agent" button (large, prominent)
2. **Secondary**: "Back to Edit" link
3. **Tertiary**: "Save as Draft" (saves to localStorage, can resume later)

**On Create**:
- Show loading state: "Creating your agent..."
- Call API to create agent with all configured settings
- On success: Redirect to agents list with success toast
- On error: Show error message, allow retry

---

## Technical Implementation

### Frontend Components

**New Components**:
1. `AgentWizard.js` - Main wizard container
2. `WizardStepper.js` - Progress indicator
3. `TemplateSelector.js` - Step 1 template cards
4. `PersonalityPresets.js` - Step 3 preset selector
5. `ToolSelector.js` - Step 4 tools configuration
6. `DatasetSelector.js` - Step 4 dataset selection
7. `AgentReview.js` - Step 5 summary
8. `AgentTestChat.js` - Step 5 test interface

**Existing Components** (reuse):
- Form controls from React Bootstrap
- `EmptyState` for no datasets state
- Modal for agent kit selection

**State Management**:
```javascript
const [wizardState, setWizardState] = useState({
  currentStep: 1,
  template: null,
  basicInfo: { name: '', description: '', avatar: '' },
  personality: { preset: 'friendly', temperature: 0.7, max_tokens: 2000, system_prompt: '' },
  skills: { sql_query: false, data_summary: false, calculator: false },
  datasets: [],
  isDraft: false,
});
```

**LocalStorage Draft**:
- Auto-save wizard state to localStorage on each step
- Key: `agent_wizard_draft_${tenantId}`
- On wizard mount, check for draft and prompt user to resume

### Backend Changes

**Minimal backend changes required**:
- Agent creation API already exists (`POST /api/v1/agents`)
- Existing agent model supports all needed fields (name, description, config JSON)

**Config JSON structure**:
```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 2000,
  "system_prompt": "You are a helpful assistant...",
  "personality_preset": "friendly",
  "template_used": "customer_support",
  "tools": ["calculator", "data_summary"],
  "datasets": ["uuid1", "uuid2"]
}
```

**Agent-Dataset Relationship**:
- Store dataset UUIDs in agent config JSON
- No new database tables needed
- Tools use dataset references from config when executing

### Routing

**New route**:
- `/dashboard/agents/wizard` - Agent wizard page
- `/dashboard/agents/wizard/resume` - Resume from draft

**Modified behavior**:
- "Create Agent" button → Navigate to `/dashboard/agents/wizard`
- "Use quick form instead" → Open existing modal (current behavior)

---

## User Experience Flow

### Happy Path (First-time user creating Data Analyst agent)

1. **Landing**: User clicks "Create Agent" on Agents page
2. **Step 1**: Sees 5 template cards, reads descriptions, selects "Data Analyst Agent"
3. **Step 2**: Edits pre-filled name to "Sales Data Analyzer", adds description
4. **Step 3**: Sees "Formal & Professional" pre-selected (from template), keeps it
5. **Step 4**: Sees SQL Query + Data Summary tools pre-enabled, selects "Revenue 2024" dataset
6. **Step 5**: Reviews summary, tests with "What's the total revenue?", sees results, clicks "Create Agent"
7. **Success**: Redirected to agents list, sees new agent with success toast

**Time estimate**: 2-3 minutes (vs 5-10 minutes figuring out current form)

### Alternative Path (Power user using escape hatch)

1. **Landing**: User clicks "Create Agent"
2. **Escape**: Immediately clicks "Use quick form instead"
3. **Quick form**: Fills out modal with all technical details in 30 seconds
4. **Create**: Submits form, agent created

**Time estimate**: 30-60 seconds (same as current flow)

### Error Scenarios

**Validation errors**:
- Step 2: Name too short → Inline error, can't proceed
- Step 4: SQL tool enabled but no dataset → Warning message, can override

**API errors**:
- Network error on create → Show error toast, allow retry
- Server error → Show error message with details

**Draft recovery**:
- Browser crash during wizard → On return, prompt "Resume your draft?" with preview

---

## Design Principles Applied

### YAGNI (You Aren't Gonna Need It)
- No model selection dropdown (templates choose model)
- No advanced scheduling/deployment in wizard (separate feature)
- No team permissions in wizard (handled elsewhere)

### Progressive Disclosure
- Simple presets shown first, advanced sliders hidden
- Templates hide complexity of system prompts
- Fine-tune options in collapsible sections

### Smart Defaults
- Templates pre-configure all settings intelligently
- Most users never need to touch advanced settings
- Validation prevents common mistakes

### Escape Hatches
- Quick form for power users
- Advanced toggles for fine-tuning
- Edit links in review step

---

## Success Criteria

### User Metrics
- **Primary**: 80%+ wizard completion rate (vs ~50% current form)
- **Secondary**: Average time-to-first-agent reduced by 40%
- **Tertiary**: <10% of users use escape hatch (most prefer wizard)

### Technical Metrics
- No performance degradation (wizard loads in <1s)
- Draft recovery works 100% of time
- Zero data loss during wizard navigation

### Business Metrics
- Reduced support tickets about agent configuration
- Increased daily active agents created
- Higher user satisfaction scores

---

## Future Enhancements (Out of Scope)

1. **More templates**: Industry-specific templates (Healthcare, Finance, Legal)
2. **Template marketplace**: Users share/download community templates
3. **Agent testing suite**: More robust testing before deployment
4. **Guided tutorials**: Interactive onboarding for first agent
5. **Version history**: Track changes to agent configuration over time
6. **A/B testing**: Test different agent configs automatically
7. **Collaboration**: Multiple users edit same agent draft

---

## Appendix: Template System Prompt Examples

### Customer Support Agent
```
You are a helpful and patient customer support agent. Your goal is to assist users with their questions and concerns in a professional and friendly manner.

Guidelines:
- Always be polite and empathetic
- Ask clarifying questions when needed
- Provide clear, actionable solutions
- If you don't know the answer, admit it and offer to escalate
- Keep responses concise but thorough
```

### Data Analyst Agent
```
You are a precise and analytical data analyst. Your goal is to help users understand their data through SQL queries and statistical analysis.

Guidelines:
- Use SQL Query Tool to extract insights from datasets
- Present findings with clear numbers and context
- Use Data Summary Tool for statistical overviews
- Explain technical concepts in simple terms
- Always cite data sources in your analysis
```

### Sales Assistant Agent
```
You are a knowledgeable and persuasive sales assistant. Your goal is to help users with product information and support sales conversations.

Guidelines:
- Be enthusiastic but not pushy
- Highlight product benefits clearly
- Use Calculator Tool for pricing and quotes
- Answer objections with confidence
- Focus on customer needs and solutions
```

---

**End of Design Document**
