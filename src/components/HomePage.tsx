import { useState, useEffect } from 'react';

import {
    MagnifyingGlass, Plus,
    BookOpen, Brain
} from '@phosphor-icons/react';
import { useCards } from '../context/CardContext';
import { useUI } from '../context/UIContext';

interface HomePageProps {
    onNavigate: (section: string) => void;
    onAddCard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAddCard }) => {
    const { cards } = useCards();
    const { userName, setOmniboxOpen } = useUI();
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const placeholders = [
        "Que souhaitez-vous explorer aujourd'hui ?",
        "Rechercher une pathologie, un symptôme...",
        "Plonger dans un cours de physiologie...",
        "Vérifier la posologie d'un médicament...",
        "Reprendre vos révisions en cours..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const now = new Date();
    const dueCards = cards.filter(c => c.progress?.status === 'review' && c.progress.dueDate && new Date(c.progress.dueDate) <= now);
    const learningCards = cards.filter(c => c.progress?.status === 'learning' && c.progress.dueDate && new Date(c.progress.dueDate) <= now);
    const totalToReview = dueCards.length + learningCards.length;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 5) return 'Bonne nuit';
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className="home-page">
            <div className="home-animated-bg" />

            {/* Main Center Content */}
            <div className="home-content app-no-drag" style={{ paddingTop: '2rem' }}>
                <h1 className="home-greeting" style={{ width: '100%', textAlign: 'left' }}>
                    {getGreeting()}, <span style={{ marginLeft: '12px' }}>{userName}</span>
                </h1>
                <p className="home-subtitle" style={{ minHeight: '1.5rem', transition: 'opacity 0.5s ease-in-out', width: '100%', textAlign: 'left', paddingLeft: '0' }}>
                    {placeholders[placeholderIndex]}
                </p>

                {/* Search Bar (Omnibox) */}
                <form className="home-search" onSubmit={(e) => {
                    e.preventDefault();
                    setOmniboxOpen(true);
                }}>
                    <div className="home-search-box">
                        <MagnifyingGlass size={22} className="home-search-icon" weight="regular" />
                        <input
                            type="text"
                            name="search"
                            placeholder="Rechercher une fiche, une pathologie..."
                            value=""
                            onChange={() => {}}
                            onFocus={(e) => {
                                e.target.blur();
                                setOmniboxOpen(true);
                            }}
                            autoComplete="off"
                        />
                    </div>
                </form>

                {/* Quick Actions & Review Status */}
                <div className="home-quick-actions" style={{ margin: '3rem auto 0', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '600px' }}>
                    {/* Review Status Card */}
                    <button 
                        className={`review-status-card ${totalToReview > 0 ? 'has-reviews' : 'all-done'}`} 
                        onClick={() => onNavigate('review')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1.5rem 2rem', borderRadius: '16px',
                            
                            
                            
                            cursor: 'pointer', transition: 'all 0.3s ease', width: '100%'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '12px', 
                                background: totalToReview > 0 ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-bg)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: totalToReview > 0 ? 'var(--color-physio)' : 'var(--color-text-muted)'
                            }}>
                                <Brain size={28} weight={totalToReview > 0 ? "fill" : "duotone"} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>Sessions de Révision</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: totalToReview > 0 ? 'var(--color-physio)' : 'var(--color-text-muted)', fontWeight: totalToReview > 0 ? 600 : 400 }}>
                                    {totalToReview > 0 ? `${totalToReview} carte${totalToReview > 1 ? 's' : ''} en attente` : 'Aucune révision due pour le moment'}
                                </p>
                            </div>
                        </div>
                        {totalToReview > 0 && (
                            <div style={{ background: 'var(--color-physio)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 700 }}>
                                Commencer
                            </div>
                        )}
                    </button>

                    {/* Secondary Actions */}
                    <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                        <button 
                            className="secondary-action-btn" 
                            onClick={() => {
                                onNavigate('cards');
                            }}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                padding: '1rem', borderRadius: '12px', color: 'var(--color-text)'
                            }}
                        >
                            <BookOpen size={20} weight="duotone" className="text-slate-500" />
                            Parcourir
                        </button>
                        <button 
                            className="secondary-action-btn" 
                            onClick={onAddCard}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                padding: '1rem', borderRadius: '12px', color: 'var(--color-text)'
                            }}
                        >
                            <Plus size={20} weight="bold" className="text-slate-500" />
                            Nouvelle fiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
