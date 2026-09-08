import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../Icon';

export default function BottomSheet({ open, onClose, title, children }) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed left-0 right-0 bottom-0 z-50 bg-panel border-t border-line rounded-t-[28px] sm:rounded-t-3xl sm:max-w-md sm:mx-auto sm:left-0 sm:right-0 shadow-2xl"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 120 || info.velocity.y > 600) onClose();
                        }}
                    >
                        <div className="flex justify-center pt-2.5 pb-1">
                            <span className="w-9 h-1.5 rounded-full bg-line" />
                        </div>
                        <div className="flex items-center justify-between px-5 pt-1 pb-3">
                            <h3 className="font-display font-extrabold text-lg text-ink">{title}</h3>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-panel-soft flex items-center justify-center text-muted">
                                <Icon name="close" size={17} />
                            </button>
                        </div>
                        <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
