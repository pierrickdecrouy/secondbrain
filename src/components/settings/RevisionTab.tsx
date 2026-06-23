import React, { useState, useEffect } from 'react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { isExamModeActive, EXAM_MODE_WINDOW_DAYS } from '../../algorithms/srs';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../../persistentSettings';
import { S, SettingsCard, CardSection, CardBody, SettingsRow, FieldLabel } from './SettingsUI';

export const SRS_SETTINGS_KEY = 'pharmabrain_srs_settings';

export interface SrsSettings {
    examModeEnabled: boolean;
    examDate: string;
}

export function loadSrsSettings(): SrsSettings {
    return loadSettingSync<SrsSettings>(SRS_SETTINGS_KEY, {
        examModeEnabled: false,
        examDate: new Date().toISOString().split('T')[0],
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

    const handleChange = (patch: Partial<SrsSettings>) => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Exam mode */}
            <SettingsCard>
                <CardSection
                    title="Mode Examen Proche"
                    subtitle={`Intensifie les révisions dans les ${EXAM_MODE_WINDOW_DAYS} jours précédant un examen.`}
                    action={
                        examActive ? (
                            <span style={{
                                padding: '2px 10px', borderRadius: 99, fontSize: 11,
                                fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                                background: S.warningDim, color: S.warning,
                                border: `1px solid ${S.warning}44`,
                            }}>
                                ACTIF
                            </span>
                        ) : undefined
                    }
                />

                <SettingsRow
                    label="Activer le mode examen"
                    description={`Limite l'intervalle SRS maximum à 14 jours quand l'examen est dans les ${EXAM_MODE_WINDOW_DAYS} prochains jours.`}
                >
                    <ToggleSwitch
                        checked={srsSettings.examModeEnabled}
                        onChange={checked => handleChange({ examModeEnabled: checked })}
                        aria-label="Activer le mode examen"
                    />
                </SettingsRow>

                <div style={{ padding: '16px 20px', borderTop: `1px solid ${S.border}` }}>
                    <FieldLabel>Date de l'examen</FieldLabel>
                    <input
                        type="date"
                        value={srsSettings.examDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => handleChange({ examDate: e.target.value })}
                        disabled={!srsSettings.examModeEnabled}
                        style={{
                            padding: '9px 14px',
                            border: `1px solid ${srsSettings.examModeEnabled ? S.primary : S.border}`,
                            borderRadius: 10,
                            fontSize: 14,
                            color: srsSettings.examModeEnabled ? S.text : S.muted,
                            background: S.bg,
                            outline: 'none',
                            cursor: srsSettings.examModeEnabled ? 'pointer' : 'not-allowed',
                            opacity: srsSettings.examModeEnabled ? 1 : 0.5,
                        }}
                    />

                    {/* Status banner */}
                    {srsSettings.examModeEnabled && srsSettings.examDate && (
                        <div style={{
                            marginTop: 12,
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            background: examActive ? S.warningDim : S.primaryDim,
                            color: examActive ? S.warning : S.primary,
                            border: `1px solid ${examActive ? S.warning + '44' : S.primary + '44'}`,
                            lineHeight: 1.5,
                        }}>
                            {examActive
                                ? `⚡ Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14 jours.`
                                : `✓ Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera à J-${EXAM_MODE_WINDOW_DAYS}.`}
                        </div>
                    )}
                    {srsSettings.examModeEnabled && !srsSettings.examDate && (
                        <div style={{
                            marginTop: 12,
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontSize: 13,
                            background: S.warningDim,
                            color: S.warning,
                            border: `1px solid ${S.warning}44`,
                        }}>
                            Sélectionnez une date pour activer le mode examen.
                        </div>
                    )}
                </div>
            </SettingsCard>

            {/* How it works */}
            <SettingsCard>
                <CardSection title="Comment ça fonctionne ?" />
                <CardBody>
                    <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            `En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.`,
                            `Quand l'examen est proche (J-${EXAM_MODE_WINDOW_DAYS}), l'intervalle maximum est réduit à 14 jours.`,
                            `Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.`,
                            `Le mode se désactive automatiquement une fois l'examen passé.`,
                        ].map((item, i) => (
                            <li key={i} style={{ fontSize: 13, color: S.muted, lineHeight: 1.6 }}>{item}</li>
                        ))}
                    </ul>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
