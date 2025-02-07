import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(number) {
  return new Intl.NumberFormat().format(number);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateAccuracy(correct, total) {
  if (total === 0) return 0;
  return (correct / total) * 100;
}

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert'
};

export const EXERCISE_TYPES = {
  RRT: 'rrt',
  MOT: 'mot',
  NBACK: 'nback',
  UFOV: 'ufov'
};

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
};

export const TRANSITION_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

export const GAME_STATES = {
  SETUP: 'setup',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  FINISHED: 'finished'
};

export function getExerciseConfig(type, difficulty) {
  const configs = {
    [EXERCISE_TYPES.RRT]: {
      [DIFFICULTY_LEVELS.EASY]: { premises: 2, timeLimit: 30 },
      [DIFFICULTY_LEVELS.MEDIUM]: { premises: 3, timeLimit: 25 },
      [DIFFICULTY_LEVELS.HARD]: { premises: 4, timeLimit: 20 },
      [DIFFICULTY_LEVELS.EXPERT]: { premises: 5, timeLimit: 15 }
    },
    [EXERCISE_TYPES.MOT]: {
      [DIFFICULTY_LEVELS.EASY]: { balls: 6, targets: 2, speed: 3 },
      [DIFFICULTY_LEVELS.MEDIUM]: { balls: 8, targets: 3, speed: 4 },
      [DIFFICULTY_LEVELS.HARD]: { balls: 10, targets: 4, speed: 5 },
      [DIFFICULTY_LEVELS.EXPERT]: { balls: 12, targets: 5, speed: 6 }
    },
    [EXERCISE_TYPES.NBACK]: {
      [DIFFICULTY_LEVELS.EASY]: { n: 1, stimuli: 1 },
      [DIFFICULTY_LEVELS.MEDIUM]: { n: 2, stimuli: 2 },
      [DIFFICULTY_LEVELS.HARD]: { n: 3, stimuli: 3 },
      [DIFFICULTY_LEVELS.EXPERT]: { n: 4, stimuli: 4 }
    }
  };

  return configs[type]?.[difficulty] || configs[type]?.[DIFFICULTY_LEVELS.MEDIUM];
}