import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SkillsDataStep from '../SkillsDataStep';
import datasetService from '../../../services/dataset';

jest.mock('../../../services/dataset');

describe('SkillsDataStep', () => {
  const mockOnChange = jest.fn();
  const defaultData = {
    skills: { sql_query: false, data_summary: false, calculator: false },
    datasets: [],
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    datasetService.getAll.mockResolvedValue({ data: [] });
  });

  test('renders all three tools', async () => {
    render(<SkillsDataStep data={defaultData} onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('SQL Query Tool')).toBeInTheDocument();
      expect(screen.getByText('Data Summary Tool')).toBeInTheDocument();
      expect(screen.getByText('Calculator Tool')).toBeInTheDocument();
    });
  });

  test('shows pre-selected tools from template', async () => {
    const dataWithTools = {
      skills: { sql_query: true, data_summary: true, calculator: false },
      datasets: [],
    };
    render(<SkillsDataStep data={dataWithTools} onChange={mockOnChange} />);
    await waitFor(() => {
      const sqlToggle = screen.getByLabelText('SQL Query Tool');
      expect(sqlToggle).toBeChecked();
    });
  });

  test('calls onChange when tool is toggled', async () => {
    render(<SkillsDataStep data={defaultData} onChange={mockOnChange} />);
    await waitFor(() => {
      const calcToggle = screen.getByLabelText('Calculator Tool');
      fireEvent.click(calcToggle);
      expect(mockOnChange).toHaveBeenCalledWith({
        skills: { sql_query: false, data_summary: false, calculator: true },
        datasets: [],
      });
    });
  });

  test('fetches and displays datasets', async () => {
    const mockDatasets = [
      { id: '123', name: 'Revenue 2024', row_count: 1000, columns: ['id', 'amount'] },
    ];
    datasetService.getAll.mockResolvedValue({ data: mockDatasets });

    render(<SkillsDataStep data={defaultData} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('Revenue 2024')).toBeInTheDocument();
      expect(screen.getByText('1000 rows')).toBeInTheDocument();
    });
  });
});
