import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalityStep from '../PersonalityStep';

describe('PersonalityStep', () => {
  const mockOnChange = jest.fn();
  const defaultData = {
    preset: 'friendly',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: '',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders three personality presets', () => {
    render(<PersonalityStep data={defaultData} onChange={mockOnChange} />);
    expect(screen.getByText('Formal & Professional')).toBeInTheDocument();
    expect(screen.getByText('Friendly & Conversational')).toBeInTheDocument();
    expect(screen.getByText('Creative & Expressive')).toBeInTheDocument();
  });

  test('shows selected preset', () => {
    render(<PersonalityStep data={{ ...defaultData, preset: 'formal' }} onChange={mockOnChange} />);
    const card = screen.getByText('Formal & Professional').closest('.preset-card');
    expect(card).toHaveClass('selected');
  });

  test('calls onChange when preset is selected', () => {
    render(<PersonalityStep data={defaultData} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('Creative & Expressive'));
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      preset: 'creative',
      temperature: 0.9,
    }));
  });

  test('fine-tune section is collapsed by default', () => {
    const { container } = render(<PersonalityStep data={defaultData} onChange={mockOnChange} />);
    const accordionBody = container.querySelector('.accordion-collapse');
    expect(accordionBody).toHaveClass('collapse');
    expect(accordionBody).not.toHaveClass('show');
  });

  test('expands fine-tune section when toggled', async () => {
    const { container } = render(<PersonalityStep data={defaultData} onChange={mockOnChange} />);
    fireEvent.click(screen.getByText(/fine-tune settings/i));
    const accordionBody = container.querySelector('.accordion-collapse');
    // Wait for the accordion animation to complete
    await waitFor(() => {
      expect(accordionBody).toHaveClass('show');
    });
  });
});
