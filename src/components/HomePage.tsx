import { useState, useEffect } from 'react';
import { useCardStore as useCards } from '../store/useCardStore';
import { useUIStore as useUI } from '../store/useUIStore';
import { useDueCards } from '../hooks/useDueCards';
import type { AppSection } from '../App';
import { useTheme } from '../context/ThemeContext';
import { Plus, Command, MagnifyingGlass, Brain, ShareNetwork, BookOpen } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/HomePage.css';

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
        <div className="homepage-container">
            <main className="homepage-main">
                
                {/* Welcome Message */}
                <div className="homepage-welcome">
                    <h1>
                        {getGreeting()}, <span className="homepage-welcome-name">{userName}</span>
                    </h1>
                    <p>
                        Que souhaitez-vous explorer ou réviser aujourd'hui ?
                    </p>
                </div>

                {/* Omnibox (Search) */}
                <div 
                    className="homepage-search-container"
                    onClick={() => setOmniboxOpen(true)}
                >
                    <div className="homepage-search-icon">
                        <MagnifyingGlass size={20} color="#14b8a6" weight="bold" />
                    </div>
                    
                    {/* Placeholder Animé */}
                    <div className="homepage-search-placeholder">
                        <AnimatePresence mode="wait">
                            <motion.span 
                                key={placeholderIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="homepage-search-placeholder-text"
                            >
                                {SEARCH_PLACEHOLDERS[placeholderIndex]}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    <input type="text"
                           className="homepage-search-input"
                           readOnly
                    />
                    <div className="homepage-search-kbd-container">
                        <span className="homepage-search-kbd">
                            <Command size={14} weight="bold" /> K
                        </span>
                    </div>
                </div>

                {/* BIFURCATION : Apprentissage vs Base de connaissances */}
                <div className="homepage-cards-grid">
                    
                    {/* SRS / Active Recall */}
                    <div 
                        onClick={() => onNavigate('review')}
                        className="homepage-action-card"
                    >
                        <div>
                            <div className="homepage-action-card-header">
                                <div className="homepage-action-card-icon sessions">
                                    <Brain size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2>Sessions</h2>
                                    <p className="homepage-action-card-subtitle sessions">
                                        {totalToReview > 0 ? `${totalToReview} attente` : 'À jour'}
                                    </p>
                                </div>
                            </div>
                            <p>
                                L'algorithme a sélectionné les cartes optimales pour aujourd'hui.
                            </p>
                        </div>
                        <div className="homepage-action-card-footer">
                            <button className="homepage-action-card-button primary">
                                {totalToReview > 0 ? 'Commencer' : 'Explorer'}
                            </button>
                        </div>
                    </div>

                    {/* Courses */}
                    <div 
                        onClick={() => onNavigate('courses')}
                        className="homepage-action-card"
                    >
                        <div>
                            <div className="homepage-action-card-header">
                                <div className="homepage-action-card-icon courses">
                                    <BookOpen size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2>Cours</h2>
                                    <p className="homepage-action-card-subtitle courses">
                                        Fiches structurées
                                    </p>
                                </div>
                            </div>
                            <p>
                                Naviguez dans vos fiches de cours et supports documentaires structurés.
                            </p>
                        </div>
                        <div className="homepage-action-card-footer">
                            <button className="homepage-action-card-button secondary">
                                Lire
                            </button>
                        </div>
                    </div>

                    {/* Second Brain / Knowledge Base */}
                    <div 
                        onClick={() => onNavigate('network')}
                        className="homepage-action-card"
                    >
                        <div>
                            <div className="homepage-action-card-header">
                                <div className="homepage-action-card-icon network">
                                    <ShareNetwork size={24} weight="duotone" />
                                </div>
                                <div>
                                    <h2>Graphe</h2>
                                    <p className="homepage-action-card-subtitle network">
                                        {cards.length} concept{cards.length > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <p>
                                Explorez visuellement les liens sémantiques entre vos différentes fiches.
                            </p>
                        </div>
                        <div className="homepage-action-card-footer">
                            <button className="homepage-action-card-button secondary">
                                Explorer
                            </button>
                        </div>
                    </div>
                </div>

                {/* RECENT ADDITIONS */}
                <div className="homepage-recent-section">
                    <div className="homepage-recent-header">
                        <h3>Ajouts récents</h3>
                        <button onClick={() => onNavigate('cards')}>
                            Tout parcourir &rarr;
                        </button>
                    </div>
                    
                    <div className="homepage-recent-grid">
                        {recentCards.map(card => (
                            <div 
                                key={card.id} 
                                onClick={() => onNavigate('cards')}
                                className="homepage-recent-card"
                            >
                                <div className="homepage-recent-card-type-container">
                                    <span 
                                        className="homepage-recent-card-type-dot"
                                        style={{ backgroundColor: getCategoryColor(card.type) }}
                                    ></span>
                                    <span 
                                        className="homepage-recent-card-type-text"
                                        style={{ color: getCategoryColor(card.type) }}
                                    >
                                        {card.type}
                                    </span>
                                </div>
                                <h4>{card.title}</h4>
                                <p>{card.subtitle || 'Aucun sous-titre'}</p>
                            </div>
                        ))}
                        
                        {/* New Card Slot */}
                        <div 
                            onClick={onAddCard} 
                            className="homepage-new-card-slot"
                        >
                            <div className="homepage-new-card-icon">
                                <Plus size={20} weight="bold" />
                            </div>
                            <span>Nouvelle fiche</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};
