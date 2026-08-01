import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore as useUI } from '../store/useUIStore';
import { requestNotificationPermission } from '../lib/notifications';
import { saveSettingAsync } from '../persistentSettings';
import { useCardStore } from '../store/useCardStore';
import { parseTextFormat } from '../utils/importParser';

import { 
    Heartbeat, Code, Translate, Lightbulb,
    UploadSimple, BellRinging, CheckCircle, ArrowRight
} from '@phosphor-icons/react';

const specialties = [
    { id: 'sante', label: 'Santé', icon: Heartbeat, color: '#10b981' },
    { id: 'tech', label: 'Tech & Dev', icon: Code, color: '#6366f1' },
    { id: 'langues', label: 'Langues', icon: Translate, color: '#f59e0b' },
    { id: 'autre', label: 'Autre', icon: Lightbulb, color: '#ec4899' },
];

export const OnboardingWizard: React.FC = () => {
    const { completeOnboarding, userName, setUserName } = useUI();
    const { handleBatchImport } = useCardStore();
    const [step, setStep] = useState(1);

    // Form state
    const [name, setName] = useState(userName || '');
    const [specialty, setSpecialty] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccessCount, setImportSuccessCount] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNext = () => setStep(s => s + 1);

    const handleFinish = async () => {
        // Save profile choices
        if (name) {
            setUserName(name);
            saveSettingAsync('pharmabrain_username_v1', name);
        }
        if (specialty) {
            saveSettingAsync('pharmabrain_specialty_v1', specialty);
        }
        
        // Finalize
        completeOnboarding();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            // Utiliser le parser existant avec type "drug" par défaut (ou un type générique)
            const importedCards = parseTextFormat(text, 'drug', 'Onboarding');
            
            // On ajoute les cartes
            await handleBatchImport(importedCards);
            setImportSuccessCount(importedCards.length);
        } catch (err) {
            console.error('Erreur import CSV onboarding', err);
            alert("Erreur lors de l'import du fichier.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleRequestNotifications = async () => {
        await requestNotificationPermission();
        handleFinish();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] blur-[80px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)]"  />
                <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] blur-[80px] bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)]"  />
            </div>

            <div className="relative w-full max-w-[500px] bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-[32px] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] text-white overflow-hidden mx-5">
                <AnimatePresence mode="wait">
                    {/* STEP 1: Profil */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-[1.75rem] font-extrabold m-0 mb-2">Bienvenue sur Extnd.</h2>
                            <p className="text-white/60 m-0 mb-8">Faisons connaissance pour adapter votre expérience.</p>

                            <div className="mb-6">
                                <label className="block text-[0.85rem] text-white/70 mb-2">Comment vous appelez-vous ?</label>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Votre prénom"
                                    className="w-full p-4 rounded-2xl bg-black/20 border border-white/10 text-white text-base outline-none focus:border-white/30 transition-colors box-border"
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-[0.85rem] text-white/70 mb-3">Quel est votre domaine principal ?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {specialties.map(spec => {
                                        const active = specialty === spec.id;
                                        return (
                                            <button
                                                key={spec.id}
                                                onClick={() => setSpecialty(spec.id)}
                                                className={`rounded-2xl p-4 text-white cursor-pointer flex flex-col items-center gap-2 transition-all border ${active ? '' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                                style={active ? {
                                                    background: `rgba(${spec.color === '#10b981' ? '16,185,129' : spec.color === '#6366f1' ? '99,102,241' : spec.color === '#f59e0b' ? '245,158,11' : '236,72,153'}, 0.2)`,
                                                    borderColor: spec.color
                                                } : {}}
                                            >
                                                <spec.icon size={28} color={active ? spec.color : 'rgba(255,255,255,0.5)'} weight={active ? "fill" : "regular"} />
                                                <span className={`text-[0.85rem] ${active ? 'font-semibold' : 'font-normal'}`}>{spec.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!name.trim() || !specialty}
                                className={`w-full p-4 rounded-2xl font-bold text-base border-none flex items-center justify-center gap-2 transition-all ${(!name.trim() || !specialty) ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-white text-black cursor-pointer hover:bg-white/90'}`}
                            >
                                Suivant <ArrowRight weight="bold" />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Import */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 className="text-[1.75rem] font-extrabold m-0 mb-2">Nourrissez votre cerveau</h2>
                            <p className="text-white/60 m-0 mb-8">Importez vos fiches existantes ou démarrez sur une base vierge.</p>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/20 rounded-[24px] py-10 px-5 text-center cursor-pointer bg-black/20 mb-6 transition-all hover:border-white/40 hover:bg-black/30"
                            >
                                {isImporting ? (
                                    <div className="text-emerald-500">Importation en cours...</div>
                                ) : importSuccessCount > 0 ? (
                                    <div className="text-emerald-500 flex flex-col items-center gap-3">
                                        <CheckCircle size={48} weight="fill" />
                                        <div className="font-semibold">{importSuccessCount} fiches importées !</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <UploadSimple size={48} color="rgba(255,255,255,0.5)" />
                                        <div className="font-semibold">Importer un fichier CSV</div>
                                        <div className="text-[0.8rem] text-white/40">Format attendu : titre, contenu, tags</div>
                                    </div>
                                )}
                                <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleNext}
                                    className="flex-1 p-4 rounded-2xl bg-white/5 text-white font-semibold border-none cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                    Passer
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] p-4 rounded-2xl bg-white text-black font-bold border-none cursor-pointer hover:bg-white/90 transition-colors"
                                >
                                    Continuer
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Notifications */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-[0_8px_32px_rgba(99,102,241,0.4)]">
                                <BellRinging size={40} color="white" weight="fill" />
                            </div>
                            <h2 className="text-[1.75rem] font-extrabold m-0 mb-4">Ne perdez pas le fil</h2>
                            <p className="text-white/60 m-0 mb-8 leading-relaxed">
                                Activez les notifications pour savoir quand vos fiches doivent être révisées (algorithme FSRS). <br/>
                                <i>Aucun spam, promis.</i>
                            </p>

                            <button
                                onClick={handleRequestNotifications}
                                className="w-full p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-base border-none cursor-pointer mb-4 shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform"
                            >
                                Activer les rappels
                            </button>
                            
                            <button
                                onClick={handleFinish}
                                className="bg-transparent border-none text-white/40 cursor-pointer text-[0.9rem] p-2 hover:text-white/60 transition-colors"
                            >
                                Plus tard
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
