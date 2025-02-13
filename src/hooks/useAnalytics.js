import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const ANALYTICS_KEY = 'brain_training_analytics';

// Helper to get today's date at midnight for consistent date comparisons
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

// Helper to format duration in minutes to hours and minutes string
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export function useAnalytics() {
  const [analytics, setAnalytics] = useLocalStorage(ANALYTICS_KEY, {
    sessions: [], // Array of all training sessions with metrics
  });

  // Record a completed training session
  const recordSession = (data) => {
    const timestamp = Date.now();
    const newSession = {
      timestamp,
      date: getTodayDate(),
      ...data,
    };

    setAnalytics(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
    }));
  };

  // Get sessions within a date range
  const getSessionsInRange = (startDate, endDate) => {
    return analytics.sessions.filter(
      session => session.date >= startDate && session.date <= endDate
    );
  };

  // Get sessions for a specific exercise
  const getExerciseSessions = (exercise, startDate, endDate) => {
    return getSessionsInRange(startDate, endDate)
      .filter(session => session.exercise === exercise);
  };

  // Calculate total training time for an exercise or all exercises
  const getTrainingTime = (exercise = null, startDate = 0, endDate = Date.now()) => {
    const sessions = exercise 
      ? getExerciseSessions(exercise, startDate, endDate)
      : getSessionsInRange(startDate, endDate);
    
    const totalMinutes = sessions.reduce((total, session) => total + (session.duration || 0), 0);
    return formatDuration(totalMinutes);
  };

  // Get exercise-specific metrics
  const getMetrics = (exercise, metric, startDate = 0, endDate = Date.now()) => {
    const sessions = getExerciseSessions(exercise, startDate, endDate);
    if (!sessions.length) return [];

    return sessions.map(session => ({
      date: session.date,
      value: session.metrics?.[metric] || 0
    }));
  };

  // Get training time breakdown
  const getTimeBreakdown = (startDate = 0, endDate = Date.now()) => {
    const exercises = ['rrt', 'mot', 'nback', 'ufov'];
    const totalMinutes = exercises.reduce((total, exercise) => {
      const sessions = getExerciseSessions(exercise, startDate, endDate);
      return total + sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    }, 0);

    return exercises.map(exercise => {
      const sessions = getExerciseSessions(exercise, startDate, endDate);
      const minutes = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      
      return {
        name: exercise.toUpperCase(),
        time: formatDuration(minutes),
        percentage
      };
    });
  };

  return {
    analytics,
    recordSession,
    getSessionsInRange,
    getExerciseSessions,
    getTrainingTime,
    getMetrics,
    getTimeBreakdown,
  };
}