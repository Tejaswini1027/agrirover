import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

export default function Counter({ value, decimals = 0, className = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });
    const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.6 });
    const display = useTransform(spring, (v) => v.toFixed(decimals));

    useEffect(() => {
        if (inView) spring.set(value);
    }, [inView, value, spring]);

    return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
