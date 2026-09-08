import { motion } from 'framer-motion';

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.06, delayChildren: 0.02 },
    },
};

const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export function RevealGroup({ children, className = '' }) {
    return (
        <motion.div className={className} variants={container} initial="hidden" animate="show">
            {children}
        </motion.div>
    );
}

export function RevealItem({ children, className = '' }) {
    return (
        <motion.div className={className} variants={item}>
            {children}
        </motion.div>
    );
}
