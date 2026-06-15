import React, { useState, useEffect } from 'react';
import { Timer } from '@phosphor-icons/react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { isExamModeActive, EXAM_MODE_WINDOW_DAYS } from '../../algorithms/srs';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../../persistentSettings';

export const SRS_SETTINGS_KEY = 'pharmabrain_srs_settings';

export interface SrsSettings {
    examModeEnabled: boolean;
    examDate: string;
}

export function loadSrsSettings(): SrsSettings {
    return loadSettingSync<SrsSettings>(SRS_SETTINGS_KEY, {
        examModeEnabled: false,
        examDate: new Date().toISOString().split('T')[0]
    });
}

export function saveSrsSettings(settings: SrsSettings): void {
    saveSettingAsync(SRS_SETTINGS_KEY, settings);
}

export const RevisionTab: React.FC = () => {
    const [srsSettings, setSrsSettings] = useState<SrsSettings>(() => loadSrsSettings());

    useEffect(() => {
        loadSettingAsync<SrsSettings>(SRS_SETTINGS_KEY, { examModeEnabled: false, examDate: '' }).then(setSrsSettings);
    }, []);

    const handleSrsSettingsChange = (patch: Partial<SrsSettings>) => {
        const updated = { ...srsSettings, ...patch };
        setSrsSettings(updated);
        saveSrsSettings(updated);
    };

    const examActive = isExamModeActive({
        learningSteps: [1, 10],
        defaultEaseFactor: 2.5,
        minEaseFactor: 1.3,
        fuzzEnabled: true,
        examModeEnabled: srsSettings.examModeEnabled,
        examDate: srsSettings.examDate || null,
    });

    return (
        <div className="settings-tab-content">
            <div style={{ marginBottom: '32px' }}>
                <h2 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Timer size={24} color="var(--color-drug)" />
                    Paramètres de Révision
                </h2>
                <p className="settings-section-desc">
                    Configurez le mode "Examen Proche" pour intensifier automatiquement vos révisions dans les {EXAM_MODE_WINDOW_DAYS} jours précédant l'examen.
                </p>
            </div>

            {/* Exam Mode Card */}
            <div className="settings-card" style={{
                border: `1px solid ${examActive ? 'var(--color-warning)' : 'var(--color-border)'}`,
                transition: 'all 0.3s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {examActive && <span style={{ fontSize: '1rem', color: 'var(--color-warning-dark, #b45309)', marginRight: '4px' }}>!</span>}
                            Mode "Examen Proche"
                            {examActive && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    background: 'var(--color-warning)',
                                    color: 'var(--color-warning-dark, #b45309)',
                                    padding: '2px 8px',
                                    borderRadius: '20px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    ACTIF
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                            Quand activé et que l'examen est dans les {EXAM_MODE_WINDOW_DAYS} jours,
                            l'intervalle SRS maximum est limité à 14 jours pour intensifier les révisions.
                        </p>
                    </div>
                    {/* Toggle Switch */}
                    <ToggleSwitch
                        checked={srsSettings.examModeEnabled}
                        onChange={(checked) => handleSrsSettingsChange({ examModeEnabled: checked })}
                        aria-label="Activer le mode examen"
                    />
                </div>

                {/* Exam Date Picker */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Date de l'examen
                    </label>
                    <input
                        type="date"
                        value={srsSettings.examDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleSrsSettingsChange({ examDate: e.target.value })}
                        disabled={!srsSettings.examModeEnabled}
                        style={{
                            padding: '10px 14px',
                            border: `1px solid ${srsSettings.examModeEnabled ? 'var(--color-drug)' : 'var(--color-border)'}`,
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            color: srsSettings.examModeEnabled ? 'var(--color-text)' : 'var(--color-text-muted)',
                            background: srsSettings.examModeEnabled ? 'var(--color-bg)' : 'var(--color-surface)',
                            cursor: srsSettings.examModeEnabled ? 'pointer' : 'not-allowed',
                            outline: 'none',
                            width: '200px',
                        }}
                    />
                </div>

                {/* Status banner */}
                {srsSettings.examModeEnabled && srsSettings.examDate && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: examActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${examActive ? 'var(--color-warning)' : 'var(--color-success)'}`,
                        fontSize: '0.85rem',
                        color: examActive ? 'var(--color-warning-dark, #b45309)' : 'var(--color-success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {examActive
                            ? `Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14j.`
                            : `Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera automatiquement à J-${EXAM_MODE_WINDOW_DAYS}.`
                        }
                    </div>
                )}
                {srsSettings.examModeEnabled && !srsSettings.examDate && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid var(--color-warning)',
                        fontSize: '0.85rem',
                        color: 'var(--color-warning-dark, #b45309)',
                    }}>
                        Sélectionnez une date d'examen pour activer le mode.
                    </div>
                )}
            </div>

            {/* Info box */}
            <div className="settings-card" style={{
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                lineHeight: '1.6'
            }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text)' }}>Comment ça fonctionne ?</strong>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    <li>En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.</li>
                    <li>Quand l'examen est proche ({EXAM_MODE_WINDOW_DAYS} jours), l'intervalle maximum passe à <strong>14 jours</strong>.</li>
                    <li>Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.</li>
                    <li>Le mode se désactive automatiquement une fois l'examen passé.</li>
                </ul>
            </div>
        </div>
    );
};
