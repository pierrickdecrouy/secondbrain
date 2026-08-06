import React, { useState } from 'react';
import { UploadSimple, DownloadSimple, Warning } from '@phosphor-icons/react';
import { useCardStore } from '../../store/useCardStore';
import { toast } from '../../store/useToastStore';
import { importAnkiPackage } from '../../ankiImport';
import { saveCardsAsync, exportAllData, importAllData, resetToDefaults } from '../../storage';
import { SettingsCard, CardSection, CardBody, SettingsRow, GhostButton, DangerButton } from './SettingsUI';

export const DataTab: React.FC = () => {
    const { cards, deleteCards } = useCardStore();
    const [isImportingAnki, setIsImportingAnki] = useState(false);
    const [ankiImportProgress, setAnkiImportProgress] = useState('');

    const handleReset = () => {
        if (window.confirm('Voulez-vous vraiment restaurer le dictionnaire par défaut ?')) {
            resetToDefaults();
            window.location.reload();
        }
    };

    const handleCleanOrphans = () => {
        const cardsSet = new Set(cards.map(c => c.id));
        const toDelete = cards.filter(c => c.parentId && !cardsSet.has(c.parentId));
        
        if (toDelete.length === 0) {
            toast.success("Aucune carte orpheline trouvée.");
            return;
        }

        if (window.confirm(`Voulez-vous supprimer ${toDelete.length} cartes orphelines (cartes dont le parent n'existe plus) ?`)) {
            deleteCards(toDelete.map(c => c.id));
            toast.success(`${toDelete.length} cartes orphelines supprimées.`);
        }
    };

    const handleExport = async () => {
        const data = await exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extnd-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Import Anki */}
            <SettingsCard>
                <CardSection
                    title="Importer depuis Anki"
                    subtitle="Format .apkg uniquement — images ignorées, fiches classées dans « Données »."
                />
                <CardBody>
                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            accept=".apkg"
                            id="anki-upload"
                            className="hidden" 
                            disabled={isImportingAnki}
                            onChange={async e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsImportingAnki(true);
                                setAnkiImportProgress('Initialisation…');
                                try {
                                    const imported = await importAnkiPackage(file, setAnkiImportProgress);
                                    const newCards = [...cards, ...imported];
                                    await saveCardsAsync(newCards);
                                    toast.success(`${imported.length} fiches importées !`);
                                    setTimeout(() => window.location.reload(), 1500);
                                } catch (err: unknown) {
                                    toast.error((err as Error).message || "Erreur lors de l'import Anki");
                                    setIsImportingAnki(false);
                                }
                            }}
                        />
                        <label
                            htmlFor="anki-upload"
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors w-fit ${isImportingAnki ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                        >
                            <UploadSimple size={18} weight="bold" />
                            {isImportingAnki ? 'Import en cours…' : 'Choisir un fichier .apkg'}
                        </label>
                        {isImportingAnki && (
                            <span className="text-sm font-medium text-teal-600 dark:text-teal-400 mt-1">{ankiImportProgress}</span>
                        )}
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Backup & Restore */}
            <SettingsCard>
                <CardSection title="Sauvegarde complète" subtitle="Exportez ou restaurez l'ensemble de vos données (fiches, abréviations, paramètres)." />
                <SettingsRow label="Télécharger une sauvegarde" description="Fichier JSON de toutes vos données." last>
                    <GhostButton onClick={handleExport} small>
                        <DownloadSimple size={16} weight="bold" /> Exporter
                    </GhostButton>
                </SettingsRow>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <input
                        type="file"
                        accept=".json"
                        id="restore-upload"
                        className="hidden" 
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async ev => {
                                try {
                                    const content = ev.target?.result as string;
                                    if (confirm('ATTENTION : Cette action va ÉCRASER toutes vos données actuelles. Continuer ?')) {
                                        await importAllData(content);
                                        window.location.reload();
                                    }
                                } catch {
                                    toast.error('Erreur lors de la restauration. Fichier invalide ?');
                                }
                            };
                            reader.readAsText(file);
                        }}
                    />
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Restaurer depuis un fichier</div>
                            <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">Écrase toutes les données actuelles.</div>
                        </div>
                        <label
                            htmlFor="restore-upload"
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
                        >
                            <UploadSimple size={16} weight="bold" /> Restaurer
                        </label>
                    </div>
                </div>
            </SettingsCard>

            {/* Danger zone */}
            <SettingsCard danger>
                <CardSection
                    title="Zone de danger"
                    subtitle="Actions irréversibles — procédez avec précaution."
                    icon={<Warning size={20} weight="fill" />}
                />
                <SettingsRow
                    label="Restaurer le dictionnaire par défaut"
                    description="Réinitialise les abréviations intégrées. Vos abréviations personnelles sont conservées."
                >
                    <GhostButton small onClick={handleReset}>Restaurer</GhostButton>
                </SettingsRow>
                <SettingsRow
                    label="Charger les cours de démonstration"
                    description="Ajoute les fiches d'exemple sur le Diabète à votre collection actuelle."
                >
                    <GhostButton small onClick={() => useCardStore.getState().loadDemoData()}>Charger</GhostButton>
                </SettingsRow>
                <SettingsRow
                    label="Nettoyer les cartes orphelines"
                    description="Détecte et supprime les cartes dont le parent a été supprimé."
                >
                    <GhostButton small onClick={handleCleanOrphans}>Nettoyer</GhostButton>
                </SettingsRow>
                <SettingsRow
                    label="Vider toute la base"
                    description="Supprime définitivement toutes vos fiches, abréviations et paramètres. Irréversible."
                    last
                >
                    <DangerButton
                        onClick={async () => {
                            if (confirm('ATTENTION : Cette action est IRRÉVERSIBLE. Toutes vos données seront supprimées.')) {
                                if (confirm('Dernière confirmation — continuer ?')) {
                                    await saveCardsAsync([]);
                                    resetToDefaults();
                                    localStorage.clear();
                                    alert('Toutes les données ont été supprimées.');
                                    window.location.reload();
                                }
                            }
                        }}
                    >
                        Tout supprimer
                    </DangerButton>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
};
