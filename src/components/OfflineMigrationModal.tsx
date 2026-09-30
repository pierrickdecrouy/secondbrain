import React, { useState } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useAuth } from '../context/AuthContext';
import { useCardStore } from '../store/useCardStore';
import { cardSyncService } from '../services/cardSyncService';
import { clearOfflineCards } from '../storage';
import { toast } from '../store/useToastStore';
import { CloudArrowUp, X } from '@phosphor-icons/react';
import type { Card } from '../types';

export const OfflineMigrationModal: React.FC = () => {
    const { pendingOfflineCards, setPendingOfflineCards } = useUIStore();
    const { user } = useAuth();
    const { cards, setCards } = useCardStore();
    const [isMigrating, setIsMigrating] = useState(false);

    if (!pendingOfflineCards || pendingOfflineCards.length === 0 || !user) {
        return null;
    }

    const handleAdopt = async () => {
        setIsMigrating(true);
        try {
            const mergedCards = [...cards];
            let migratedCount = 0;
            
            for (const localCard of pendingOfflineCards) {
                const adopted: Card = { ...localCard, ownerUid: user.uid };
                const idx = mergedCards.findIndex(c => c.id === adopted.id);
                if (idx >= 0) mergedCards[idx] = adopted;
                cardSyncService.saveCard(adopted);
                migratedCount++;
            }
            
            await clearOfflineCards();
            
            setCards(mergedCards, false);
            toast.success(`✓ ${migratedCount} fiche${migratedCount > 1 ? 's' : ''} hors-ligne migrée${migratedCount > 1 ? 's' : ''} vers votre compte.`);
            setPendingOfflineCards(null);
        } catch (error) {
            console.error('Migration failed:', error);
            toast.error('Échec de la migration. Veuillez réessayer.');
        } finally {
            setIsMigrating(false);
        }
    };

    const handleIgnore = () => {
        sessionStorage.setItem('extnd_ignore_offline', 'true');
        setPendingOfflineCards(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                            <CloudArrowUp size={28} weight="duotone" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Données Hors-ligne</h2>
                        </div>
                        <button 
                            onClick={handleIgnore}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={20} weight="bold" />
                        </button>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Vous avez <strong className="text-indigo-600 dark:text-indigo-400">{pendingOfflineCards.length}</strong> fiche(s) créée(s) hors-ligne. Voulez-vous les fusionner avec votre compte synchronisé ?
                    </p>
                    
                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={handleIgnore}
                            disabled={isMigrating}
                            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 border-none outline-none cursor-pointer bg-transparent"
                        >
                            Ignorer pour cette session
                        </button>
                        <button
                            onClick={handleAdopt}
                            disabled={isMigrating}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2 border-none outline-none cursor-pointer"
                        >
                            {isMigrating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Fusion...</span>
                                </>
                            ) : (
                                <>
                                    <CloudArrowUp size={18} weight="bold" />
                                    <span>Fusionner</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
