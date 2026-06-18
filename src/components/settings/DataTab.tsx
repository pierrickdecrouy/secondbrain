import React, { useState } from 'react';
import { Database, UploadSimple, DownloadSimple, Trash, ShieldWarning } from '@phosphor-icons/react';
import { useCards } from '../../context/CardContext';
import { useToast } from '../../context/ToastContext';
import { importAnkiPackage } from '../../ankiImport';
import { saveCardsAsync, exportAllData, importAllData, resetToDefaults } from '../../storage';

export const DataTab: React.FC = () => {
    const { cards } = useCards();
    const { showToast } = useToast();
    const [isImportingAnki, setIsImportingAnki] = useState(false);
    const [ankiImportProgress, setAnkiImportProgress] = useState('');

    const handleReset = () => {
        if (window.confirm('Voulez-vous vraiment réinitialiser le dictionnaire par défaut ?')) {
            resetToDefaults();
            window.location.reload();
        }
    };

    return (
        <div className="flex-1 p-5 md:p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border)] hover:scrollbar-thumb-[var(--color-text-muted)] max-w-[800px] mx-auto w-full">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#4fb28626] rounded-2xl flex items-center justify-center mx-auto mb-5 text-[var(--color-drug)]">
                    <Database size={32} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2.5">Gestion des données</h2>
                <p className="text-[var(--color-text-muted)]">Sauvegardez, restaurez, ou réinitialisez vos données en toute sécurité.</p>
            </div>

            {/* Import Anki */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6 flex flex-col gap-4">
                <h3 className="text-[1.1rem] font-bold text-[var(--color-text)] mb-2">Import Anki (.apkg)</h3>
                <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-relaxed">
                    Importez vos fiches depuis un paquet Anki. Pour l'instant, seuls les textes sont importés (les images sont ignorées).
                    Les fiches seront placées dans la catégorie "Données" avec l'étiquette "Anki".
                </p>
                
                <div className="flex gap-4 mt-3 items-center">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".apkg"
                            id="anki-upload"
                            className="hidden"
                            disabled={isImportingAnki}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsImportingAnki(true);
                                setAnkiImportProgress('Initialisation...');
                                try {
                                    const importedCards = await importAnkiPackage(file, setAnkiImportProgress);
                                    const newCards = [...cards, ...importedCards];
                                    await saveCardsAsync(newCards);
                                    showToast(`${importedCards.length} fiches importées avec succès !`, 'success');
                                    setTimeout(() => window.location.reload(), 1500);
                                } catch (err: any) {
                                    showToast(err.message || 'Erreur lors de l\'import Anki', 'error');
                                    setIsImportingAnki(false);
                                }
                            }}
                        />
                        <label 
                            htmlFor="anki-upload"
                            className={`py-2.5 px-5 font-semibold rounded-xl text-[0.9rem] flex items-center gap-2 transition-all duration-200 ${isImportingAnki ? 'bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed opacity-70' : 'bg-[var(--color-drug)] text-white cursor-pointer hover:opacity-90'}`}
                        >
                            <UploadSimple size={18} weight="bold" />
                            {isImportingAnki ? 'Import en cours...' : 'Importer un fichier .apkg'}
                        </label>
                    </div>
                    {isImportingAnki && (
                        <span className="text-[0.85rem] text-[var(--color-drug)] font-medium">
                            {ankiImportProgress}
                        </span>
                    )}
                </div>
            </div>

            {/* BACKUP & RESTORE */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6 flex flex-col gap-4">
                <h3 className="text-[1.1rem] font-bold text-[var(--color-text)] mb-2">Sauvegarde Complète</h3>
                <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-relaxed">
                    Créez une sauvegarde de tout votre système (Fiches, Abréviations, Statistiques d'apprentissage, Paramètres).
                </p>
                
                <div className="flex gap-4 mt-3">
                    <button
                        onClick={async () => {
                            const data = await exportAllData();
                            const blob = new Blob([data], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `pharma-brain-full-backup-${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }}
                        className="py-2.5 px-5 bg-[var(--color-drug)] text-white font-semibold rounded-xl cursor-pointer border-none text-[0.9rem] flex items-center gap-2 transition-opacity duration-200 hover:opacity-90"
                    >
                        <DownloadSimple size={18} weight="bold" />
                        Télécharger le Backup
                    </button>

                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".json"
                            id="restore-upload"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = async (ev) => {
                                    try {
                                        const content = ev.target?.result as string;
                                        if (confirm("ATTENTION : Cette action va ÉCRASER toutes vos données actuelles. Voulez-vous continuer ?")) {
                                            await importAllData(content);
                                            window.location.reload();
                                        }
                                    } catch (err) {
                                        showToast("Erreur lors de la restauration. Le fichier est-il valide ?", "error");
                                    }
                                };
                                reader.readAsText(file);
                            }}
                        />
                        <label 
                            htmlFor="restore-upload"
                            className="py-2.5 px-5 bg-transparent text-[var(--color-drug)] border border-[var(--color-drug)] font-semibold rounded-xl cursor-pointer text-[0.9rem] flex items-center gap-2 transition-all duration-200 hover:bg-[var(--color-drug)] hover:text-white"
                        >
                            <UploadSimple size={18} weight="bold" />
                            Restaurer
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-danger,#ef4444)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6">
                <div className="flex gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl text-[var(--color-danger,#ef4444)] h-fit">
                        <Trash size={24} />
                    </div>
                    <div>
                        <h3 className="text-[1.1rem] font-bold text-[var(--color-text)] mb-2">Zone de danger</h3>
                        <p className="text-[0.9rem] text-[var(--color-text-muted)] leading-relaxed mb-5">
                            Restaurer le dictionnaire médical par défaut effacera toutes vos abréviations personnalisées.
                            Cette action est irréversible.
                        </p>
                        <button
                            onClick={handleReset}
                            className="py-2.5 px-5 bg-transparent border border-[var(--color-danger,#ef4444)] text-[var(--color-danger,#ef4444)] font-semibold rounded-xl cursor-pointer text-[0.9rem] transition-all duration-200 hover:bg-[var(--color-danger,#ef4444)] hover:text-white"
                        >
                            Réinitialiser le dictionnaire
                        </button>
                    </div>
                </div>
            </div>

            {/* DELETE ALL DATA (New Danger Zone) */}
            <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-danger,#ef4444)] shadow-[0_4px_12px_rgba(0,0,0,0.02)] mb-6">
                <div className="flex gap-4">
                    <div className="p-3 bg-[var(--color-danger,#ef4444)] rounded-xl text-white h-fit">
                        <ShieldWarning size={24} />
                    </div>
                    <div>
                        <h3 className="text-[1.1rem] font-bold text-[var(--color-danger,#ef4444)] mb-2">ZONE MORTELLE</h3>
                        <p className="text-[0.9rem] text-[var(--color-danger,#ef4444)] leading-relaxed mb-5">
                            Supprimer TOUTES les données (Fiches, Liens, Dictionnaire, Intelligence).
                            L'application repartira de zéro comme au premier jour.
                        </p>
                        <button
                            onClick={async () => {
                                if (confirm('ATTENTION : Voulez-vous vraiment TOUT SUPPRIMER ?')) {
                                    if (confirm('C\'est votre DERNIÈRE CHANCE. Cette action est IRRÉVERSIBLE. Êtes-vous sûr ?')) {
                                        await saveCardsAsync([]);
                                        resetToDefaults();
                                        localStorage.clear();
                                        alert("Toutes les données ont été supprimées.");
                                        window.location.reload();
                                    }
                                }
                            }}
                            className="py-2.5 px-5 bg-[var(--color-danger,#ef4444)] text-white font-semibold rounded-xl cursor-pointer border-none text-[0.9rem] transition-all duration-200 hover:brightness-90"
                        >
                            Tout supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
