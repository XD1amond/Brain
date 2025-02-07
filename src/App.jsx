import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './components/Home';
import RRT from './components/exercises/RRT';
import MOT from './components/exercises/MOT';
import NBack from './components/exercises/NBack';
import { ANIMATION_VARIANTS, TRANSITION_SPRING } from './lib/utils';

const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      transition={TRANSITION_SPRING}
      className="min-h-screen w-full"
    >
      {children}
    </motion.div>
  );
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="relative w-24 h-24 mx-auto mb-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-full h-full text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </motion.div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Coming Soon</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're working hard to bring you this exciting new feature. Stay tuned for updates!
        </p>
      </motion.div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <PageTransition>
                  <Home />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/rrt"
            element={
              <ErrorBoundary>
                <PageTransition>
                  <RRT />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/mot"
            element={
              <ErrorBoundary>
                <PageTransition>
                  <MOT />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/nback"
            element={
              <ErrorBoundary>
                <PageTransition>
                  <NBack />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/ufov"
            element={
              <ErrorBoundary>
                <PageTransition>
                  <ComingSoon />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast',
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </>
  );
}

export default App;