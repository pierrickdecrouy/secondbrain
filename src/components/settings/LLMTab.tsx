import React, { useState, useEffect } from 'react';
import { SettingsCard, CardSection, CardBody, PrimaryButton } from './SettingsUI';
import { Robot, Key, ShieldCheck, Lightning, Cloud, Code } from '@phosphor-icons/react';
import { useLLMStore, type LLMMode } from '../../store/useLLMStore';
import { isLocalAIAvailable } from '../../services/llmService';

export const LLMTab: React.FC = () => {
    const { mode, apiKey, cloudModel, extndBotEnabled, setMode, setApiKey, setCloudModel, setExtndBotEnabled } = useLLMStore();
    const [localSupported, setLocalSupported] = useState<boolean | null>(null);
    const [tempKey, setTempKey] = useState(apiKey);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        isLocalAIAvailable().then(setLocalSupported);
    }, []);

    const handleSaveKey = () => {
        setApiKey(tempKey);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="flex flex-col gap-6">
            <SettingsCard>
                <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <Code size={20} weight="duotone" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">Mode Développeur : EXTND Bot</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                Affiche l'assistant IA expérimental (RAG) sur toutes les pages de l'application.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={extndBotEnabled}
                        onClick={() => setExtndBotEnabled(!extndBotEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-opacity-75 ${
                            extndBotEnabled ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                        <span className="sr-only">Activer EXTND Bot</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                extndBotEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </CardBody>
            </SettingsCard>

            <SettingsCard>
                <CardSection 
                    title="Moteur d'Intelligence Artificielle" 
                    subtitle="Choisissez comment EXTND doit traiter vos requêtes complexes."
                    icon={<Robot size={18} weight="duotone" />} 
                />
                <CardBody className="flex flex-col gap-4">
                    {/* Hybride Mode */}
                    <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${mode === 'hybrid' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <div className="pt-1">
                            <input 
                                type="radio" 
                                name="llm_mode" 
                                value="hybrid" 
                                checked={mode === 'hybrid'} 
                                onChange={() => setMode('hybrid')}
                                className="w-5 h-5 text-teal-600 focus:ring-teal-500 border-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100">Mode Hybride (Recommandé)</span>
                                <Lightning size={16} className="text-teal-500" weight="fill" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Le meilleur des deux mondes. Utilise l'IA Locale (0 lag) quand elle est disponible, et bascule sur le Cloud pour les tâches plus complexes. Nécessite une clé d'API.
                            </p>
                        </div>
                    </label>

                    {/* Local Mode */}
                    <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${mode === 'local' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <div className="pt-1">
                            <input 
                                type="radio" 
                                name="llm_mode" 
                                value="local" 
                                checked={mode === 'local'} 
                                onChange={() => setMode('local')}
                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100">Mode Éco / Parano (Local Strict)</span>
                                <ShieldCheck size={16} className="text-emerald-500" weight="fill" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Aucune donnée ne quitte votre appareil. Utilise Gemini Nano intégré au navigateur. Plus limité en connaissances générales mais ultra-rapide et sécurisé.
                            </p>
                            {localSupported === false && (
                                <div className="mt-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded inline-block">
                                    ⚠️ Votre navigateur ne supporte pas encore l'IA locale (Chrome avec flags requis).
                                </div>
                            )}
                            {localSupported === true && (
                                <div className="mt-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded inline-block">
                                    ✅ IA locale détectée et prête à l'emploi.
                                </div>
                            )}
                        </div>
                    </label>

                    {/* Cloud Mode */}
                    <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${mode === 'cloud' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <div className="pt-1">
                            <input 
                                type="radio" 
                                name="llm_mode" 
                                value="cloud" 
                                checked={mode === 'cloud'} 
                                onChange={() => setMode('cloud')}
                                className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-slate-100">Mode Performance (Cloud)</span>
                                <Cloud size={16} className="text-indigo-500" weight="fill" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Utilise exclusivement l'API distante (Gemini 1.5 Flash). Idéal pour la création de contenus longs et complexes, au détriment d'une dépendance à internet. Nécessite une clé d'API.
                            </p>
                        </div>
                    </label>
                </CardBody>
            </SettingsCard>

            {/* API Key Configuration */}
            {(mode === 'hybrid' || mode === 'cloud') && (
                <SettingsCard>
                    <CardSection 
                        title="Clé d'API (Gemini 1.5 Flash)" 
                        subtitle="Requis pour l'accès aux modèles distants. Vos clés restent stockées uniquement en local sur votre appareil."
                        icon={<Key size={18} weight="duotone" />} 
                    />
                    <CardBody>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Clé API Gemini (Google AI Studio)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={tempKey}
                                        onChange={(e) => setTempKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                    />
                                    <PrimaryButton onClick={handleSaveKey} disabled={tempKey === apiKey}>
                                        {isSaved ? "Enregistré" : "Sauvegarder"}
                                    </PrimaryButton>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Modèle Cloud Distant</h4>
                                <select 
                                    value={cloudModel} 
                                    onChange={(e) => setCloudModel(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                >
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Rapide)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Le plus intelligent)</option>
                                    <option value="gemma-4-26b-it">Gemma 4 26B (Performant)</option>
                                    <option value="gemma-4-31b-it">Gemma 4 31B (Le plus puissant)</option>
                                </select>
                            </div>
                            
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Comment obtenir une clé API gratuite ?</h4>
                                <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>Allez sur <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">Google AI Studio</a>.</li>
                                    <li>Connectez-vous avec votre compte Google.</li>
                                    <li>Cliquez sur "Get API key" dans le menu de gauche.</li>
                                    <li>Créez une nouvelle clé (Create API key in new project).</li>
                                    <li>Copiez la clé et collez-la ici. Le quota gratuit est très généreux.</li>
                                </ol>
                            </div>
                        </div>
                    </CardBody>
                </SettingsCard>
            )}
        </div>
    );
};
