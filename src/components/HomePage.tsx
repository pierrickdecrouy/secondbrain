import { useState, useEffect } from 'react';
import { useCardStore as useCards } from '../store/useCardStore';
import { useUIStore as useUI } from '../store/useUIStore';
import { useDueCards } from '../hooks/useDueCards';
import type { AppSection } from '../App';
import { useTheme } from '../context/ThemeContext';
import { Plus, Command, MagnifyingGlass, Brain, ShareNetwork, BookOpen } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomePageProps {
    onNavigate: (section: AppSection) => void;
    onAddCard: () => void;
}

const SEARCH_PLACEHOLDERS = [
    "Que souhaitez-vous explorer aujourd'hui ?",
    "Rechercher une notion, un concept clé...",
    "Tapez un mot-clé (ex: Diabète, Metformine...)",
    "La réponse est probablement ici...",
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAddCard }) => {
    const { cards } = useCards();
    const { userName, setOmniboxOpen } = useUI();
    const { totalToReview } = useDueCards(cards);
    const { getCategoryColor } = useTheme();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const now = new Date();

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const hour = now.getHours();
        if (hour >= 22 || hour < 5) return 'Bonne nuit';
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    // Prends les 2 cartes les plus récentes pour l'affichage avec le bouton "Nouveau" en 3ème position
    const recentCards = [...cards].sort((a, b) => {
      const dateA = a.createdAt || 0;
      const dateB = b.createdAt || 0;
      return dateB - dateA;
    }).slice(0, 2);

    return (
        <div 
            style={{ 
                width: '100%',
                height: '100%',
                overflowY: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-bg)', 
                backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
                backgroundSize: '40px 40px' 
            }}
        >
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                maxWidth: '900px', 
                margin: '0 auto', 
                width: '100%', 
                padding: '32px 32px',
                justifyContent: 'center'
            }}>
                
                {/* Welcome Message */}
                <div style={{ marginBottom: '24px', paddingLeft: '16px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        {getGreeting()}, <span style={{ color: '#4f46e5' }}>{userName}</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                        Que souhaitez-vous explorer ou réviser aujourd'hui ?
                    </p>
                </div>

                {/* Omnibox (Search) */}
                <div 
                    style={{ width: '100%', position: 'relative', marginBottom: '32px', cursor: 'text' }}
                    onClick={() => setOmniboxOpen(true)}
                >
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '20px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <MagnifyingGlass size={20} color="#14b8a6" weight="bold" />
                    </div>
                    
                    {/* Placeholder Animé */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '56px', right: '80px', display: 'flex', alignItems: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
                        <AnimatePresence mode="wait">
                            <motion.span 
                                key={placeholderIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                style={{ color: '#94a3b8', fontSize: '1rem', whiteSpace: 'nowrap' }}
                            >
                                {SEARCH_PLACEHOLDERS[placeholderIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    <input type="text"
                           style={{
                               width: '100%', padding: '16px 80px 16px 56px', 
                               backgroundColor: 'var(--color-surface)',
                               border: '1px solid var(--color-border)', 
                               borderRadius: '9999px',
                               boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                               fontSize: '1rem', color: '#0f172a',
                               outline: 'none', pointerEvents: 'none'
                           }}
                           readOnly
                    />
                    <div style={{ position: 'absolute', right: '16px', top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            fontSize: '12px', fontWeight: 700, color: '#94a3b8', 
                            backgroundColor: '#f8fafc', padding: '4px 10px', 
                            borderRadius: '6px', border: '1px solid #e2e8f0' 
                        }}>
                            <Command size={14} weight="bold" /> K
                        </span>
                    </div>
                </div>

                {/* BIFURCATION : Apprentissage vs Base de connaissances */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    
                    {/* SRS / Active Recall */}
                    <div 
                        onClick={() => onNavigate('review')}
                        style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            borderRadius: '20px', padding: '20px', 
                            border: '1px solid var(--color-border)', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', 
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            minHeight: '160px'
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Brain size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Sessions</h2>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4f46e5', margin: '2px 0 0 0' }}>
                                        {totalToReview > 0 ? `${totalToReview} attente` : 'À jour'}
                                    </p>
                                </div>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                                L'algorithme a sélectionné les cartes optimales pour aujourd'hui.
                            </p>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={{ 
                                padding: '8px 20px', backgroundColor: '#6366f1', color: 'white', 
                                fontSize: '0.8125rem', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer'
                            }}>
                                {totalToReview > 0 ? 'Commencer' : 'Explorer'}
                            </button>
                        </div>
                    </div>

                    {/* Courses */}
                    <div 
                        onClick={() => onNavigate('courses')}
                        style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            borderRadius: '20px', padding: '20px', 
                            border: '1px solid var(--color-border)', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', 
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            minHeight: '160px'
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BookOpen size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Cours</h2>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#d97706', margin: '2px 0 0 0' }}>
                                        Fiches structurées
                                    </p>
                                </div>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                                Naviguez dans vos fiches de cours et supports documentaires structurés.
                            </p>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={{ 
                                padding: '8px 20px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', 
                                border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '10px', cursor: 'pointer'
                            }}>
                                Lire
                            </button>
                        </div>
                    </div>

                    {/* Second Brain / Knowledge Base */}
                    <div 
                        onClick={() => onNavigate('network')}
                        style={{ 
                            backgroundColor: 'var(--color-surface)', 
                            borderRadius: '20px', padding: '20px', 
                            border: '1px solid var(--color-border)', 
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', 
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            minHeight: '160px'
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#f0fdf4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ShareNetwork size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Graphe</h2>
                                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#059669', margin: '2px 0 0 0' }}>
                                        {cards.length} concept{cards.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                                Explorez visuellement les liens sémantiques entre vos différentes fiches.
                            </p>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={{ 
                                padding: '8px 20px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', 
                                border: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '10px', cursor: 'pointer'
                            }}>
                                Explorer
                            </button>
                        </div>
                    </div>
                </div>

                {/* RECENT ADDITIONS */}
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                            Ajouts récents
                        </h3>
                        <button 
                            onClick={() => onNavigate('cards')} 
                            style={{ 
                                fontSize: '0.8125rem', fontWeight: 600, color: '#4f46e5', 
                                background: 'none', border: 'none', cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: '4px' 
                            }}
                        >
                            Tout parcourir &rarr;
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {recentCards.map(card => (
                            <div 
                                key={card.id} 
                                onClick={() => onNavigate('cards')}
                                style={{ 
                                    backgroundColor: 'var(--color-surface)', padding: '16px', borderRadius: '16px', 
                                    border: '1px solid var(--color-border)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                                    cursor: 'pointer' 
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCategoryColor(card.type) }}></span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: getCategoryColor(card.type) }}>
                                        {card.type}
                                    </span>
                                </div>
                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {card.title}
                                </h4>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {card.subtitle || 'Aucun sous-titre'}
                                </p>
                            </div>
                        ))}
                        
                        {/* New Card Slot */}
                        <div 
                            onClick={onAddCard} 
                            style={{ 
                                backgroundColor: 'transparent', padding: '16px', borderRadius: '16px', 
                                border: '2px dashed var(--color-border)', cursor: 'pointer', 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--color-text-muted)', minHeight: '120px'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-surface)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                                <Plus size={20} weight="bold" />
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Nouvelle fiche</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};
