import { render, screen, fireEvent } from '@testing-library/react';
import BasicInfoStep from '../BasicInfoStep';

describe('BasicInfoStep', () => {
  const mockOnChange = jest.fn();
  const defaultData = {
    name: '',
    description: '',
    avatar: '',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders name and description fields', () => {
    render(<BasicInfoStep data={defaultData} onChange={mockOnChange} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  test('shows pre-filled name from template', () => {
    render(<BasicInfoStep data={{ ...defaultData, name: 'Customer Support Agent' }} onChange={mockOnChange} />);
    expect(screen.getByDisplayValue('Customer Support Agent')).toBeInTheDocument();
  });

  test('calls onChange when name is updated', () => {
    render(<BasicInfoStep data={defaultData} onChange={mockOnChange} />);
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'My Support Bot' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      name: 'My Support Bot',
      description: '',
      avatar: '',
    });
  });

  test('validates name length', () => {
    render(<BasicInfoStep data={{ ...defaultData, name: 'AB' }} onChange={mockOnChange} />);
    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  });
});
