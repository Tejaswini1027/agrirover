import { useRef } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import TileArt from './TileArt';
import { RevealItem } from './motion/Reveal';

function handleMove(e, ref) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--gy', `${e.clientY - rect.top}px`);
}

export default function Panel({ title, icon, action, className = '', children, tight = false, glow = true, art, as = RevealItem }) {
    const ref = useRef(null);
    const Wrapper = as;

    const content = (
        <div
            ref={ref}
            onMouseMove={glow ? (e) => handleMove(e, ref) : undefined}
            className={`group relative overflow-hidden ${art ? 'isolate' : ''} bg-panel border border-line rounded-3xl card-lift ${tight ? 'p-4' : 'p-5'} ${className}`}
        >
            {art && <TileArt name={art} opacity={0.36} width="48%" />}
            {glow && (
                <div
                    className="pointer-events-none absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: 'radial-gradient(220px circle at var(--gx, 50%) var(--gy, 50%), color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%)',
                    }}
                />
            )}
            {(title || action) && (
                <div className="relative z-10 flex items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {icon && (
                            <span className="w-8 h-8 rounded-xl bg-panel-soft flex items-center justify-center shrink-0">
                                <Icon name={icon} size={17} className="text-muted" />
                            </span>
                        )}
                        <h3 className="font-display font-bold text-[15px] text-ink truncate">{title}</h3>
                    </div>
                    {action}
                </div>
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );

    if (Wrapper === false) return content;
    return <Wrapper className="block">{content}</Wrapper>;
}

export function TapScale({ children, className = '', ...props }) {
    return (
        <motion.div whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={className} {...props}>
            {children}
        </motion.div>
    );
}
