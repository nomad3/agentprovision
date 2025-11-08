# Agent Creation Wizard UX/UI Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve wizard usability by fixing error handling, enhancing validation feedback, simplifying navigation, and ensuring all user flows work seamlessly for non-technical users.

**Architecture:** Refactor error handling to use Toast notifications instead of alerts, improve inline validation with better visual feedback, add progress indicators, fix navigation edge cases, and enhance accessibility.

**Tech Stack:** React 18, React Bootstrap, existing Toast component system, React Router v7

---

## UX Issues Identified

### Critical Issues:
1. **Error handling uses browser `alert()`** - jarring, not user-friendly
2. **401 Unauthorized errors** - no user feedback when auth fails
3. **No loading states** - users don't know datasets are loading in step 4
4. **Validation only on Next click** - users can't see errors until they try to proceed
5. **No success confirmation** - `alert()` for success message is poor UX
6. **Next button always enabled** - should be disabled when validation fails

### Minor Issues:
7. **Template auto-fills name** - users might not realize they can/should customize it
8. **No "Skip" option** - users forced through all steps even if using defaults
9. **Cancel confirmation** - loses draft, should clarify auto-save behavior
10. **No keyboard navigation** - Enter key doesn't advance, Esc doesn't cancel
11. **Mobile responsiveness** - stepper might overflow on small screens

---

## Task 1: Replace alert() with Toast Notifications

**Files:**
- Modify: `apps/web/src/components/wizard/AgentWizard.js`
- Test: Manual verification

**Step 1: Import Toast hook**

Modify `apps/web/src/components/wizard/AgentWizard.js`:

```javascript
// Add to imports
import { useToast } from '../common/Toast';
```

**Step 2: Add toast hook in component**

Add after state declarations:

```javascript
const AgentWizard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast(); // Add this
  // ... existing state
```

**Step 3: Replace all alert() calls with showToast()**

Replace validation alerts in `handleNext`:

```javascript
const handleNext = () => {
  // Validate current step
  if (currentStep === 1 && !wizardData.template) {
    showToast('Please select a template to continue', 'warning');
    return;
  }

  if (currentStep === 2) {
    if (!wizardData.basicInfo.name || wizardData.basicInfo.name.length < 3) {
      showToast('Please enter a valid agent name (at least 3 characters)', 'warning');
      return;
    }
  }

  if (currentStep < STEPS.length) {
    setCurrentStep(currentStep + 1);
  }
};
```

Replace error alert in `handleCreate`:

```javascript
const handleCreate = async () => {
  try {
    setCreating(true);

    // ... existing create logic ...

    await agentService.create(agentData);

    localStorage.removeItem(DRAFT_KEY);

    // Show success toast before navigation
    showToast('Agent created successfully!', 'success');

    // Navigate after brief delay so toast is visible
    setTimeout(() => {
      navigate('/agents');
    }, 500);
  } catch (error) {
    console.error('Error creating agent:', error);

    // Better error messages based on status
    if (error.response?.status === 401) {
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => navigate('/login'), 1500);
    } else if (error.response?.status === 400) {
      showToast(`Invalid data: ${error.response.data.detail || 'Please check your inputs'}`, 'error');
    } else {
      showToast('Failed to create agent. Please try again.', 'error');
    }
  } finally {
    setCreating(false);
  }
};
```

**Step 4: Update cancel confirmation**

```javascript
const handleCancel = () => {
  if (window.confirm('Cancel wizard? Your progress is auto-saved and you can resume later.')) {
    // Keep draft for resume
    navigate('/agents');
  }
};
```

**Step 5: Manual test**

1. Try to click Next without selecting template → should show warning toast
2. Try to create agent with auth error → should show error toast
3. Successfully create agent → should show success toast

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/AgentWizard.js
git commit -m "fix: replace alert() with toast notifications in wizard

- Use Toast component for all user feedback
- Add context-specific error messages (401, 400, etc)
- Improve success feedback with toast before navigation
- Update cancel dialog to clarify auto-save behavior

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add Real-time Inline Validation

**Files:**
- Modify: `apps/web/src/components/wizard/BasicInfoStep.js`
- Modify: `apps/web/src/components/wizard/AgentWizard.js`

**Step 1: Add validation state to BasicInfoStep**

