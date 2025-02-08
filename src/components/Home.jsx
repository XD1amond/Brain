import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const exercises = [
  {
    title: 'RRT',
    description: 'Reasonal Relational Training',
    details: 'Enhance logical reasoning through temporal, spatial, and abstract relationships.',
    path: '/rrt',
    color: 'from-blue-500 to-indigo-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: '3D MOT',
    description: 'Multiple Object Tracking',
    details: 'Track multiple objects in 3D space to improve spatial awareness and attention.',
    path: '/mot',
    color: 'from-emerald-500 to-teal-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    title: 'N-Back',
    description: 'Working Memory Training',
    details: 'Challenge your working memory with position, color, audio, and shape stimuli.',
    path: '/nback',
    color: 'from-purple-500 to-pink-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    )
  },
  {
    title: 'UFOV',
    description: 'Coming Soon',
    details: 'Enhance visual processing speed and peripheral awareness.',
    path: '/ufov',
    color: 'from-orange-500 to-red-500',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Train Your Brain
            </h1>
            <p className="text-xl text-muted-foreground mb-12">
              Enhance your cognitive abilities with scientifically-designed exercises targeting different aspects of mental performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Exercises Grid */}
      <section className="py-24 flex-grow">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.path}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <Link
                  to={exercise.path}
                  className={cn(
                    "block p-8 rounded-2xl overflow-hidden",
                    "bg-gradient-to-br",
                    exercise.color,
                    "hover:shadow-xl transition-all duration-300",
                    "text-white"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      {exercise.icon}
                      <div>
                        <h3 className="text-2xl font-bold">{exercise.title}</h3>
                        <p className="text-white/80">{exercise.description}</p>
                      </div>
                    </div>
                    <p className="text-white/90">{exercise.details}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/10" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}