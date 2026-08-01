import React, { useState, useEffect } from 'react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { isExamModeActive, EXAM_MODE_WINDOW_DAYS } from '../../algorithms/srs';
import { clearSrsSettingsCache } from '../../algorithms/fsrs';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../../persistentSettings';
import { S, SettingsCard, CardSection, CardBody, SettingsRow, FieldLabel } from './SettingsUI';
import './styles/RevisionTab.css';

export const SRS_SETTINGS_KEY = 'pharmabrain_srs_settings';

export interface SrsSettings {
    examModeEnabled: boolean;
    examDate: string;
    showEasyButton: boolean;
    autoFullscreen: boolean;
    maxNewCardsPerSession: number;
}

export function loadSrsSettings(): SrsSettings {
    return loadSettingSync<SrsSettings>(SRS_SETTINGS_KEY, {
        examModeEnabled: false,
        examDate: new Date().toISOString().split('T')[0],
        showEasyButton: false,
        autoFullscreen: false,
        maxNewCardsPerSession: 10,
    });
}

export function saveSrsSettings(settings: SrsSettings): void {
    saveSettingAsync(SRS_SETTINGS_KEY, settings);
    clearSrsSettingsCache();
}

export const RevisionTab: React.FC = () => {
    const [srsSettings, setSrsSettings] = useState<SrsSettings>(() => loadSrsSettings());

    useEffect(() => {
        loadSettingAsync<SrsSettings>(SRS_SETTINGS_KEY, { examModeEnabled: false, examDate: '', showEasyButton: false, autoFullscreen: false, maxNewCardsPerSession: 10 }).then(setSrsSettings);
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
        <div className="revisiontab-style-1" >
            {/* Exam mode */}
            <SettingsCard>
                <CardSection
                    title="Mode Examen Proche"
                    subtitle={`Intensifie les révisions dans les ${EXAM_MODE_WINDOW_DAYS} jours précédant un examen.`}
                    action={
                        examActive ? (
                            <span className="revisiontab-style-2" style={{
  background: S.warningDim,
  color: S.warning,
  border: `1px solid ${S.warning}44`
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

                <div className="revisiontab-style-3" style={{
  borderTop: `1px solid ${S.border}`
}}>
                    <FieldLabel>Date de l'examen</FieldLabel>
                    <input
                        type="date"
                        value={srsSettings.examDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => handleChange({ examDate: e.target.value })}
                        disabled={!srsSettings.examModeEnabled}
                        className="revisiontab-style-4" style={{
  border: `1px solid ${srsSettings.examModeEnabled ? S.primary : S.border}`,
  color: srsSettings.examModeEnabled ? S.text : S.muted,
  background: S.bg,
  cursor: srsSettings.examModeEnabled ? 'pointer' : 'not-allowed',
  opacity: srsSettings.examModeEnabled ? 1 : 0.5
}}
                    />

                    {/* Status banner */}
                    {srsSettings.examModeEnabled && srsSettings.examDate && (
                        <div className="revisiontab-style-5" style={{
  background: examActive ? S.warningDim : S.primaryDim,
  color: examActive ? S.warning : S.primary,
  border: `1px solid ${examActive ? S.warning + '44' : S.primary + '44'}`
}}>
                            {examActive
                                ? `⚡ Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14 jours.`
                                : `✓ Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera à J-${EXAM_MODE_WINDOW_DAYS}.`}
                        </div>
                    )}
                    {srsSettings.examModeEnabled && !srsSettings.examDate && (
                        <div className="revisiontab-style-6" style={{
  background: S.warningDim,
  color: S.warning,
  border: `1px solid ${S.warning}44`
}}>
                            Sélectionnez une date pour activer le mode examen.
                        </div>
                    )}
                </div>
            </SettingsCard>

            <SettingsCard>
                <CardSection
                    title="Options de Révision"
                    subtitle="Personnalisez votre interface et vos outils de révision."
                />
                <SettingsRow
                    label="Plein écran automatique"
                    description="Passer en plein écran au lancement d'une session."
                >
                    <ToggleSwitch
                        checked={srsSettings.autoFullscreen}
                        onChange={checked => handleChange({ autoFullscreen: checked })}
                        aria-label="Plein écran automatique"
                    />
                </SettingsRow>
                <SettingsRow
                    label="Nouvelles cartes par session"
                    description="Nombre maximum de nouvelles cartes à découvrir par session."
                >
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={srsSettings.maxNewCardsPerSession}
                        onChange={e => handleChange({ maxNewCardsPerSession: parseInt(e.target.value) || 10 })}
                        className="revisiontab-style-7" 
                    />
                </SettingsRow>
                <SettingsRow
                    label="Activer le bouton Facile"
                    description="Ajoute un quatrième bouton lors des révisions pour les cartes parfaitement maîtrisées."
                >
                    <ToggleSwitch
                        checked={srsSettings.showEasyButton}
                        onChange={checked => handleChange({ showEasyButton: checked })}
                        aria-label="Activer le bouton facile"
                    />
                </SettingsRow>
            </SettingsCard>

            {/* How it works */}
            <SettingsCard>
                <CardSection title="Comment ça fonctionne ?" />
                <CardBody>
                    <ul className="revisiontab-style-8" >
                        {[
                            `En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.`,
                            `Quand l'examen est proche (J-${EXAM_MODE_WINDOW_DAYS}), l'intervalle maximum est réduit à 14 jours.`,
                            `Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.`,
                            `Le mode se désactive automatiquement une fois l'examen passé.`,
                        ].map((item, i) => (
                            <li key={i} className="revisiontab-style-9" style={{
  color: S.muted
}}>{item}</li>
                        ))}
                    </ul>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