Modify `apps/web/src/components/wizard/BasicInfoStep.js`:

```javascript
const BasicInfoStep = ({ data, onChange, onValidationChange }) => {
  const [validation, setValidation] = useState({
    name: true,
    isValid: false
  });

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange(updated);

    // Validate name
    if (field === 'name') {
      const isValidName = value.length >= 3 && value.length <= 50;
      const newValidation = { ...validation, name: isValidName, isValid: isValidName };
      setValidation(newValidation);

      // Notify parent of validation state
      if (onValidationChange) {
        onValidationChange(newValidation.isValid);
      }
    }
  };

  // Validate on mount
  useEffect(() => {
    const isValidName = data.name.length >= 3 && data.name.length <= 50;
    const newValidation = { name: isValidName, isValid: isValidName };
    setValidation(newValidation);
    if (onValidationChange) {
      onValidationChange(newValidation.isValid);
    }
  }, []);

  // ... rest of component
```

**Step 2: Add validation state to AgentWizard**

Modify `apps/web/src/components/wizard/AgentWizard.js`:

```javascript
const [validationState, setValidationState] = useState({
  step1: false, // Template selected
  step2: false, // Basic info valid
  step3: true,  // Always valid (has defaults)
  step4: true,  // Always valid (optional)
  step5: true,  // Review step
});
```

**Step 3: Update BasicInfoStep to report validation**

```javascript
{currentStep === 2 && (
  <BasicInfoStep
    data={wizardData.basicInfo}
    onChange={(basicInfo) => updateWizardData({ basicInfo })}
    onValidationChange={(isValid) => {
      setValidationState({ ...validationState, step2: isValid });
    }}
  />
)}
```

**Step 4: Disable Next button when invalid**

```javascript
{currentStep < STEPS.length && (
  <Button
    variant="primary"
    onClick={handleNext}
    disabled={!validationState[`step${currentStep}`]}
  >
    Next
  </Button>
)}
```

**Step 5: Update template selection to update validation**

```javascript
{currentStep === 1 && (
  <TemplateSelector
    onSelect={(template) => {
      updateWizardData({
        // ... existing code ...
      });
      setValidationState({ ...validationState, step1: true });
    }}
    selectedTemplate={wizardData.template?.id}
  />
)}
```

**Step 6: Test validation flow**

1. Open wizard → Next button should be disabled
2. Select template → Next button should enable
3. Go to step 2 → Next disabled until name is valid
4. Enter 2 chars → Next stays disabled
5. Enter 3+ chars → Next enables

**Step 7: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add real-time inline validation with disabled Next button

- Add validation state tracking per step
- Disable Next button when current step is invalid
- Add onValidationChange callback to BasicInfoStep
- Update validation on template selection
- Provide immediate feedback to users

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Add Loading States and Skeleton UI

**Files:**
- Modify: `apps/web/src/components/wizard/SkillsDataStep.js`
- Modify: `apps/web/src/components/wizard/AgentWizard.js`

**Step 1: Add skeleton loader for datasets**

Modify `apps/web/src/components/wizard/SkillsDataStep.js`:

Replace `<LoadingSpinner text="Loading datasets..." />` with better skeleton:

```javascript
{loading ? (
  <div className="skeleton-loader">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="mb-2" style={{ border: '1px solid #dee2e6' }}>
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="skeleton-text" style={{ width: '60%', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
            <div className="skeleton-text" style={{ width: '20%', height: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}></div>
          </div>
        </Card.Body>
      </Card>
    ))}
  </div>
) : datasets.length === 0 ? (
  // ... existing empty state
```

**Step 2: Add loading indicator when changing steps**

Modify `apps/web/src/components/wizard/AgentWizard.js`:

```javascript
const [stepLoading, setStepLoading] = useState(false);

const handleNext = () => {
  // ... existing validation ...

  setStepLoading(true);
  setTimeout(() => {
    setCurrentStep(currentStep + 1);
    setStepLoading(false);
  }, 150); // Brief transition effect
};
```

**Step 3: Show loading overlay during step transition**

```javascript
<div className="wizard-content mt-4" style={{ position: 'relative' }}>
  {stepLoading && (
    <div className="step-loading-overlay">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )}

  {/* ... existing step content ... */}
</div>
```

**Step 4: Add CSS for loading overlay**

