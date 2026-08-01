import React, { useState, useEffect } from 'react';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { isExamModeActive, EXAM_MODE_WINDOW_DAYS } from '../../algorithms/srs';
import { clearSrsSettingsCache } from '../../algorithms/fsrs';
import { loadSettingAsync, loadSettingSync, saveSettingAsync } from '../../persistentSettings';
import { SettingsCard, CardSection, CardBody, SettingsRow, FieldLabel } from './SettingsUI';

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
        <div className="flex flex-col gap-6">
            {/* Exam mode */}
            <SettingsCard>
                <CardSection
                    title="Mode Examen Proche"
                    subtitle={`Intensifie les révisions dans les ${EXAM_MODE_WINDOW_DAYS} jours précédant un examen.`}
                    action={
                        examActive ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-500/30">
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

                <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                    <FieldLabel>Date de l'examen</FieldLabel>
                    <input
                        type="date"
                        value={srsSettings.examDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => handleChange({ examDate: e.target.value })}
                        disabled={!srsSettings.examModeEnabled}
                        className={`w-full max-w-xs px-3 py-2 text-sm rounded-xl outline-none transition-all ${
                            srsSettings.examModeEnabled 
                                ? 'border-2 border-teal-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-4 focus:ring-teal-500/20' 
                                : 'border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75'
                        }`}
                    />

                    {/* Status banner */}
                    {srsSettings.examModeEnabled && srsSettings.examDate && (
                        <div className={`mt-2 p-3 text-sm font-medium rounded-xl border ${
                            examActive 
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' 
                                : 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30'
                        }`}>
                            {examActive
                                ? `⚡ Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14 jours.`
                                : `✓ Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera à J-${EXAM_MODE_WINDOW_DAYS}.`}
                        </div>
                    )}
                    {srsSettings.examModeEnabled && !srsSettings.examDate && (
                        <div className="mt-2 p-3 text-sm font-medium rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
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
                        className="w-20 px-3 py-1.5 text-sm font-bold text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                    />
                </SettingsRow>
                <SettingsRow
                    label="Activer le bouton Facile"
                    description="Ajoute un quatrième bouton lors des révisions pour les cartes parfaitement maîtrisées."
                    last
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
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-500 dark:text-slate-400 marker:text-slate-300 dark:marker:text-slate-600">
                        {[
                            `En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.`,
                            `Quand l'examen est proche (J-${EXAM_MODE_WINDOW_DAYS}), l'intervalle maximum est réduit à 14 jours.`,
                            `Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.`,
                            `Le mode se désactive automatiquement une fois l'examen passé.`,
                        ].map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
