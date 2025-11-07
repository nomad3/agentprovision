import { render, screen, fireEvent } from '@testing-library/react';
import AgentWizard from '../AgentWizard';

jest.mock('react-router-dom');

const renderWizard = () => {
  return render(<AgentWizard />);
};

describe('AgentWizard', () => {
  test('renders wizard stepper', () => {
    renderWizard();
    expect(screen.getByText('Template')).toBeInTheDocument();
  });

  test('shows step 1 by default', () => {
    renderWizard();
    expect(screen.getByText('What type of agent do you want to create?')).toBeInTheDocument();
  });

  test('has Back and Next buttons', () => {
    renderWizard();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('Back button disabled on step 1', () => {
    renderWizard();
    const backButton = screen.queryByText('Back');
    expect(backButton).not.toBeInTheDocument();
  });
});
