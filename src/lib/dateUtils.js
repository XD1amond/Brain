// Helper function to get date intervals based on time period
export const getDateIntervals = (selectedPeriod) => {
  // Get the current date from the system
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (selectedPeriod) {
    case 'today':
      // For today, show hourly intervals from midnight to current hour
      const currentHour = now.getHours();
      return Array.from({ length: currentHour + 1 }, (_, i) => {
        const date = new Date(startOfDay);
        date.setHours(i);
        return date;
      });
    case 'week':
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfDay);
        date.setDate(date.getDate() - (6 - i));
        return date;
      });
    case 'month':
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(startOfDay);
        date.setDate(date.getDate() - (30 - i * 6));
        return date;
      });
    case '3months':
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(startOfDay);
        date.setDate(date.getDate() - (90 - i * 18));
        return date;
      });
    case 'year':
      return Array.from({ length: 6 }, (_, i) => {
        const date = new Date(startOfDay);
        date.setMonth(date.getMonth() - (12 - i * 2));
        return date;
      });
    default: // all time - show last 2 years up to current month
      const intervals = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(startOfDay);
        // Start from 24 months ago, increment by 5 months each time, with the last point being current month
        const monthsAgo = i === 5 ? 0 : 24 - (i * 5);
        date.setMonth(date.getMonth() - monthsAgo);
        intervals.push(date);
      }
      return intervals;
  }
};

// Format date label based on time period
export const formatDateLabel = (date, selectedPeriod) => {
  switch (selectedPeriod) {
    case 'today':
      const hour = date.getHours();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}${ampm}`;
    case 'week':
      return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
    case 'month':
      return date.getDate();
    case '3months':
      return `${date.toLocaleDateString(undefined, { month: 'short' }).slice(0, 3)} ${date.getDate()}`;
    case 'year':
      return date.toLocaleDateString(undefined, { month: 'short' }).slice(0, 3);
    default:
      return `${date.toLocaleDateString(undefined, { month: 'short' }).slice(0, 3)} '${date.getFullYear().toString().slice(2)}`;
  }
};