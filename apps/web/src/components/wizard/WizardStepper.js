import React from 'react';
import { FaCheck as Check } from 'react-icons/fa';
import './AgentWizard.css';

const WizardStepper = ({ currentStep, steps }) => {
  return (
    <div className="wizard-stepper">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div
            className={`wizard-step ${
              step.number === currentStep ? 'active' : ''
            } ${step.number < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">
              {step.number < currentStep ? (
                <Check size={20} />
              ) : (
                step.number
              )}
            </div>
            <div className="step-label">{step.label}</div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`step-connector ${
                step.number < currentStep ? 'completed' : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default WizardStepper;
