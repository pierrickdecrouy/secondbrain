import React, { useState } from 'react';
import { UploadSimple, DownloadSimple, Warning } from '@phosphor-icons/react';
import { useCardStore } from '../../store/useCardStore';
import { toast } from '../../store/useToastStore';
import { importAnkiPackage } from '../../ankiImport';
import { saveCardsAsync, exportAllData, importAllData, resetToDefaults } from '../../storage';
import { S, SettingsCard, CardSection, CardBody, SettingsRow, GhostButton, DangerButton } from './SettingsUI';
import './styles/DataTab.css';

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
        <div className="datatab-style-1" >
            {/* Import Anki */}
            <SettingsCard>
                <CardSection
                    title="Importer depuis Anki"
                    subtitle="Format .apkg uniquement — images ignorées, fiches classées dans « Données »."
                />
                <CardBody>
                    <div className="datatab-style-2" >
                        <input
                            type="file"
                            accept=".apkg"
                            id="anki-upload"
                            className="datatab-style-3" 
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
                                } catch (err: any) {
                                    toast.error(err.message || "Erreur lors de l'import Anki");
                                    setIsImportingAnki(false);
                                }
                            }}
                        />
                        <label
                            htmlFor="anki-upload"
                            className="datatab-style-4" style={{
  background: S.primary,
  cursor: isImportingAnki ? 'not-allowed' : 'pointer',
  opacity: isImportingAnki ? 0.5 : 1
}}
                        >
                            <UploadSimple size={15} weight="bold" />
                            {isImportingAnki ? 'Import en cours…' : 'Choisir un fichier .apkg'}
                        </label>
                        {isImportingAnki && (
                            <span className="datatab-style-5" style={{
  color: S.primary
}}>{ankiImportProgress}</span>
                        )}
                    </div>
                </CardBody>
            </SettingsCard>

            {/* Backup & Restore */}
            <SettingsCard>
                <CardSection title="Sauvegarde complète" subtitle="Exportez ou restaurez l'ensemble de vos données (fiches, abréviations, paramètres)." />
                <SettingsRow label="Télécharger une sauvegarde" description="Fichier JSON de toutes vos données." last>
                    <GhostButton onClick={handleExport} small>
                        <DownloadSimple size={15} /> Exporter
                    </GhostButton>
                </SettingsRow>
                <div className="datatab-style-6" style={{
  borderTop: `1px solid ${S.border}`
}}>
                    <input
                        type="file"
                        accept=".json"
                        id="restore-upload"
                        className="datatab-style-7" 
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
                    <div className="datatab-style-8" >
                        <div>
                            <div className="datatab-style-9" style={{
  color: S.text
}}>Restaurer depuis un fichier</div>
                            <div className="datatab-style-10" style={{
  color: S.muted
}}>Écrase toutes les données actuelles.</div>
                        </div>
                        <label
                            htmlFor="restore-upload"
                            className="datatab-style-11" style={{
  color: S.muted,
  border: `1px solid ${S.border}`
}}
                        >
                            <UploadSimple size={14} /> Restaurer
                        </label>
                    </div>
                </div>
            </SettingsCard>

            {/* Danger zone */}
            <SettingsCard danger>
                <CardSection
                    title="Zone de danger"
                    subtitle="Actions irréversibles — procédez avec précaution."
                    icon={<Warning size={16} />}
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
                        className="datatab-style-12" 
                    >
                        Tout supprimer
                    </DangerButton>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
};
