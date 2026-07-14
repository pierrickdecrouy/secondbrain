import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignIn: () => void;
    feature?: string;
}

const FEATURE_LABELS: Record<string, { title: string; desc: string; icon: string }> = {
    network: {
        title: 'Graphe de connaissances',
        desc: 'Visualisez les connexions entre vos fiches et naviguez dans votre second cerveau.',
        icon: '🕸️',
    },
    stats: {
        title: 'Statistiques',
        desc: 'Suivez votre progression, votre rétention et vos performances de révision.',
        icon: '📊',
    },
    settings: {
        title: 'Paramètres',
        desc: 'Personnalisez l\'application et gérez votre profil.',
        icon: '⚙️',
    },
    default: {
        title: 'Fonctionnalité Premium',
        desc: 'Connectez-vous pour profiter de cette fonctionnalité et bien plus encore.',
        icon: '✨',
    },
};

export const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, onSignIn, feature = 'default' }) => {
    const modalRef = useFocusTrap(isOpen);
    const info = FEATURE_LABELS[feature] ?? FEATURE_LABELS.default;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-[6px]"
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        key="modal"
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-[calc(100%-40px)] max-w-[400px] border border-white/10 rounded-[24px] py-9 px-8 text-center font-sans shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]"
                        style={{ background: 'linear-gradient(135deg, #1e1b4b, #1a1a4e)' }}
                    >
                        {/* Accent */}
                        <div className="h-[1.5px] rounded-[1px] mb-7" style={{ background: 'linear-gradient(90deg, transparent, #10b981 30%, #6366f1 70%, transparent)' }} />

                        {/* Icon */}
                        <div className="text-[2.5rem] mb-4 leading-none">{info.icon}</div>

                        <h2 className="text-white text-xl font-bold m-0 mb-2.5 tracking-[-0.02em]">
                            {info.title}
                        </h2>
                        <p className="text-white/50 text-[0.875rem] leading-[1.65] m-0 mb-7">
                            {info.desc}
                        </p>

                        {/* CTA */}
                        <motion.button
                            onClick={onSignIn}
                            whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(16,185,129,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full text-white border-none rounded-[14px] p-3.5 text-[0.95rem] font-bold cursor-pointer font-inherit shadow-[0_4px_20px_rgba(16,185,129,0.3)] mb-3"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                            Créer un compte gratuit
                        </motion.button>

                        <button
                            onClick={onClose}
                            className="bg-transparent border-none text-white/30 text-[0.8rem] cursor-pointer font-inherit hover:text-white/50 transition-colors"
                        >
                            Continuer sans compte
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
