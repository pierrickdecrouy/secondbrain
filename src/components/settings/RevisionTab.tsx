import React, { useState, useEffect } from 'react';

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
        <div className="flex-1 px-10 md:px-14 pb-10 md:pb-14 pt-10 overflow-y-auto custom-scrollbar flex flex-col h-full bg-transparent">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Révision</h2>
                <p className="text-slate-400 text-[0.95rem]">
                    Configurez le mode "Examen Proche" pour intensifier automatiquement vos révisions dans les {EXAM_MODE_WINDOW_DAYS} jours précédant l'examen.
                </p>
            </div>

            {/* Exam Mode Card */}
            <div className={`bg-settings-sidebar p-6 rounded-2xl border shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out mb-6 ${examActive ? 'border-amber-500' : 'border-settings-border'}`}>
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <div className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
                            {examActive && <span className="text-base text-amber-500 mr-1">!</span>}
                            Mode "Examen Proche"
                            {examActive && (
                                <span className="text-[0.7rem] bg-amber-500/20 text-amber-500 py-0.5 px-2 rounded-full font-bold uppercase tracking-wide">
                                    ACTIF
                                </span>
                            )}
                        </div>
                        <p className="text-[0.85rem] text-slate-400 leading-relaxed">
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
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                        Date de l'examen
                    </label>
                    <input
                        type="date"
                        value={srsSettings.examDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleSrsSettingsChange({ examDate: e.target.value })}
                        disabled={!srsSettings.examModeEnabled}
                        className={`py-2.5 px-3.5 border rounded-xl text-[0.9rem] w-[200px] outline-none ${srsSettings.examModeEnabled ? 'border-emerald-500 text-slate-100 bg-[#0b101a] cursor-pointer' : 'border-settings-border text-slate-500 bg-transparent cursor-not-allowed'}`}
                    />
                </div>

                {/* Status banner */}
                {srsSettings.examModeEnabled && srsSettings.examDate && (
                    <div className={`mt-4 py-3 px-4 rounded-xl border text-[0.85rem] flex items-center gap-2 ${examActive ? 'bg-[rgba(245,158,11,0.1)] border-amber-500 text-amber-500' : 'bg-[rgba(34,197,94,0.1)] border-emerald-500 text-emerald-500'}`}>
                        {examActive
                            ? `Examen dans moins de ${EXAM_MODE_WINDOW_DAYS} jours — intervalles limités à 14j.`
                            : `Examen planifié le ${new Date(srsSettings.examDate).toLocaleDateString('fr-FR')}. Le mode s'activera automatiquement à J-${EXAM_MODE_WINDOW_DAYS}.`
                        }
                    </div>
                )}
                {srsSettings.examModeEnabled && !srsSettings.examDate && (
                    <div className="mt-4 py-3 px-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-amber-500 text-[0.85rem] text-amber-500">
                        Sélectionnez une date d'examen pour activer le mode.
                    </div>
                )}
            </div>

            {/* Info box */}
            <div className="bg-settings-sidebar p-6 rounded-2xl border border-settings-border shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-[0.85rem] text-slate-100 leading-relaxed">
                <strong className="block mb-2 text-slate-100">Comment ça fonctionne ?</strong>
                <ul className="pl-5 m-0 space-y-1">
                    <li>En mode normal, l'algorithme SRS peut programmer une révision dans 30, 60 ou 90 jours.</li>
                    <li>Quand l'examen est proche ({EXAM_MODE_WINDOW_DAYS} jours), l'intervalle maximum passe à <strong>14 jours</strong>.</li>
                    <li>Les cartes difficiles (faible easeFactor) continuent d'être révisées plus fréquemment.</li>
                    <li>Le mode se désactive automatiquement une fois l'examen passé.</li>
                </ul>
            </div>
        </div>
    );
};
