import { render, screen } from '@testing-library/react';
import WizardStepper from '../WizardStepper';

describe('WizardStepper', () => {
  const steps = [
    { number: 1, label: 'Template' },
    { number: 2, label: 'Basic Info' },
    { number: 3, label: 'Personality' },
    { number: 4, label: 'Skills & Data' },
    { number: 5, label: 'Review' },
  ];

  test('renders all steps with correct labels', () => {
    render(<WizardStepper currentStep={1} steps={steps} />);
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Personality')).toBeInTheDocument();
    expect(screen.getByText('Skills & Data')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  test('highlights current step', () => {
    render(<WizardStepper currentStep={2} steps={steps} />);
    const step2 = screen.getByText('Basic Info').closest('.wizard-step');
    expect(step2).toHaveClass('active');
  });

  test('marks completed steps', () => {
    render(<WizardStepper currentStep={3} steps={steps} />);
    const step1 = screen.getByText('Template').closest('.wizard-step');
    expect(step1).toHaveClass('completed');
  });
});
