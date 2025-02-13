import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getDateIntervals, formatDateLabel } from '@/lib/dateUtils';

function LineGraph({ title, color = "primary", maxValue = 100, unit = "", selectedPeriod = "week", metric, exercise }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { analytics } = useAnalytics();

  // Get real data points from analytics
  const dates = getDateIntervals(selectedPeriod);
  const dataPoints = dates.map(date => {
    const nextDate = new Date(date);
    if (selectedPeriod === 'today') {
      nextDate.setHours(date.getHours() + 4); // Add 4 hours for today's intervals
    } else {
      nextDate.setDate(nextDate.getDate() + 1); // Add 1 day for other periods
    }
    
    // Find sessions within this date's range and for the specified exercise if any
    const sessions = analytics.sessions.filter(session =>
      session.date >= date.getTime() &&
      session.date < nextDate.getTime() &&
      (!exercise || session.exercise === exercise)
    );

    // Calculate average value for the metric
    let value = 0;
    if (sessions.length > 0) {
      value = sessions.reduce((sum, session) => sum + session.metrics[metric], 0) / sessions.length;
    }

    return {
      x: date.getTime(),
      y: Math.round(value),
      date
    };
  });

  // Calculate actual min and max values
  const values = dataPoints.map(p => p.y).filter(y => !isNaN(y));
  const actualMax = values.length > 0 ? Math.max(...values, 0) : maxValue; // Use maxValue if no valid data
  const actualMin = values.length > 0 ? Math.min(...values, 0) : 0;
  const range = Math.max(actualMax - actualMin, 1); // Ensure at least 1 range
  
  // Add padding to the range (10% on top and bottom)
  const paddingValue = range * 0.1;
  const displayMax = Math.max(Math.ceil((actualMax + paddingValue) / 5) * 5, maxValue * 0.2); // At least 20% of maxValue
  const displayMin = Math.max(Math.floor((actualMin - paddingValue) / 5) * 5, 0); // Never below 0
  const displayRange = Math.max(displayMax - displayMin, 1); // Ensure at least 1 range

  // Calculate scales
  const padding = 40;
  const width = 300;
  const height = 200;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Create path from data points with dynamic scaling
  const points = dataPoints.map((point, i) => {
    const x = padding + (i * graphWidth) / Math.max(dataPoints.length - 1, 1);
    const y = isNaN(point.y) ? padding + graphHeight : // Default to bottom of graph if NaN
      padding + graphHeight - (Math.max(0, Math.min(1, (point.y - displayMin) / displayRange)) * graphHeight);
    return { x, y: isNaN(y) ? padding + graphHeight : y }; // Extra safety check
  });

  // Filter out points with NaN values and create path
  const validPoints = points.filter(p => !isNaN(p.y));
  const pathD = validPoints.length > 0 ?
    `M${validPoints.map(p => `${p.x},${p.y}`).join(' L')}` : '';

  // Format date for display
  const formatDate = (date) => {
    if (hoveredPoint !== null) {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return date.getDate();
  };

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[300px] relative bg-accent/5 rounded-md">
        <div className="absolute inset-0 p-4">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = displayMax - (i * displayRange) / 5;
              return (
                <g key={i} className="text-muted-foreground/20">
                  {/* Horizontal grid lines and labels */}
                  <line
                    x1={padding}
                    y1={padding + (i * graphHeight) / 5}
                    x2={width - padding}
                    y2={padding + (i * graphHeight) / 5}
                    stroke="currentColor"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding - 8}
                    y={padding + (i * graphHeight) / 5}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {Math.round(value)}
                    {unit}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {dataPoints.map((point, i) => (
              <text
                key={i}
                x={padding + (i * graphWidth) / (dataPoints.length - 1)}
                y={height - padding + 16}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {formatDateLabel(point.date, selectedPeriod)}
              </text>
            ))}

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={`hsl(var(--${color}))`}
              strokeWidth="2"
              className="opacity-75"
            />

            {/* Area under the line */}
            <path
              d={pathD ? `${pathD} L${width - padding},${height - padding} L${padding},${height - padding} Z` : ''}
              fill={`hsl(var(--${color}))`}
              className="opacity-10"
            />

            {/* Data points and hover targets */}
            {points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={`hsl(var(--${color}))`}
                  className="opacity-75"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                />
                {hoveredPoint === i && (
                  <g>
                    <rect
                      x={point.x - 45}
                      y={point.y - 40}
                      width="90"
                      height="32"
                      rx="4"
                      fill="hsl(var(--popover))"
                      className="stroke-border"
                    />
                    <text
                      x={point.x}
                      y={point.y - 28}
                      textAnchor="middle"
                      className="text-xs fill-popover-foreground font-medium"
                    >
                      {dataPoints[i].y}{unit}
                    </text>
                    <text
                      x={point.x}
                      y={point.y - 15}
                      textAnchor="middle"
                      className="text-[10px] fill-muted-foreground"
                    >
                      {formatDate(dataPoints[i].date)}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  { id: 'general', name: 'General', description: 'Overall training progress and statistics' },
  { id: 'rrt', name: 'RRT', description: 'Reasonal Relational Training metrics' },
  { id: 'mot', name: '3D MOT', description: 'Multiple Object Tracking performance' },
  { id: 'nback', name: 'N-Back', description: 'Working Memory Training statistics' },
  { id: 'ufov', name: 'UFOV', description: 'Visual Processing Speed metrics' }
];

const timePeriods = [
  { id: 'today', name: 'Today' },
  { id: 'week', name: 'Last Week' },
  { id: 'month', name: 'Last Month' },
  { id: '3months', name: 'Last 3 Months' },
  { id: 'year', name: 'Last Year' },
  { id: 'all', name: 'All Time' }
];

function RRTContent({ selectedPeriod }) {
  return (
    <div className="space-y-6">
      <LineGraph
        title="Premises Over Time"
        color="primary"
        maxValue={10}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="premisesCount"
      />
      <LineGraph
        title="Average Time per Answer"
        color="orange"
        maxValue={60}
        unit="s"
        selectedPeriod={selectedPeriod}
        metric="timePerAnswer"
      />
      <LineGraph
        title="Average Percentage Correct"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
      />
    </div>
  );
}

function MOTContent({ selectedPeriod }) {
  return (
    <div className="space-y-6">
      <LineGraph
        title="Average Percentage Correct"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
      />
      <LineGraph
        title="Average Total Balls"
        color="blue"
        maxValue={20}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="totalBalls"
      />
      <LineGraph
        title="Average Tracking Balls"
        color="purple"
        maxValue={10}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="trackingBalls"
      />
    </div>
  );
}

function NBackContent({ selectedPeriod }) {
  const [gridType, setGridType] = useState('3d');
  const [stimuliCount, setStimuliCount] = useState(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-accent/10">
        <div className="inline-flex p-1 bg-background rounded-md shadow-sm">
          <button
            onClick={() => setGridType('3d')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              gridType === '3d' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            3D Grid
          </button>
          <button
            onClick={() => setGridType('2d')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              gridType === '2d' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            2D Grid
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Stimuli:</span>
          <select
            value={stimuliCount}
            onChange={(e) => setStimuliCount(Number(e.target.value))}
            className="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>
      <LineGraph
        title="N-Back Level Progress"
        color="yellow"
        maxValue={5}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="nBackLevel"
      />
      <LineGraph
        title="Percentage Correct Over Time"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
      />
    </div>
  );
}

function UFOVContent({ selectedPeriod }) {
  return (
    <div className="space-y-6">
      <LineGraph
        title="Visual Processing Speed"
        color="orange"
        maxValue={500}
        unit="ms"
        selectedPeriod={selectedPeriod}
        metric="processingSpeed"
      />
      <LineGraph
        title="Accuracy Over Time"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
      />
    </div>
  );
}

function TimeGraph({ selectedPeriod }) {
  const [selectedExercise, setSelectedExercise] = useState('total');
  const { analytics } = useAnalytics();
  const exercises = [
    { id: 'total', name: 'Total' },
    { id: 'rrt', name: 'RRT' },
    { id: 'mot', name: '3D MOT' },
    { id: 'nback', name: 'N-Back' },
    { id: 'ufov', name: 'UFOV' }
  ];

  // Generate different max values based on selected exercise
  const getMaxValue = () => {
    // Get actual max value from data
    const dates = getDateIntervals(selectedPeriod);
    const dataPoints = dates.map(date => {
      const nextDate = new Date(date);
      if (selectedPeriod === 'today') {
        nextDate.setHours(date.getHours() + 1); // Add 1 hour for today's intervals
      } else {
        nextDate.setDate(nextDate.getDate() + 1); // Add 1 day for other periods
      }
      
      // Find sessions within this date's range and for the specified exercise
      const sessions = analytics.sessions.filter(session =>
        session.date >= date.getTime() &&
        session.date < nextDate.getTime() &&
        (!selectedExercise || selectedExercise === 'total' || session.exercise === selectedExercise)
      );

      // Calculate total duration in minutes
      const duration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      return isNaN(duration) ? 0 : duration;
    });

    const validDataPoints = dataPoints.filter(value => !isNaN(value));
    const maxValue = validDataPoints.length > 0 ? Math.max(...validDataPoints, 1) : 1; // Ensure at least 1 minute
    // Round up to nearest multiple of 30 minutes
    return Math.ceil(maxValue / 30) * 30;
  };

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Training Time per Day</h3>
        <div className="flex gap-2">
          {exercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise.id)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                selectedExercise === exercise.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              {exercise.name}
            </button>
          ))}
        </div>
      </div>
      <LineGraph
        title=""
        color={selectedExercise === 'total' ? 'primary' :
               selectedExercise === 'rrt' ? 'orange' :
               selectedExercise === 'mot' ? 'blue' :
               selectedExercise === 'nback' ? 'yellow' : 'green'}
        maxValue={getMaxValue()}
        unit="min"
        selectedPeriod={selectedPeriod}
        metric="duration"
        exercise={selectedExercise === 'total' ? null : selectedExercise}
      />
    </div>
  );
}

function GeneralContent({ selectedPeriod }) {
  const { getTrainingTime, getTimeBreakdown } = useAnalytics();
  
  // Get start and end dates based on selected period
  const now = new Date();
  const startDate = new Date(now);
  switch (selectedPeriod) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default: // all time
      startDate.setFullYear(2000); // effectively all time
  }

  const totalTime = getTrainingTime(null, startDate.getTime(), now.getTime());
  const breakdown = getTimeBreakdown(startDate.getTime(), now.getTime());

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="text-lg font-semibold mb-4">Total Training Time</h3>
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{totalTime}</span>
            <span className="text-sm text-muted-foreground">total time spent training</span>
          </div>
          <div className="space-y-3">
            {breakdown.map(exercise => (
              <div key={exercise.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-muted-foreground">{exercise.time}</span>
                </div>
                <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${exercise.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TimeGraph selectedPeriod={selectedPeriod} />
    </div>
  );
}

function TabContent({ tab }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  return (
    <div className="mt-8 space-y-8">
      {/* Time Period Selector */}
      <div className="inline-flex p-1 bg-accent/20 rounded-lg">
        {timePeriods.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              selectedPeriod === period.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {period.name}
          </button>
        ))}
      </div>

      {/* Tab-specific content */}
      {tab === 'general' && <GeneralContent selectedPeriod={selectedPeriod} />}
      {tab === 'rrt' && <RRTContent selectedPeriod={selectedPeriod} />}
      {tab === 'mot' && <MOTContent selectedPeriod={selectedPeriod} />}
      {tab === 'nback' && <NBackContent selectedPeriod={selectedPeriod} />}
      {tab === 'ufov' && <UFOVContent selectedPeriod={selectedPeriod} />}
    </div>
  );
}

function Analytics() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="container py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground max-w-2xl">
          Track your cognitive training progress and performance metrics across all exercises.
        </p>
      </motion.div>

      <div className="border-b">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-colors relative border-b-2",
                "hover:bg-accent/10",
                activeTab === tab.id
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <TabContent tab={activeTab} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Analytics;