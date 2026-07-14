import React, { useState } from 'react';
import { UploadSimple, DownloadSimple, Warning } from '@phosphor-icons/react';
import { useCardStore } from '../../store/useCardStore';
import { toast } from '../../store/useToastStore';
import { importAnkiPackage } from '../../ankiImport';
import { saveCardsAsync, exportAllData, importAllData, resetToDefaults } from '../../storage';
import { S, SettingsCard, CardSection, CardBody, SettingsRow, GhostButton, DangerButton } from './SettingsUI';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Import Anki */}
            <SettingsCard>
                <CardSection
                    title="Importer depuis Anki"
                    subtitle="Format .apkg uniquement — images ignorées, fiches classées dans « Données »."
                />
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="file"
                            accept=".apkg"
                            id="anki-upload"
                            style={{ display: 'none' }}
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
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: S.primary,
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '9px 18px',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: isImportingAnki ? 'not-allowed' : 'pointer',
                                opacity: isImportingAnki ? 0.5 : 1,
                                transition: 'opacity 0.15s',
                            }}
                        >
                            <UploadSimple size={15} weight="bold" />
                            {isImportingAnki ? 'Import en cours…' : 'Choisir un fichier .apkg'}
                        </label>
                        {isImportingAnki && (
                            <span style={{ fontSize: 13, color: S.primary, fontWeight: 500 }}>{ankiImportProgress}</span>
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
                <div style={{ padding: '14px 20px', borderTop: `1px solid ${S.border}` }}>
                    <input
                        type="file"
                        accept=".json"
                        id="restore-upload"
                        style={{ display: 'none' }}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 14, color: S.text, fontWeight: 500 }}>Restaurer depuis un fichier</div>
                            <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>Écrase toutes les données actuelles.</div>
                        </div>
                        <label
                            htmlFor="restore-upload"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'transparent',
                                color: S.muted,
                                border: `1px solid ${S.border}`,
                                borderRadius: 10,
                                padding: '7px 14px',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'color 0.15s, border-color 0.15s',
                                whiteSpace: 'nowrap',
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
                        style={{ padding: '7px 14px', fontSize: 13 }}
                    >
                        Tout supprimer
                    </DangerButton>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
};
