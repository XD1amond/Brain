import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getDateIntervals, formatDateLabel, getTodayDate } from '@/lib/dateUtils';
function LineGraph({ title, color = "primary", maxValue = 100, unit = "", selectedPeriod = "week", metric, exercise, selectedStimuli }) {
  // Load analytics from individual storages
  const [rrtAnalytics] = useLocalStorage('rrt_analytics', []);
  const [motAnalytics] = useLocalStorage('mot_analytics', []);
  const [nbackAnalytics] = useLocalStorage('nback_analytics', []);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Get analytics based on exercise type and filters
  const getAnalytics = () => {
    if (!exercise) return [];
    
    switch (exercise) {
      case 'rrt':
        return rrtAnalytics;
      case 'mot':
        return motAnalytics;
      case 'nback':
        if (!selectedStimuli) return nbackAnalytics;
        
        // Get selected stimuli types
        const selectedTypes = Object.entries(selectedStimuli)
          .filter(([key, value]) => key !== 'any' && value)
          .map(([key]) => key);

        return nbackAnalytics.filter(session => {
          // If "Any" is selected or no specific stimuli are selected, include all sessions
          if (selectedStimuli.any || selectedTypes.length === 0) return true;

          // Check if session has activeStimuli and if it has any of the selected stimuli types
          return session.metrics.activeStimuli?.some(type => selectedTypes.includes(type)) ?? false;
        });
      default:
        return [...rrtAnalytics, ...motAnalytics, ...nbackAnalytics];
    }
  };

  // Get real data points from analytics
  const dates = getDateIntervals(selectedPeriod);
  const dataPoints = dates.map(date => {
    const nextDate = new Date(date);
    if (selectedPeriod === 'today') {
      nextDate.setHours(date.getHours() + 4); // Next 4-hour interval
    } else {
      nextDate.setDate(nextDate.getDate() + 1); // Add 1 day for other periods
    }
    
    // Find sessions within this date's range
    const sessions = getAnalytics().filter(session =>
      session.date >= date.getTime() &&
      session.date < nextDate.getTime()
    );

    // Calculate value based on metric type
    let value = 0;
    if (sessions.length > 0) {
      if (metric === 'duration') {
        // Sum up total duration for the period
        value = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      } else if (metric === 'premisesCount' || metric === 'nBackLevel') {
        // Use median for premises and nback level
        const values = sessions.map(session => session.metrics[metric]).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        value = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      } else if (metric === 'percentageCorrect') {
        // Calculate average percentage correct
        value = sessions.reduce((sum, session) => sum + session.metrics[metric], 0) / sessions.length;
      } else if (metric === 'timePerAnswer') {
        // Calculate average time per answer
        value = sessions.reduce((sum, session) => sum + session.metrics[metric], 0) / sessions.length;
      } else if (metric === 'totalBalls' || metric === 'trackingBalls') {
        // Use the last value for balls metrics
        value = sessions[sessions.length - 1]?.metrics[metric] || 0;
      }
    }

    return {
      x: date.getTime(),
      y: Math.round(value),
      date,
      hasSessions: sessions.length > 0
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

  // Filter out points with no value and create coordinates
  const validDataPoints = dataPoints.filter(point => point.hasSessions);
  const points = validDataPoints.map((point, i) => {
    const x = padding + (i * graphWidth) / Math.max(validDataPoints.length - 1, 1);
    const y = padding + graphHeight - (Math.max(0, Math.min(1, (point.y - displayMin) / displayRange)) * graphHeight);
    return { x, y, data: point };
  });

  // Create path from valid points
  const pathD = points.length > 0 ?
    `M${points.map(p => `${p.x},${p.y}`).join(' L')}` : '';

  // Format date for display
  const formatDate = (date) => {
    if (hoveredPoint !== null) {
      if (selectedPeriod === 'today') {
        return date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit'
        });
      }
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
            {dataPoints.map((point, i) =>
              // Only show label if showLabel is true or if it's not today view
              selectedPeriod === 'today' ? (
                point.date.showLabel && (
                  <text
                    key={i}
                    x={padding + (i * graphWidth) / (dataPoints.length - 1)}
                    y={height - padding + 16}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {formatDateLabel(point.date, selectedPeriod)}
                  </text>
                )
              ) : (
                <text
                  key={i}
                  x={padding + (i * graphWidth) / (dataPoints.length - 1)}
                  y={height - padding + 16}
                  textAnchor="middle"
                  className="text-xs fill-muted-foreground"
                >
                  {formatDateLabel(point.date, selectedPeriod)}
                </text>
              )
            )}

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={`hsl(var(--${color}))`}
              strokeWidth="2"
              className="opacity-90 dark:stroke-foreground"
            />

            {/* Area under the line */}
            {points.length > 1 && (
              <path
                d={`${pathD} L${points[points.length - 1].x},${height - padding} L${points[0].x},${height - padding} Z`}
                fill={`hsl(var(--${color}))`}
                className="opacity-20 dark:opacity-30 dark:fill-foreground"
              />
            )}

            {/* Hover area for entire graph */}
            <rect
              x={padding}
              y={padding}
              width={graphWidth}
              height={graphHeight}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const relativeX = (x - padding) / graphWidth;
                if (points.length > 0) {
                  const index = Math.min(
                    Math.floor(relativeX * points.length),
                    points.length - 1
                  );
                  if (index >= 0) {
                    setHoveredPoint(index);
                  }
                }
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              className="cursor-crosshair"
            />

            {/* Data points */}
            {points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={`hsl(var(--${color}))`}
                  className="opacity-90 stroke-2 stroke-background dark:stroke-card dark:fill-foreground"
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
                      {point.data.y}{unit}
                    </text>
                    <text
                      x={point.x}
                      y={point.y - 15}
                      textAnchor="middle"
                      className="text-[10px] fill-muted-foreground"
                    >
                      {formatDate(point.data.date)}
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
        title="Accuracy"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
        exercise="rrt"
      />
      <LineGraph
        title="Premises"
        color="primary"
        maxValue={10}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="premisesCount"
        exercise="rrt"
      />
      <LineGraph
        title="Average Time per Answer"
        color="orange"
        maxValue={60}
        unit="s"
        selectedPeriod={selectedPeriod}
        metric="timePerAnswer"
        exercise="rrt"
      />
    </div>
  );
}

function MOTContent({ selectedPeriod }) {
  return (
    <div className="space-y-6">
      <LineGraph
        title="Accuracy"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
        exercise="mot"
      />
      <LineGraph
        title="Total Balls"
        color="blue"
        maxValue={20}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="totalBalls"
        exercise="mot"
      />
      <LineGraph
        title="Tracking Balls"
        color="purple"
        maxValue={10}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="trackingBalls"
        exercise="mot"
      />
    </div>
  );
}

function NBackContent({ selectedPeriod }) {
  const [gridType, setGridType] = useState('2d');
  const [audioTypes, setAudioTypes] = useState({
    tone: false,
    letters: true,
    numbers: false
  });
  const [selectedStimuli, setSelectedStimuli] = useState({
    any: true,
    position: false,
    color: false,
    audio: false,
    shape: false,
    number: false
  });

  const handleStimuliChange = (key) => {
    if (key === 'any') {
      setSelectedStimuli(prev => prev.any ? {
        any: false,
        position: false,
        color: false,
        audio: false,
        shape: false,
        number: false
      } : { any: true });
    } else {
      setSelectedStimuli(prev => ({
        ...prev,
        any: false,
        [key]: !prev[key]
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 p-4 rounded-lg bg-accent/10">
        <div className="flex flex-wrap gap-4">
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
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Stimuli:</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={selectedStimuli.any}
                onChange={() => handleStimuliChange('any')}
                className="form-checkbox"
              />
              <span>Any</span>
            </label>
            {['position', 'color', 'audio', 'shape', 'number'].map((type) => (
              <div key={type}>
                <label
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    selectedStimuli.any
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedStimuli[type] || false}
                    onChange={() => handleStimuliChange(type)}
                    className="form-checkbox"
                    disabled={selectedStimuli.any}
                  />
                  <span className="capitalize">{type}</span>
                </label>
                {type === 'audio' && selectedStimuli.audio && !selectedStimuli.any && (
                  <div className="ml-8 space-y-2">
                    {['tone', 'letters', 'numbers'].map(audioType => (
                      <label
                        key={audioType}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={audioTypes[audioType]}
                          onChange={() => setAudioTypes(prev => ({
                            ...prev,
                            [audioType]: !prev[audioType]
                          }))}
                          className="form-checkbox"
                        />
                        <span className="capitalize">{audioType}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <LineGraph
        title="Accuracy"
        color="green"
        maxValue={100}
        unit="%"
        selectedPeriod={selectedPeriod}
        metric="percentageCorrect"
        exercise="nback"
        selectedStimuli={selectedStimuli}
      />
      <LineGraph
        title="N-Back Level"
        color="yellow"
        maxValue={5}
        unit=""
        selectedPeriod={selectedPeriod}
        metric="nBackLevel"
        exercise="nback"
        selectedStimuli={selectedStimuli}
      />
    </div>
  );
}

function UFOVContent() {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
      <p className="text-muted-foreground">UFOV analytics are currently under development.</p>
    </div>
  );
}

function TimeGraph({ selectedPeriod }) {
  const [selectedExercise, setSelectedExercise] = useState('total');
  const [rrtAnalytics] = useLocalStorage('rrt_analytics', []);
  const [motAnalytics] = useLocalStorage('mot_analytics', []);
  const [nbackAnalytics] = useLocalStorage('nback_analytics', []);
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
      
      // Get sessions based on selected exercise
      const sessions = (selectedExercise === 'total'
        ? [...rrtAnalytics, ...motAnalytics, ...nbackAnalytics]
        : selectedExercise === 'rrt' ? rrtAnalytics
        : selectedExercise === 'mot' ? motAnalytics
        : selectedExercise === 'nback' ? nbackAnalytics
        : []
      ).filter(session =>
        session.date >= date.getTime() &&
        session.date < nextDate.getTime()
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
        <h3 className="text-lg font-semibold">Training Time</h3>
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
        exercise={selectedExercise}
      />
    </div>
  );
}

const formatDuration = (minutes) => {
  return `${Math.round(minutes)}m`;
};

function GeneralContent({ selectedPeriod }) {
  const [rrtAnalytics] = useLocalStorage('rrt_analytics', []);
  const [motAnalytics] = useLocalStorage('mot_analytics', []);
  const [nbackAnalytics] = useLocalStorage('nback_analytics', []);

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

  // Calculate total time and breakdown from individual analytics
  const getExerciseTime = (analytics) => {
    return analytics
      .filter(session => session.date >= startDate.getTime() && session.date <= now.getTime())
      .reduce((total, session) => total + (session.duration || 0), 0);
  };

  const rrtTime = getExerciseTime(rrtAnalytics);
  const motTime = getExerciseTime(motAnalytics);
  const nbackTime = getExerciseTime(nbackAnalytics);
  const totalMinutes = rrtTime + motTime + nbackTime;

  const totalTime = formatDuration(totalMinutes);
  const breakdown = [
    {
      name: 'RRT',
      time: formatDuration(rrtTime),
      percentage: totalMinutes > 0 ? Math.round((rrtTime / totalMinutes) * 100) : 0
    },
    {
      name: '3D MOT',
      time: formatDuration(motTime),
      percentage: totalMinutes > 0 ? Math.round((motTime / totalMinutes) * 100) : 0
    },
    {
      name: 'N-Back',
      time: formatDuration(nbackTime),
      percentage: totalMinutes > 0 ? Math.round((nbackTime / totalMinutes) * 100) : 0
    }
  ];

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
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  return (
    <div className="mt-8 space-y-8">
      {/* Time Period Selector - Hide for UFOV */}
      {tab !== 'ufov' && (
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
      )}

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