Append to `apps/web/src/components/wizard/AgentWizard.css`:

```css
.step-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.skeleton-text {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Step 5: Test loading states**

1. Navigate between steps → should see brief loading transition
2. Open step 4 → should see skeleton while datasets load
3. Verify smooth transitions

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add loading states and skeleton UI

- Add skeleton loader for datasets in step 4
- Add transition loading overlay when changing steps
- Improve perceived performance with smooth transitions
- Add CSS animations for skeleton pulse effect

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Keyboard Navigation Support

**Files:**
- Modify: `apps/web/src/components/wizard/AgentWizard.js`

**Step 1: Add keyboard event handler**

Add useEffect for keyboard handling:

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    // Enter key advances (if valid)
    if (e.key === 'Enter' && !e.shiftKey) {
      if (currentStep === STEPS.length) {
        if (!creating && wizardData.template && wizardData.basicInfo.name) {
          handleCreate();
        }
      } else if (validationState[`step${currentStep}`]) {
        e.preventDefault();
        handleNext();
      }
    }

    // Escape key cancels
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentStep, validationState, creating, wizardData]);
```

**Step 2: Add keyboard hints to UI**

Add below wizard stepper:

```javascript
<WizardStepper currentStep={currentStep} steps={STEPS} />

<div className="text-center mt-2 mb-3">
  <small className="text-muted">
    Press <kbd>Enter</kbd> to continue • <kbd>Esc</kbd> to cancel
  </small>
</div>
```

**Step 3: Add kbd styling**

Append to CSS:

```css
kbd {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 0.85em;
  font-family: monospace;
}
```

**Step 4: Test keyboard navigation**

1. Open wizard
2. Press Enter without selecting template → should show validation toast
3. Select template, press Enter → should advance to step 2
4. Press Esc → should show cancel confirmation
5. Fill name, press Enter → should advance to step 3

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add keyboard navigation support

- Enter key advances to next step (when valid)
- Enter on final step creates agent
- Escape key cancels wizard
- Add keyboard hints below stepper
- Add kbd element styling

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Improve Template Selection UX

**Files:**
- Modify: `apps/web/src/components/wizard/TemplateSelector.js`
- Modify: `apps/web/src/components/wizard/AgentWizard.js`

**Step 1: Add "Start from Scratch" option**

Modify `apps/web/src/components/wizard/TemplateSelector.js`:

Add to TEMPLATES array:

```javascript
const TEMPLATES = [
  {
    id: 'blank',
    name: 'Start from Scratch',
    icon: PlusCircle, // Import from react-bootstrap-icons
    description: 'Build a custom agent with your own settings',
    config: {
      model: 'gpt-4',
      personality: 'friendly',
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: '',
      tools: [],
      suggestDatasets: false,
    },
  },
  // ... existing templates
];
```

**Step 2: Make template cards clickable**

Update template card rendering to select on click:

```javascript
<Card
  className={`template-card h-100 ${isSelected ? 'selected' : ''}`}
  style={{ cursor: 'pointer' }}
  onClick={() => handleSelect(template)}
  role="button"
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(template);
    }
  }}
>
  {/* ... existing card content ... */}
</Card>
```

**Step 3: Auto-advance after template selection**

Modify `apps/web/src/components/wizard/AgentWizard.js`:

```javascript
{currentStep === 1 && (
  <TemplateSelector
    onSelect={(template) => {
      updateWizardData({
        // ... existing code ...
      });
      setValidationState({ ...validationState, step1: true });

      // Auto-advance after brief delay
      setTimeout(() => {
        setCurrentStep(2);
      }, 300);
    }}
    selectedTemplate={wizardData.template?.id}
  />
)}
```

**Step 4: Add visual feedback on selection**

Add CSS for selected state animation:

