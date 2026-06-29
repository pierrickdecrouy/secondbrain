import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        title: 'Fonctionnalité premium',
        desc: 'Créez un compte gratuit pour accéder à toutes les fonctionnalités d\'Extnd.',
        icon: '✦',
    },
};

export const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, onSignIn, feature = 'default' }) => {
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
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(6px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            position: 'fixed',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1001,
                            width: '100%', maxWidth: 400,
                            margin: '0 20px',
                            background: 'linear-gradient(135deg, #1e1b4b, #1a1a4e)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '24px',
                            padding: '36px 32px',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            textAlign: 'center',
                        }}
                    >
                        {/* Accent */}
                        <div style={{ height: '1.5px', background: 'linear-gradient(90deg, transparent, #10b981 30%, #6366f1 70%, transparent)', borderRadius: '1px', marginBottom: '28px' }} />

                        {/* Icon */}
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px', lineHeight: 1 }}>{info.icon}</div>

                        <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                            {info.title}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 28px' }}>
                            {info.desc}
                        </p>

                        {/* CTA */}
                        <motion.button
                            onClick={onSignIn}
                            whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(16,185,129,0.4)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white', border: 'none',
                                borderRadius: '14px', padding: '14px',
                                fontSize: '0.95rem', fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                                marginBottom: '12px',
                            }}
                        >
                            Créer un compte gratuit
                        </motion.button>

                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            Continuer sans compte
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
