import { Card } from 'react-bootstrap';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportVisualization = ({ toolResult }) => {
  if (!toolResult || !toolResult.result || toolResult.result.type !== 'report_visualization') {
    return null;
  }

  const { chart_type, title, description, data, config } = toolResult.result;
  const { x_axis, y_axis } = config;

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <p className="text-muted">No data available for visualization.</p>;
    }

    switch (chart_type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x_axis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={y_axis} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x_axis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={y_axis} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={y_axis} // Value
                nameKey={x_axis} // Label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map(key => <th key={key}>{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    if (!data || data.length === 0) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title || 'report'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="mt-3 mb-3 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            {title && <h5 className="card-title mb-1">{title}</h5>}
            {description && <p className="card-text text-muted small">{description}</p>}
          </div>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-secondary" onClick={downloadCSV} title="Export CSV">
              <i className="bi bi-file-earmark-spreadsheet"></i> CSV
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={downloadJSON} title="Export JSON">
              <i className="bi bi-file-earmark-code"></i> JSON
            </button>
          </div>
        </div>
        <div className="mt-3">
          {renderChart()}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ReportVisualization;
