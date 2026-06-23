import React, { useState } from 'react';
import { UploadSimple, DownloadSimple } from '@phosphor-icons/react';
import { useCards } from '../../context/CardContext';
import { useToast } from '../../context/ToastContext';
import { importAnkiPackage } from '../../ankiImport';
import { saveCardsAsync, exportAllData, importAllData, resetToDefaults } from '../../storage';

/* ── Shared style constants (exact mockup hex values) ─── */
const CARD_BG = '#111827';
const CARD_HEADER_BG = 'rgba(22, 31, 48, 0.4)';

const cardStyle: React.CSSProperties = {
    backgroundColor: CARD_BG,
    border: `1px solid #1e293b`,
    borderRadius: 16,
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    overflow: 'hidden',
};

const cardHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: `1px solid #1e293b`,
    backgroundColor: CARD_HEADER_BG,
    display: 'flex', alignItems: 'center', gap: 8,
};

const cardBodyStyle: React.CSSProperties = {
    padding: 24,
};

const btnPrimary: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#059669',
    color: 'white',
    fontSize: 12, fontWeight: 600,
    borderRadius: 8, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: '0 4px 6px rgba(5, 150, 105, 0.1)',
    transition: 'all 150ms ease',
};

const btnSecondary: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: 12, fontWeight: 600,
    borderRadius: 8, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'all 150ms ease',
};

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
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* ══════════════ BANNER ══════════════ */}
            <div style={{
                background: 'linear-gradient(to right, #111827, #1e293b)',
                border: '1px solid rgba(46, 62, 82, 0.4)',
                padding: 24, borderRadius: 16,
                position: 'relative', overflow: 'hidden',
                marginBottom: 24,
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'white', margin: 0 }}>
                        Gestion des données
                    </h2>
                    <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, marginBottom: 0 }}>
                        Exportez, importez ou réinitialisez vos fiches, abréviations et sauvegardes.
                    </p>
                </div>
                {/* Glow */}
                <div style={{ position: 'absolute', right: -32, top: -32, width: 256, height: 256, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', filter: 'blur(48px)', pointerEvents: 'none' }} />
            </div>

            {/* ══════════════ IMPORT ANKI ══════════════ */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
                <div style={cardHeaderStyle}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Import Anki (.apkg)</h3>
                </div>
                <div style={cardBodyStyle}>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginTop: 0, marginBottom: 20 }}>
                        Importez vos fiches depuis un paquet Anki. Pour l'instant, seuls les textes sont importés (les images sont ignorées).
                        Les fiches seront placées dans la catégorie "Données" avec l'étiquette "Anki".
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="file" 
                                accept=".apkg"
                                id="anki-upload"
                                style={{ display: 'none' }}
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
                                style={{
                                    ...btnPrimary,
                                    opacity: isImportingAnki ? 0.6 : 1,
                                    cursor: isImportingAnki ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <UploadSimple size={16} weight="bold" />
                                {isImportingAnki ? 'Import en cours...' : 'Importer un fichier .apkg'}
                            </label>
                        </div>
                        {isImportingAnki && (
                            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 500 }}>{ankiImportProgress}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════ BACKUP & RESTORE ══════════════ */}
            <div style={{ ...cardStyle, marginBottom: 24 }}>
                <div style={cardHeaderStyle}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Sauvegarde Complète</h3>
                </div>
                <div style={cardBodyStyle}>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginTop: 0, marginBottom: 20 }}>
                        Créez une sauvegarde de tout votre système (Fiches, Abréviations, Statistiques d'apprentissage, Paramètres).
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                            style={btnSecondary}
                        >
                            <DownloadSimple size={16} weight="bold" />
                            Télécharger le Backup
                        </button>

                        <div style={{ position: 'relative' }}>
                            <input 
                                type="file" 
                                accept=".json"
                                id="restore-upload"
                                style={{ display: 'none' }}
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
                                style={{ ...btnSecondary, cursor: 'pointer' }}
                            >
                                <UploadSimple size={16} weight="bold" />
                                Restaurer depuis un fichier
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════ DANGER ZONES (grid) ══════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                
                {/* Reset Dictionary */}
                <div style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid #1e293b`,
                    borderRadius: 16, padding: 24,
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: '0 0 12px 0' }}>Exporter les données</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                        Téléchargez une sauvegarde instantanée de vos définitions au format JSON pour vos logiciels tiers.
                    </p>
                    <button onClick={handleReset} style={btnSecondary}>
                        Restaurer la liste d'origine
                    </button>
                </div>

                {/* Delete All */}
                <div style={{
                    backgroundColor: CARD_BG,
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 16, padding: 24,
                }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f87171', margin: '0 0 12px 0' }}>Zone de Danger</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                        Réinitialiser le dictionnaire par défaut ou supprimer de manière définitive toutes les abréviations personnalisées ajoutées.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: 'rgba(127, 29, 29, 0.4)',
                                border: '1px solid rgba(127, 29, 29, 0.5)',
                                color: '#f87171',
                                fontSize: 12, fontWeight: 600,
                                borderRadius: 8, cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                        >
                            Restaurer la liste d'origine
                        </button>
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
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#dc2626',
                                border: 'none',
                                color: 'white',
                                fontSize: 12, fontWeight: 600,
                                borderRadius: 8, cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                        >
                            Vider toute la base
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
