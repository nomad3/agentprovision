import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Card } from 'react-bootstrap';
import WizardStepper from './WizardStepper';
import TemplateSelector from './TemplateSelector';
import BasicInfoStep from './BasicInfoStep';
import PersonalityStep from './PersonalityStep';
import SkillsDataStep from './SkillsDataStep';
import ReviewStep from './ReviewStep';
import agentService from '../../services/agent';
import datasetService from '../../services/dataset';
import './AgentWizard.css';

const STEPS = [
  { number: 1, label: 'Template', component: 'TemplateSelector' },
  { number: 2, label: 'Basic Info', component: 'BasicInfo' },
  { number: 3, label: 'Personality', component: 'Personality' },
  { number: 4, label: 'Skills & Data', component: 'SkillsData' },
  { number: 5, label: 'Review', component: 'Review' },
];

const AgentWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    template: null,
    basicInfo: { name: '', description: '', avatar: '' },
    personality: { preset: 'friendly', temperature: 0.7, max_tokens: 2000, system_prompt: '' },
    skills: { sql_query: false, data_summary: false, calculator: false },
    datasets: [],
  });
  const [datasets, setDatasets] = useState([]);
  const [creating, setCreating] = useState(false);

  // Fetch datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await datasetService.getAll();
        setDatasets(response.data || []);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      }
    };
    fetchDatasets();
  }, []);

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !wizardData.template) {
      alert('Please select a template to continue');
      return;
    }

    if (currentStep === 2) {
      if (!wizardData.basicInfo.name || wizardData.basicInfo.name.length < 3) {
        alert('Please enter a valid agent name (at least 3 characters)');
        return;
      }
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      navigate('/dashboard/agents');
    }
  };

  const updateWizardData = (stepData) => {
    setWizardData({ ...wizardData, ...stepData });
  };

  const handleCreate = async () => {
    try {
      setCreating(true);

      // Build agent config
      const agentData = {
        name: wizardData.basicInfo.name,
        description: wizardData.basicInfo.description,
        config: {
          model: wizardData.template?.config?.model || 'gpt-4',
          temperature: wizardData.personality.temperature,
          max_tokens: wizardData.personality.max_tokens,
          system_prompt: wizardData.personality.system_prompt || wizardData.template?.config?.system_prompt,
          personality_preset: wizardData.personality.preset,
          template_used: wizardData.template?.id,
          avatar: wizardData.basicInfo.avatar,
          tools: Object.entries(wizardData.skills)
            .filter(([_, enabled]) => enabled)
            .map(([tool, _]) => tool),
          datasets: wizardData.datasets,
        },
      };

      await agentService.create(agentData);

      // Redirect to agents list with success message
      navigate('/dashboard/agents', { state: { success: 'Agent created successfully!' } });
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container className="wizard-container py-4">
      <Card className="wizard-card">
        <Card.Body>
          <WizardStepper currentStep={currentStep} steps={STEPS} />

          <div className="wizard-content mt-4">
            {currentStep === 1 && (
              <TemplateSelector
                onSelect={(template) => {
                  updateWizardData({
                    template: template,
                    basicInfo: {
                      ...wizardData.basicInfo,
                      name: template.name
                    },
                    personality: {
                      preset: template.config.personality,
                      temperature: template.config.temperature,
                      max_tokens: template.config.max_tokens,
                      system_prompt: template.config.system_prompt,
                    },
                    skills: template.config.tools.reduce((acc, tool) => {
                      acc[tool] = true;
                      return acc;
                    }, { sql_query: false, data_summary: false, calculator: false }),
                  });
                }}
                selectedTemplate={wizardData.template?.id}
              />
            )}
            {currentStep === 2 && (
              <BasicInfoStep
                data={wizardData.basicInfo}
                onChange={(basicInfo) => updateWizardData({ basicInfo })}
              />
            )}
            {currentStep === 3 && (
              <PersonalityStep
                data={wizardData.personality}
                onChange={(personality) => updateWizardData({ personality })}
              />
            )}
            {currentStep === 4 && (
              <SkillsDataStep
                data={{ skills: wizardData.skills, datasets: wizardData.datasets }}
                onChange={(skillsData) => updateWizardData(skillsData)}
                templateName={wizardData.template?.name}
              />
            )}
            {currentStep === 5 && (
              <ReviewStep
                wizardData={wizardData}
                datasets={datasets}
                onEdit={(step) => setCurrentStep(step)}
              />
            )}
          </div>

          <div className="wizard-actions mt-4 d-flex justify-content-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline-secondary" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={handleCancel}>
                Cancel
              </Button>
              {currentStep < STEPS.length && (
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              )}
              {currentStep === STEPS.length && (
                <Button variant="success" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Agent'}
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AgentWizard;