```css
.template-card.selected {
  border-color: #0d6efd;
  background-color: #f8f9ff;
  animation: template-selected 0.3s ease;
}

@keyframes template-selected {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

**Step 5: Test template flow**

1. Open wizard
2. Click template card → should animate and auto-advance
3. Go back to step 1 → should still show selected template
4. Press Enter on template card → should select and advance

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: improve template selection UX

- Add 'Start from Scratch' blank template option
- Make entire template card clickable and keyboard accessible
- Auto-advance to next step after template selection
- Add selection animation for visual feedback
- Support Enter/Space key selection

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Progress Indicator and Completion Estimate

**Files:**
- Modify: `apps/web/src/components/wizard/WizardStepper.js`
- Modify: `apps/web/src/components/wizard/AgentWizard.css`

**Step 1: Calculate completion percentage**

Modify `apps/web/src/components/wizard/WizardStepper.js`:

```javascript
const WizardStepper = ({ currentStep, steps }) => {
  const completionPercent = Math.round(((currentStep - 1) / steps.length) * 100);

  return (
    <div className="wizard-stepper-container">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          Step {currentStep} of {steps.length}
        </small>
        <small className="text-muted">
          {completionPercent}% complete
        </small>
      </div>

      <div className="progress mb-3" style={{ height: '4px' }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${completionPercent}%` }}
          aria-valuenow={completionPercent}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>

      <div className="wizard-stepper">
        {/* ... existing stepper code ... */}
      </div>
    </div>
  );
};
```

**Step 2: Add smooth progress bar animation**

Add to CSS:

```css
.progress-bar {
  transition: width 0.3s ease;
}
```

**Step 3: Test progress indicator**

1. Open wizard → should show "0% complete"
2. Select template → should show "20% complete"
3. Advance through steps → should update to 40%, 60%, 80%, 100%

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add progress indicator and completion percentage

- Show 'Step X of 5' and percentage complete
- Add progress bar above stepper
- Animate progress bar transitions
- Help users understand how far along they are

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Improve Error Recovery and Field-level Feedback

**Files:**
- Modify: `apps/web/src/components/wizard/BasicInfoStep.js`
- Modify: `apps/web/src/components/wizard/PersonalityStep.js`

**Step 1: Add helper text that updates in real-time**

Modify `apps/web/src/components/wizard/BasicInfoStep.js`:

```javascript
<Form.Group className="mb-4">
  <Form.Label>Name *</Form.Label>
  <Form.Control
    type="text"
    placeholder="e.g., Support Bot, Sales Assistant Sally"
    value={data.name}
    onChange={(e) => handleChange('name', e.target.value)}
    isInvalid={!validation.name && data.name.length > 0}
    isValid={validation.name && data.name.length > 0}
    required
    autoFocus
  />
  {!validation.name && data.name.length > 0 && (
    <Form.Control.Feedback type="invalid">
      Name must be at least 3 characters and no more than 50 characters
    </Form.Control.Feedback>
  )}
  {validation.name && data.name.length > 0 && (
    <Form.Control.Feedback type="valid">
      Great name!
    </Form.Control.Feedback>
  )}
  <Form.Text className="text-muted">
    {data.name.length === 0
      ? 'Give your agent a memorable name (3-50 characters)'
      : `${data.name.length}/50 characters`
    }
  </Form.Text>
</Form.Group>
```

**Step 2: Add autofocus to first field in each step**

Add `autoFocus` prop to first interactive element in each step.

**Step 3: Add character counter animation**

Add CSS:

```css
.form-text {
  transition: color 0.2s ease;
}

.form-control.is-invalid ~ .form-text {
  color: #dc3545 !important;
}

.form-control.is-valid ~ .form-text {
  color: #198754 !important;
}
```

**Step 4: Add helpful placeholder examples**

Update personality step placeholders:

```javascript
<Form.Control
  as="textarea"
  rows={4}
  placeholder="Example: You are a helpful assistant that specializes in customer service. Be empathetic and provide step-by-step solutions."
  value={data.system_prompt}
  onChange={(e) => handlePromptChange(e.target.value)}
  maxLength={2000}
/>
```

**Step 5: Test field-level feedback**

1. Start typing agent name → should show character count
2. Type 2 chars → should show error state (red)
3. Type 3 chars → should show success state (green) with "Great name!"
4. Open personality step → system prompt should have helpful example

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: improve field-level feedback and guidance

- Add real-time success/error states to name field
- Show dynamic character counter with color feedback
- Add autofocus to first field in each step
- Add helpful placeholder examples
- Provide positive reinforcement for valid input

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Simplify Step 4 (Skills & Data) for Non-Technical Users

**Files:**
- Modify: `apps/web/src/components/wizard/SkillsDataStep.js`
- Modify: `apps/web/src/components/wizard/AgentWizard.css`

**Step 1: Simplify tool descriptions**

Modify tool descriptions to be less technical:

```javascript
const TOOLS = [
  {
    id: 'sql_query',
    name: 'Data Analysis',
    icon: Database,
    description: 'Let your agent answer questions about your data',
    requiresDataset: true,
    helpText: 'Enable this if you want your agent to query and analyze datasets',
  },
  {
    id: 'data_summary',
    name: 'Quick Statistics',
    icon: BarChart,
    description: 'Generate summaries and statistics automatically',
    requiresDataset: false,
    helpText: 'Your agent can provide statistical overviews of data',
  },
  {
    id: 'calculator',
    name: 'Math & Calculations',
    icon: CalcIcon,
    description: 'Perform calculations and number crunching',
    requiresDataset: false,
    helpText: 'Enable this for pricing, conversions, or any math needs',
  },
];
```

**Step 2: Add expandable help sections**

```javascript
{TOOLS.map((tool) => {
  const IconComponent = tool.icon;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Card key={tool.id} className="mb-2" style={{ border: '1px solid #dee2e6' }}>
      <Card.Body className="py-3">
        <div className="d-flex align-items-start justify-content-between">
          <div className="d-flex align-items-start gap-3 flex-grow-1">
            <div className="tool-icon" style={{ fontSize: '1.5rem', color: '#0d6efd' }}>
              <IconComponent />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <strong>{tool.name}</strong>
                <button
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setShowHelp(!showHelp)}
                  style={{ textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  {showHelp ? 'Hide' : 'Learn more'}
                </button>
              </div>
              <small className="text-muted">{tool.description}</small>
              {showHelp && (
                <div className="alert alert-info mt-2 mb-0 p-2">
                  <small>{tool.helpText}</small>
                </div>
              )}
            </div>
          </div>
          <Form.Check
            type="switch"
            id={`tool-${tool.id}`}
            label=""
            checked={data.skills[tool.id]}
            onChange={() => handleToolToggle(tool.id)}
            aria-label={tool.name}
          />
        </div>
      </Card.Body>
    </Card>
  );
})}
```

**Step 3: Change template info alert to be more helpful**

```javascript
{templateName && (
  <Alert variant="success" className="mb-3">
    <small>
      ✓ Based on your <strong>{templateName}</strong> template, we've pre-selected the recommended tools below. You can enable or disable any of them.
    </small>
  </Alert>
)}
```

**Step 4: Simplify dataset section title and description**

```javascript
<h5 className="mb-2">Give Your Agent Access to Data</h5>
<p className="text-muted small mb-3">
  Select which datasets your agent can analyze (you can change this later)
</p>
```

**Step 5: Test simplified language**

Review all text for jargon and technical terms. Ensure a non-technical user can understand.

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: simplify step 4 language for non-technical users

- Rename 'SQL Query Tool' to 'Data Analysis'
- Use plain language in all descriptions
- Add expandable 'Learn more' help sections
- Change alert tone to positive reinforcement
- Remove technical jargon (SQL, tokens, etc)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add "Test Your Agent" Preview in Review Step

**Files:**
- Modify: `apps/web/src/components/wizard/ReviewStep.js`
- Create: `apps/web/src/components/wizard/__tests__/AgentPreview.test.js`
- Create: `apps/web/src/components/wizard/AgentPreview.js`

**Step 1: Write AgentPreview test**

Create `apps/web/src/components/wizard/__tests__/AgentPreview.test.js`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import AgentPreview from '../AgentPreview';

describe('AgentPreview', () => {
  const mockConfig = {
    name: 'Test Agent',
    avatar: '🤖',
    personality: { preset: 'friendly', temperature: 0.7 },
  };

  test('renders agent preview card', () => {
    render(<AgentPreview config={mockConfig} />);
    expect(screen.getByText('Test Your Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  test('shows sample message input', () => {
    render(<AgentPreview config={mockConfig} />);
    expect(screen.getByPlaceholderText(/ask your agent/i)).toBeInTheDocument();
  });

  test('shows personality indicator', () => {
    render(<AgentPreview config={mockConfig} />);
    expect(screen.getByText(/friendly/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify failure**

```bash
cd apps/web
npm test -- AgentPreview.test.js
```

Expected: FAIL with "Cannot find module '../AgentPreview'"

**Step 3: Write AgentPreview component**

Create `apps/web/src/components/wizard/AgentPreview.js`:

```javascript
import React, { useState } from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';
import { ChatDots } from 'react-bootstrap-icons';

const AgentPreview = ({ config }) => {
  const [testMessage, setTestMessage] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const handleTest = () => {
    if (testMessage.trim()) {
      setShowResponse(true);
      // Reset after 3 seconds
      setTimeout(() => {
        setShowResponse(false);
        setTestMessage('');
      }, 3000);
    }
  };

  const personalityLabels = {
    formal: 'Professional',
    friendly: 'Conversational',
    creative: 'Creative',
  };

  return (
    <Card className="agent-preview-card mb-3" style={{ border: '2px dashed #0d6efd' }}>
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-3">
          <ChatDots size={20} className="text-primary" />
          <h6 className="mb-0">Test Your Agent</h6>
          <Badge bg="info" className="ms-auto">
            {personalityLabels[config.personality.preset]}
          </Badge>
        </div>

        <div className="agent-preview-chat">
          <div className="preview-agent-bubble mb-2">
            <span style={{ fontSize: '1.5rem' }}>{config.avatar || '🤖'}</span>
            <div className="ms-2">
              <strong>{config.name}</strong>
              <p className="mb-0 small text-muted">
                Hi! I'm {config.name}. How can I help you today?
              </p>
            </div>
          </div>

          {showResponse && (
            <div className="preview-agent-bubble mb-2 bg-light">
              <span style={{ fontSize: '1.5rem' }}>{config.avatar || '🤖'}</span>
              <div className="ms-2">
                <p className="mb-0 small">
                  <em>This is a preview. Your agent will respond based on your configuration...</em>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3">
          <Form.Control
            type="text"
            placeholder="Ask your agent something to see how it responds..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTest();
              }
            }}
          />
          <div className="text-center mt-2">
            <small className="text-muted">
              This is a preview. Actual agent will be created when you click "Create Agent" below.
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default AgentPreview;
```

**Step 4: Add preview to ReviewStep**

Modify `apps/web/src/components/wizard/ReviewStep.js`:

```javascript
// Add import
import AgentPreview from './AgentPreview';

// Add at top of review content, before template card
<AgentPreview
  config={{
    name: basicInfo.name,
    avatar: basicInfo.avatar,
    personality: personality,
  }}
/>
```

**Step 5: Add preview styling**

```css
.agent-preview-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.preview-agent-bubble {
  display: flex;
  align-items-start;
  padding: 12px;
  border-radius: 8px;
  background: white;
}

.preview-agent-bubble.bg-light {
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Step 6: Test preview functionality**

1. Complete wizard to step 5
2. Should see preview card with agent avatar and name
3. Type message and press Enter → should show mock response
4. Response should fade away after 3 seconds

**Step 7: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add agent preview in review step

- Create AgentPreview component with mock chat
- Show agent personality and appearance
- Let users test interaction before creating
- Add fade-in animation for responses
- Build confidence before final creation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Add Contextual Help and Tooltips

**Files:**
- Create: `apps/web/src/components/wizard/HelpTooltip.js`
- Modify: All step components to add tooltips

**Step 1: Create reusable HelpTooltip component**

```javascript
import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { QuestionCircle } from 'react-bootstrap-icons';

const HelpTooltip = ({ content, placement = 'top' }) => {
  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip>{content}</Tooltip>}
    >
      <QuestionCircle
        size={16}
        className="text-muted ms-1"
        style={{ cursor: 'help' }}
      />
    </OverlayTrigger>
  );
};

export default HelpTooltip;
```

**Step 2: Add tooltips to PersonalityStep**

```javascript
<Form.Label>
  Response Style: {data.temperature.toFixed(1)}
  <HelpTooltip content="Lower values make responses more focused and consistent. Higher values make them more creative and varied." />
</Form.Label>
```

**Step 3: Add tooltips to SkillsDataStep**

```javascript
<h5 className="mb-3">
  Skills
  <HelpTooltip content="Skills are special abilities your agent can use, like analyzing data or doing calculations." />
</h5>
```

**Step 4: Add help icon to wizard title**

In AgentWizard.js, add title with help:

```javascript
<div className="wizard-header text-center mb-3">
  <h2>
    Create Your AI Agent
    <HelpTooltip content="This wizard will guide you through creating a custom AI agent in 5 simple steps." />
  </h2>
  <p className="text-muted">Follow the steps below to set up your agent</p>
</div>
```

**Step 5: Test tooltips**

1. Hover over question icons → should show tooltip
2. Tooltips should be easy to read and helpful
3. Icons should not interfere with layout

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add contextual help tooltips throughout wizard

- Create reusable HelpTooltip component
- Add help icons to complex settings
- Provide explanations for technical concepts
- Add wizard header with overview help
- Make wizard more approachable for beginners

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Fix Navigation Edge Cases

**Files:**
- Modify: `apps/web/src/components/wizard/AgentWizard.js`
- Modify: `apps/web/src/pages/AgentsPage.js`

**Step 1: Prevent accidental navigation away**

Add beforeunload handler:

```javascript
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (wizardData.template) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Your progress is auto-saved if you leave.';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [wizardData.template]);
```

**Step 2: Fix success navigation in AgentsPage**

Modify `apps/web/src/pages/AgentsPage.js`:

Replace `alert(location.state.success)` with toast:

```javascript
// Add import
import { useToast } from '../components/common/Toast';

// In component
const { showToast } = useToast();

// In useEffect
useEffect(() => {
  if (location.state?.showQuickForm) {
    setShowCreateModal(true);
    window.history.replaceState({}, document.title);
  }
  if (location.state?.success) {
    showToast(location.state.success, 'success');
    window.history.replaceState({}, document.title);
    // Refresh agents list
    fetchAgents();
  }
}, [location]);
```

**Step 3: Add draft cleanup on successful creation**

Ensure draft is cleared even if navigation fails:

```javascript
const handleCreate = async () => {
  try {
    setCreating(true);

    const agentData = { /* ... */ };
    await agentService.create(agentData);

    // Clear draft immediately
    localStorage.removeItem(DRAFT_KEY);

    showToast('Agent created successfully!', 'success');

    // Navigate
    navigate('/agents');
  } catch (error) {
    // Don't clear draft on error so user can retry
    // ... error handling
  } finally {
    setCreating(false);
  }
};
```

**Step 4: Test navigation edge cases**

1. Start wizard, select template, close tab → should warn about unsaved changes
2. Create agent successfully → should navigate to agents page and show toast
3. Create agent with error → should stay on wizard, allow retry
4. Refresh page during wizard → should offer to resume

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "fix: improve navigation and edge case handling

- Add beforeunload warning when draft exists
- Replace alert with toast for success message
- Refresh agents list after successful creation
- Preserve draft on creation error for retry
- Improve overall navigation reliability

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Add Mobile Responsiveness Fixes

**Files:**
- Modify: `apps/web/src/components/wizard/AgentWizard.css`
- Modify: `apps/web/src/components/wizard/TemplateSelector.js`

**Step 1: Fix stepper overflow on mobile**

Modify CSS:

```css
@media (max-width: 768px) {
  .wizard-stepper {
    overflow-x: auto;
    padding-bottom: 10px;
    -webkit-overflow-scrolling: touch;
  }

  .wizard-step {
    min-width: 60px; /* Prevent collapse */
  }

  .step-label {
    font-size: 0.7rem;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .step-connector {
    min-width: 20px;
  }
}
```

**Step 2: Stack template cards on mobile**

```css
@media (max-width: 768px) {
  .template-card {
    margin-bottom: 12px;
  }

  .template-icon {
    width: 60px;
    height: 60px;
  }
}
```

**Step 3: Make buttons stack on mobile**

```css
@media (max-width: 576px) {
  .wizard-actions {
    flex-direction: column-reverse !important;
    gap: 8px;
  }

  .wizard-actions > div {
    width: 100%;
  }

  .wizard-actions button {
    width: 100%;
  }
}
```

**Step 4: Test on mobile viewport**

1. Resize browser to 375px width (iPhone SE)
2. Check stepper doesn't overflow
3. Template cards should stack vertically
4. Buttons should stack and be full-width
5. All text should remain readable

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "fix: improve mobile responsiveness

- Fix stepper overflow with horizontal scroll
- Stack template cards on mobile
- Make action buttons full-width on mobile
- Add touch-friendly scrolling
- Ensure text remains readable at all sizes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Add Accessibility Improvements

**Files:**
- Modify: All wizard components
- Add: ARIA labels and roles

**Step 1: Add ARIA landmarks to wizard**

```javascript
<Container className="wizard-container py-4" role="main" aria-label="Agent Creation Wizard">
  <Card className="wizard-card">
    <Card.Body>
      <WizardStepper currentStep={currentStep} steps={STEPS} />

      <div
        className="wizard-content mt-4"
        role="region"
        aria-label={`Step ${currentStep}: ${STEPS[currentStep - 1].label}`}
      >
        {/* ... step content ... */}
      </div>
```

**Step 2: Add screen reader announcements for step changes**

```javascript
const [announcement, setAnnouncement] = useState('');

const handleNext = () => {
  // ... validation ...

  if (currentStep < STEPS.length) {
    setCurrentStep(currentStep + 1);
    setAnnouncement(`Now on step ${currentStep + 1}: ${STEPS[currentStep].label}`);
  }
};

// In JSX, add invisible announcement region
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="visually-hidden"
>
  {announcement}
</div>
```

**Step 3: Add proper labels to all form inputs**

Ensure every input has associated label:

```javascript
<Form.Label htmlFor="agent-name">Name *</Form.Label>
<Form.Control
  id="agent-name"
  type="text"
  // ... other props
/>
```

**Step 4: Test with keyboard only**

1. Use Tab key to navigate all interactive elements
2. Use Enter/Space to activate buttons
3. Use arrow keys where applicable
4. Verify no keyboard traps

**Step 5: Test with screen reader**

1. Use VoiceOver (Mac) or NVDA (Windows)
2. Verify all content is announced
3. Verify step changes are announced
4. Verify form validation is announced

**Step 6: Commit**

```bash
git add apps/web/src/components/wizard/
git commit -m "feat: add accessibility improvements

- Add ARIA landmarks and labels
- Add screen reader announcements for step changes
- Ensure all inputs have proper labels
- Add focus management for better keyboard nav
- Make wizard fully accessible

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `apps/web/src/components/wizard/README.md`

**Step 1: Document UX improvements in wizard README**

Create `apps/web/src/components/wizard/README.md`:

```markdown
# Agent Creation Wizard

5-step guided wizard for creating AI agents with ease.

## UX Features

**User Feedback:**
- Toast notifications for all user actions
- Real-time validation with inline feedback
- Progress indicator showing completion percentage
- Success/error states with color coding

**Navigation:**
- Keyboard support (Enter to advance, Esc to cancel)
- Auto-advance after template selection
- Disabled Next button when validation fails
- beforeunload warning for unsaved changes

**Accessibility:**
- Full keyboard navigation
- Screen reader announcements
- ARIA landmarks and labels
- Focus management

**Help & Guidance:**
- Contextual help tooltips
- Expandable "Learn more" sections
- Helpful placeholder examples
- Agent preview before creation

## Testing

Manual UX test checklist:
- [ ] Can complete wizard with keyboard only
- [ ] Error messages are helpful and specific
- [ ] Loading states prevent user confusion
- [ ] Mobile layout works on 375px viewport
- [ ] Screen reader announces all changes
- [ ] Tooltips provide adequate help
```

**Step 2: Update CLAUDE.md**

Add to wizard components section:

```markdown
- `wizard/`: Agent creation wizard components
  - Comprehensive UX: Toast notifications, real-time validation, keyboard nav
  - Accessibility: ARIA labels, screen reader support, focus management
  - Mobile-first: Responsive stepper, stacked layouts, touch-friendly
  - User guidance: Contextual help, tooltips, agent preview
```

**Step 3: Commit**

```bash
git add docs/ apps/web/ CLAUDE.md
git commit -m "docs: document wizard UX improvements

- Add wizard README with UX features
- Document accessibility features
- Add manual UX testing checklist
- Update CLAUDE.md with UX details

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Execution Complete

All tasks provide:
- Better user feedback (toasts instead of alerts)
- Real-time validation with visual feedback
- Keyboard navigation support
- Loading states and progress indicators
- Simplified language for non-technical users
- Agent preview before creation
- Full accessibility support
- Mobile responsiveness
- Comprehensive help system

**Result:** A wizard that "just works" for all users, technical or not.
