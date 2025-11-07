import { render, screen } from '@testing-library/react';
import ReviewStep from '../ReviewStep';

describe('ReviewStep', () => {
  const mockWizardData = {
    template: { name: 'Data Analyst Agent', icon: 'BarChart' },
    basicInfo: { name: 'My Analyst', description: 'Analyzes data', avatar: '📊' },
    personality: { preset: 'formal', temperature: 0.4, max_tokens: 2000 },
    skills: { sql_query: true, data_summary: true, calculator: false },
    datasets: ['123', '456'],
  };

  const mockDatasets = [
    { id: '123', name: 'Revenue 2024' },
    { id: '456', name: 'Customer List' },
  ];

  test('renders summary of all configuration', () => {
    render(<ReviewStep wizardData={mockWizardData} datasets={mockDatasets} onEdit={jest.fn()} />);
    expect(screen.getByText('My Analyst')).toBeInTheDocument();
    expect(screen.getByText('Analyzes data')).toBeInTheDocument();
    expect(screen.getByText(/formal/i)).toBeInTheDocument();
  });

  test('shows enabled tools', () => {
    render(<ReviewStep wizardData={mockWizardData} datasets={mockDatasets} onEdit={jest.fn()} />);
    expect(screen.getByText('SQL Query Tool')).toBeInTheDocument();
    expect(screen.getByText('Data Summary Tool')).toBeInTheDocument();
    expect(screen.queryByText('Calculator Tool')).not.toBeInTheDocument();
  });

  test('shows connected datasets', () => {
    render(<ReviewStep wizardData={mockWizardData} datasets={mockDatasets} onEdit={jest.fn()} />);
    expect(screen.getByText('Revenue 2024')).toBeInTheDocument();
    expect(screen.getByText('Customer List')).toBeInTheDocument();
  });

  test('shows edit links for each section', () => {
    render(<ReviewStep wizardData={mockWizardData} datasets={mockDatasets} onEdit={jest.fn()} />);
    const editLinks = screen.getAllByText('Edit');
    expect(editLinks.length).toBeGreaterThan(0);
  });
});
