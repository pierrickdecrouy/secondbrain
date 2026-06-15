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
        <div className="settings-tab-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    width: '64px', height: '64px', background: 'var(--primary-light)',
                    borderRadius: '16px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 20px', color: 'var(--color-drug)'
                }}>
                    <Database size={32} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '10px' }}>Gestion des données</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Sauvegardez, restaurez, ou réinitialisez vos données en toute sécurité.</p>
            </div>

            {/* Import Anki */}
            <div className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>Import Anki (.apkg)</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    Importez vos fiches depuis un paquet Anki. Pour l'instant, seuls les textes sont importés (les images sont ignorées).
                    Les fiches seront placées dans la catégorie "Données" avec l'étiquette "Anki".
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
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
                                padding: '10px 20px',
                                background: isImportingAnki ? 'var(--color-border)' : 'var(--color-drug)',
                                color: isImportingAnki ? 'var(--color-text-muted)' : 'white',
                                fontWeight: 600,
                                borderRadius: '10px',
                                cursor: isImportingAnki ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            <UploadSimple size={18} weight="bold" />
                            {isImportingAnki ? 'Import en cours...' : 'Importer un fichier .apkg'}
                        </label>
                    </div>
                    {isImportingAnki && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-drug)', fontWeight: 500 }}>
                            {ankiImportProgress}
                        </span>
                    )}
                </div>
            </div>

            {/* BACKUP & RESTORE */}
            <div className="settings-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>Sauvegarde Complète</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                    Créez une sauvegarde de tout votre système (Fiches, Abréviations, Statistiques d'apprentissage, Paramètres).
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
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
                        style={{
                            padding: '10px 20px',
                            background: 'var(--color-drug)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: 'none',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <DownloadSimple size={18} weight="bold" />
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
                            style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                color: 'var(--color-drug)',
                                border: '1px solid var(--color-drug)',
                                fontWeight: 600,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-drug)'; e.currentTarget.style.color = 'white'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-drug)'; }}
                        >
                            <UploadSimple size={18} weight="bold" />
                            Restaurer
                        </label>
                    </div>
                </div>
            </div>

            <div className="settings-card" style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                        padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px',
                        color: 'var(--color-danger, #ef4444)', height: 'fit-content'
                    }}>
                        <Trash size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>Zone de danger</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
                            Restaurer le dictionnaire médical par défaut effacera toutes vos abréviations personnalisées.
                            Cette action est irréversible.
                        </p>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                border: '1px solid var(--color-danger, #ef4444)',
                                color: 'var(--color-danger, #ef4444)',
                                fontWeight: 600,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--color-danger, #ef4444)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--color-danger, #ef4444)';
                            }}
                        >
                            Réinitialiser le dictionnaire
                        </button>
                    </div>
                </div>
            </div>

            {/* DELETE ALL DATA (New Danger Zone) */}
            <div className="settings-card" style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                        padding: '12px', background: 'var(--color-danger, #ef4444)', borderRadius: '12px',
                        color: 'white', height: 'fit-content'
                    }}>
                        <ShieldWarning size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-danger, #ef4444)', marginBottom: '8px' }}>ZONE MORTELLE</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-danger, #ef4444)', lineHeight: '1.5', marginBottom: '20px' }}>
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
                            style={{
                                padding: '10px 20px',
                                background: 'var(--color-danger, #ef4444)',
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                border: 'none',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.filter = 'brightness(0.9)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.filter = 'none';
                            }}
                        >
                            Tout supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
