import { motion, AnimatePresence } from 'framer-motion';

const transition = {
  type: 'spring',
  stiffness: 120,
  damping: 20,
  mass: 1,
};

const variants = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -60 },
};

export default function Scene({ children, id, className = '' }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
        className={className}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
