// Access React from global variable
const React = window.React;
const { useState, useEffect } = React;

// Access Recharts from global variable
const {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} = Recharts;

// Access PapaParse from global variable
const Papa = window.Papa;

// =============================================
// ==========   FinancialDashboard   ===========
// =============================================
const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  
  // Financial years to track
  const financialYears = ["FY 2022", "FY 2023", "FY 2024"];
  
  // Colours for different years and metrics
  const yearColors = {
    'FY 2022': '#2563eb',  // Blue
    'FY 2023': '#059669',  // Green
    'FY 2024': '#dc2626'   // Red
  };
  
  const metricColors = [
    '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777',
    '#d97706', '#0891b2', '#4f46e5', '#ea580c', '#65a30d'
  ];

  // ---------------------------------------------
  // Load & process CSV data from window.csvData
  // ---------------------------------------------
  useEffect(() => {
    try {
      setLoading(true);
      
      // Parse CSV data using Papa
      const parsedData = Papa.parse(window.csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });

      // Build metrics list (excluding these columns)
      const metrics = Object.keys(parsedData.data[0])
        .filter(col => col !== 'Financial Year' && col !== 'Grand Total');
      
      setAvailableMetrics(metrics);

      // Prepare empty structure
      const processedData = {};
      financialYears.forEach(fy => {
        processedData[fy] = {};
        metrics.forEach(metric => {
          processedData[fy][metric] = [];
        });
      });

      // We'll track the current year across rows
      let currentFY = null;

      // Loop through each row and fill data
      parsedData.data.forEach(row => {
        const fyValue = row['Financial Year'];
        
        // If the row is a new financial year label
        if (financialYears.includes(fyValue)) {
          currentFY = fyValue;
        } 
        // If we have a current year, and it's a "customer" row
        else if (currentFY && fyValue && fyValue !== 'Grand Total') {
          metrics.forEach(metric => {
            const value = row[metric] || 0;
            if (value > 0) {
              processedData[currentFY][metric].push({
                customer: fyValue,
                value: value
              });
            }
          });
        }
      });

      // Sort each year's data in descending order
      financialYears.forEach(fy => {
        metrics.forEach(metric => {
          processedData[fy][metric].sort((a, b) => b.value - a.value);
        });
      });

      // Done, store in state
      setData(processedData);
      setLoading(false);

    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
      setLoading(false);
    }
  }, [financialYears]);

  // ---------------------------------------------
  // Utility functions
  // ---------------------------------------------
  const shortenCustomerName = (name) => {
    if (!name) return '';
    if (name.length <= 25) return name;
    const parts = name.split(/\s+(?:of|as|atf|t\/as|Pty|Ltd|Limited|Pty\.)\s+/i);
    return parts[0].trim();
  };
  
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Key metrics to highlight first
  const getPopularMetrics = () => {
    const keyMetrics = [
      'Carbon Credit', 'Greenhouse Gas', 'Climate Active', 'Consulting Fees',
      'NGER Consulting', 'Net Zero', 'Emissions Management', 'Carbon Strategy'
    ];
    return [
      ...keyMetrics.filter(m => availableMetrics.includes(m)),
      ...availableMetrics.filter(m => !keyMetrics.includes(m))
    ];
  };

  // ---------------------------------------------
  // TABS
  // ---------------------------------------------
  const tabs = [
    { id: 'single', label: 'Single Metric View' },
    { id: 'years', label: 'Year Comparison' },
    { id: 'metrics', label: 'Metric Comparison' }
  ];

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Financial Data Dashboard</h1>
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Financial Data Dashboard</h1>
          <div className="text-red-500 p-4">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard layout
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Financial Data Dashboard</h1>

        {/* Tabs */}
        <div className="flex mb-4 border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mb-8">
          {activeTab === 'single' && (
            <SingleMetricView
              data={data}
              metrics={availableMetrics}
              financialYears={financialYears}
              shortenCustomerName={shortenCustomerName}
              formatCurrency={formatCurrency}
            />
          )}
          {activeTab === 'years' && (
            <YearComparisonView
              data={data}
              metrics={availableMetrics}
              financialYears={financialYears}
              yearColors={yearColors}
              shortenCustomerName={shortenCustomerName}
              formatCurrency={formatCurrency}
            />
          )}
          {activeTab === 'metrics' && (
            <MetricComparisonView
              data={data}
              metrics={availableMetrics}
              financialYears={financialYears}
              metricColors={metricColors}
              getPopularMetrics={getPopularMetrics}
              shortenCustomerName={shortenCustomerName}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow text-sm text-gray-700">
          <h3 className="font-bold mb-2">Dashboard Guide:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Single Metric View:</span> Analyse one
              financial metric across top customers for a specific year.
            </li>
            <li>
              <span className="font-medium">Year Comparison:</span> Compare the
              same financial metric across different years to see trends over
              time.
            </li>
            <li>
              <span className="font-medium">Metric Comparison:</span> Compare
              multiple financial metrics side by side for a specific year.
            </li>
          </ul>
          <p className="mt-2">
            Use the filters in each view to customise your analysis. Hover over
            chart elements for detailed information.
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================
// ==========   SingleMetricView   =============
// =============================================
const SingleMetricView = ({
  data,
  metrics,
  financialYears,
  shortenCustomerName,
  formatCurrency
}) => {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0] || 'Carbon Credit');
  const [selectedYear, setSelectedYear] = useState(financialYears[0]);
  const [topCount, setTopCount] = useState(10);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data[selectedYear] && data[selectedYear][selectedMetric]) {
      const filteredData = [...data[selectedYear][selectedMetric]]
        .slice(0, topCount)
        .reverse();
      setChartData(filteredData);
    }
  }, [selectedYear, selectedMetric, topCount, data]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-bold">{payload[0].payload.customer}</p>
          <p className="text-blue-600">
            {`${selectedMetric}: $${payload[0].value.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const displayData = chartData.map(item => ({
    ...item,
    shortName: shortenCustomerName(item.customer)
  }));

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Top Customers by Financial Metric</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Financial Year:</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {financialYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Financial Metric:</label>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {metrics.map(metric => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Top X Customers:</label>
          <select
            value={topCount}
            onChange={e => setTopCount(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {[1, 2, 3, 5, 10, 15].map(count => (
              <option key={count} value={count}>
                Top {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      {displayData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={displayData}
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name={selectedMetric} fill="#2563eb" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500">
            No data available for {selectedMetric} in {selectedYear}
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>
          * Some customer names shortened for display purposes. Hover over bars
          to see full details.
        </p>
        <p>
          * Showing top {topCount} customers for {selectedMetric} in {selectedYear}.
        </p>
      </div>
    </div>
  );
};

// =============================================
// ==========  YearComparisonView  =============
// =============================================
const YearComparisonView = ({
  data,
  metrics,
  financialYears,
  yearColors,
  shortenCustomerName,
  formatCurrency
}) => {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0] || 'Carbon Credit');
  const [selectedYears, setSelectedYears] = useState([...financialYears]);
  const [topCount, setTopCount] = useState(5);
  const [chartData, setChartData] = useState([]);

  // Helper to gather top customers across the selected years
  const getUniqueTopCustomers = () => {
    if (!data || Object.keys(data).length === 0) return [];
    
    const topCustomersByYear = {};
    selectedYears.forEach(year => {
      if (data[year] && data[year][selectedMetric]) {
        topCustomersByYear[year] = data[year][selectedMetric]
          .slice(0, topCount)
          .map(item => item.customer);
      }
    });
    
    const allTopCustomers = [];
    selectedYears.forEach(year => {
      if (topCustomersByYear[year]) {
        allTopCustomers.push(...topCustomersByYear[year]);
      }
    });
    return [...new Set(allTopCustomers)];
  };

  // Rebuild chart data whenever selection changes
  useEffect(() => {
    if (Object.keys(data).length === 0) return;
    const uniqueCustomers = getUniqueTopCustomers();

    const newChartData = uniqueCustomers.map(customer => {
      const customerData = { customer };
      selectedYears.forEach(year => {
        if (data[year] && data[year][selectedMetric]) {
          const entry = data[year][selectedMetric].find(item => item.customer === customer);
          customerData[year] = entry ? entry.value : 0;
        }
      });
      return customerData;
    });

    // Sort by sum of all selected year values
    newChartData.sort((a, b) => {
      const sumA = selectedYears.reduce((sum, year) => sum + (a[year] || 0), 0);
      const sumB = selectedYears.reduce((sum, year) => sum + (b[year] || 0), 0);
      return sumB - sumA;
    });

    setChartData(newChartData);
  }, [selectedYears, selectedMetric, topCount, data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Toggle year selection
  const toggleYearSelection = year => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter(y => y !== year));
      }
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  // Select all years
  const selectAllYears = () => {
    setSelectedYears([...financialYears]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Financial Year Comparison</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Financial Metric:</label>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {metrics.map(metric => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Top X Customers:</label>
          <select
            value={topCount}
            onChange={e => setTopCount(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {[3, 5, 10, 15].map(count => (
              <option key={count} value={count}>
                Top {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Compare Years:</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={selectAllYears}
            className={`px-3 py-1 rounded border ${
              selectedYears.length === financialYears.length
                ? 'bg-gray-200 border-gray-400'
                : 'border-gray-300'
            }`}
          >
            All Years
          </button>
          {financialYears.map(year => (
            <button
              key={year}
              onClick={() => toggleYearSelection(year)}
              className={`px-3 py-1 rounded border ${
                selectedYears.includes(year)
                  ? 'border-gray-400 bg-gray-200'
                  : 'border-gray-300'
              }`}
              style={{ borderColor: selectedYears.includes(year) ? yearColors[year] : undefined }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.map(item => ({
                ...item,
                shortName: shortenCustomerName(item.customer)
              }))}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedYears.map(year => (
                <Bar
                  key={year}
                  dataKey={year}
                  name={year}
                  fill={yearColors[year] || '#8884d8'}
                  barSize={30 / selectedYears.length}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500">
            No data available for the selected criteria
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>* Showing top {topCount} customers for {selectedMetric} across selected years.</p>
        <p>* Names are shortened for display. Hover over bars for full details.</p>
      </div>
    </div>
  );
};

// =============================================
// ========  MetricComparisonView  =============
// =============================================
const MetricComparisonView = ({
  data,
  metrics,
  financialYears,
  metricColors,
  getPopularMetrics,
  shortenCustomerName,
  formatCurrency
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState(metrics.slice(0, 3));
  const [selectedYear, setSelectedYear] = useState(financialYears[0]);
  const [topCount, setTopCount] = useState(5);
  const [chartData, setChartData] = useState([]);

  // Identify top customers across multiple selected metrics
  const getTopCustomersAcrossMetrics = () => {
    if (!data[selectedYear]) return [];
    const topCustomersByMetric = {};
    const customerScores = {};

    selectedMetrics.forEach(metric => {
      if (data[selectedYear][metric]) {
        const topCustomers = data[selectedYear][metric].slice(0, topCount);
        topCustomersByMetric[metric] = topCustomers;

        topCustomers.forEach((item, idx) => {
          if (!customerScores[item.customer]) {
            customerScores[item.customer] = 0;
          }
          // Higher position in top X => higher "score"
          customerScores[item.customer] += (topCount - idx);
        });
      }
    });

    const rankedCustomers = Object.keys(customerScores)
      .sort((a, b) => customerScores[b] - customerScores[a])
      .slice(0, topCount);

    return rankedCustomers;
  };

  // Rebuild chart data when selection changes
  useEffect(() => {
    if (Object.keys(data).length === 0 || selectedMetrics.length === 0) return;

    const topCustomers = getTopCustomersAcrossMetrics();
    const newChartData = topCustomers.map(customer => {
      const row = { customer };
      selectedMetrics.forEach(metric => {
        if (data[selectedYear][metric]) {
          const entry = data[selectedYear][metric].find(i => i.customer === customer);
          row[metric] = entry ? entry.value : 0;
        } else {
          row[metric] = 0;
        }
      });
      return row;
    });

    setChartData(newChartData);
  }, [selectedYear, selectedMetrics, topCount, data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-md">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Toggle a metric on/off
  const toggleMetricSelection = metric => {
    if (selectedMetrics.includes(metric)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      if (selectedMetrics.length < 5) {
        setSelectedMetrics([...selectedMetrics, metric]);
      }
    }
  };

  // Access the recommended "popular" metrics
  const popularMetrics = getPopularMetrics();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Financial Metrics Comparison</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Financial Year:</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {financialYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-64">
          <label className="block mb-2 font-medium">Top X Customers:</label>
          <select
            value={topCount}
            onChange={e => setTopCount(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            {[3, 5, 10, 15].map(count => (
              <option key={count} value={count}>
                Top {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Compare Metrics (select up to 5):
        </label>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border rounded">
          {popularMetrics.map((metric, idx) => {
            const isSelected = selectedMetrics.includes(metric);
            const isDisabled = !isSelected && selectedMetrics.length >= 5;
            return (
              <button
                key={metric}
                onClick={() => toggleMetricSelection(metric)}
                disabled={isDisabled}
                className={`px-3 py-1 rounded border text-sm ${
                  isSelected
                    ? 'border-gray-400 bg-gray-200'
                    : isDisabled
                    ? 'border-gray-200 text-gray-400'
                    : 'border-gray-300'
                }`}
                style={{
                  borderColor: isSelected
                    ? metricColors[selectedMetrics.indexOf(metric) % metricColors.length]
                    : undefined
                }}
              >
                {metric}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {5 - selectedMetrics.length} more metrics can be selected
        </p>
      </div>

      {chartData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.map(item => ({
                ...item,
                shortName: shortenCustomerName(item.customer)
              }))}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map((metric, idx) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  name={metric}
                  fill={metricColors[idx % metricColors.length]}
                  barSize={30 / selectedMetrics.length}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
          <p className="text-gray-500">
            No data available for the selected criteria
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>
          * Showing top {topCount} customers across {selectedMetrics.length} metrics
          for {selectedYear}.
        </p>
        <p>
          * Names are shortened for display. Hover over bars for full details.
        </p>
      </div>
    </div>
  );
};

// =============================================
// ==========  Render the Dashboard  ===========
// =============================================
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<FinancialDashboard />);
