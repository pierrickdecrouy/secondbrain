import React from 'react';
import { X, ClockCounterClockwise } from '@phosphor-icons/react';
import type { Card } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CardHistoryModalProps {
    card: Card;
    onClose: () => void;
}

export const CardHistoryModal: React.FC<CardHistoryModalProps> = ({ card, onClose }) => {
    const history = card.history || [];
    const modalRef = useFocusTrap(true);
    
    return (
        <div className="modal-overlay z-[1100]" >
            <div ref={modalRef} className="modal-content flex flex-col p-0 max-w-[600px] max-h-[80vh]" >
                <header className="modal-header px-8 py-6 border-b border-slate-200 dark:border-slate-800" >
                    <div className="flex items-center gap-3" >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center" >
                            <ClockCounterClockwise size={22} weight="bold" />
                        </div>
                        <div>
                            <h2 className="modal-title text-[1.2rem] font-semibold m-0 text-slate-900 dark:text-slate-100" >Historique des modifications</h2>
                            <p className="mt-1 mb-0 text-[0.9rem] text-slate-500 dark:text-slate-400" >{card.title}</p>
                        </div>
                    </div>
                    <button className="modal-close bg-transparent border-none cursor-pointer text-slate-500 dark:text-slate-400" onClick={onClose} title="Fermer" >
                        <X size={24} weight="bold" />
                    </button>
                </header>
                
                <div  className="custom-scrollbar px-8 py-6 overflow-y-auto flex-1">
                    {history.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-center my-10" >Aucun historique disponible pour cette fiche.</p>
                    ) : (
                        <div className="flex flex-col gap-6" >
                            {[...history].reverse().map((entry, index) => (
                                <div key={index} className="flex gap-4" >
                                    <div className="flex flex-col items-center" >
                                        <div className="w-3 h-3 rounded-full mt-1.5" style={{
  background: entry.action === 'create' ? '#10b981' : '#3b82f6'
}} />
                                        {index !== history.length - 1 && <div className="w-[2px] flex-1 bg-slate-200 dark:bg-slate-800 my-1"  />}
                                    </div>
                                    <div className="flex-1" style={{
  paddingBottom: index !== history.length - 1 ? '24px' : 0
}}>
                                        <div className="flex justify-between items-start mb-2" >
                                            <span className="font-semibold text-[0.95rem] text-slate-900 dark:text-slate-100" >
                                                {entry.action === 'create' ? 'Création' : 'Mise à jour'}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400" >
                                                {new Date(entry.timestamp).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        {entry.userId && (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2" >
                                                Auteur: {entry.userId}
                                            </div>
                                        )}
                                        {entry.diff && Object.entries(entry.diff).map(([key, changes]) => (
                                            <div key={key} className="mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800" >
                                                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2" >{key}</div>
                                                <div className="flex flex-col gap-2" >
                                                    <div className="text-[0.85rem] text-rose-500 bg-rose-500/5 px-2.5 py-1.5 rounded line-through" >
                                                        {changes.old || '(vide)'}
                                                    </div>
                                                    <div className="text-[0.85rem] text-emerald-500 bg-emerald-500/5 px-2.5 py-1.5 rounded" >
                                                        {changes.new || '(vide)'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
