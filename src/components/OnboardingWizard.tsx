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
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Background elements */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            <div style={{
                position: 'relative', width: '100%', maxWidth: 500,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 32, padding: '40px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                color: 'white',
                overflow: 'hidden'
            }}>
                <AnimatePresence mode="wait">
                    {/* STEP 1: Profil */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>Bienvenue sur Extnd.</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 32px' }}>Faisons connaissance pour adapter votre expérience.</p>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Comment vous appelez-vous ?</label>
                                <input 
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Votre prénom"
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: 16,
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', fontSize: '1rem', outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Quel est votre domaine principal ?</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                                    {specialties.map(spec => {
                                        const active = specialty === spec.id;
                                        return (
                                            <button
                                                key={spec.id}
                                                onClick={() => setSpecialty(spec.id)}
                                                style={{
                                                    background: active ? `rgba(${spec.color === '#10b981' ? '16,185,129' : spec.color === '#6366f1' ? '99,102,241' : spec.color === '#f59e0b' ? '245,158,11' : '236,72,153'}, 0.2)` : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${active ? spec.color : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: 16, padding: '16px 8px',
                                                    color: 'white', cursor: 'pointer',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <spec.icon size={28} color={active ? spec.color : 'rgba(255,255,255,0.5)'} weight={active ? "fill" : "regular"} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400 }}>{spec.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!name.trim() || !specialty}
                                style={{
                                    width: '100%', padding: 16, borderRadius: 16,
                                    background: (!name.trim() || !specialty) ? 'rgba(255,255,255,0.1)' : 'white',
                                    color: (!name.trim() || !specialty) ? 'rgba(255,255,255,0.3)' : 'black',
                                    fontWeight: 700, fontSize: '1rem', border: 'none',
                                    cursor: (!name.trim() || !specialty) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s'
                                }}
                            >
                                Suivant <ArrowRight weight="bold" />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: Import */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px' }}>Nourrissez votre cerveau</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 32px' }}>Importez vos fiches existantes ou démarrez sur une base vierge.</p>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed rgba(255,255,255,0.2)',
                                    borderRadius: 24, padding: '40px 20px',
                                    textAlign: 'center', cursor: 'pointer',
                                    background: 'rgba(0,0,0,0.2)', marginBottom: 24,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isImporting ? (
                                    <div style={{ color: '#10b981' }}>Importation en cours...</div>
                                ) : importSuccessCount > 0 ? (
                                    <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                        <CheckCircle size={48} weight="fill" />
                                        <div style={{ fontWeight: 600 }}>{importSuccessCount} fiches importées !</div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                        <UploadSimple size={48} color="rgba(255,255,255,0.5)" />
                                        <div style={{ fontWeight: 600 }}>Importer un fichier CSV</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Format attendu : titre, contenu, tags</div>
                                    </div>
                                )}
                                <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={handleNext}
                                    style={{
                                        flex: 1, padding: 16, borderRadius: 16,
                                        background: 'rgba(255,255,255,0.05)', color: 'white',
                                        fontWeight: 600, border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    Passer
                                </button>
                                <button
                                    onClick={handleNext}
                                    style={{
                                        flex: 2, padding: 16, borderRadius: 16,
                                        background: 'white', color: 'black',
                                        fontWeight: 700, border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    Continuer
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Notifications */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                                boxShadow: '0 8px 32px rgba(99,102,241,0.4)'
                            }}>
                                <BellRinging size={40} color="white" weight="fill" />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 16px' }}>Ne perdez pas le fil</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.6 }}>
                                Activez les notifications pour savoir quand vos fiches doivent être révisées (algorithme FSRS). <br/>
                                <i>Aucun spam, promis.</i>
                            </p>

                            <button
                                onClick={handleRequestNotifications}
                                style={{
                                    width: '100%', padding: 16, borderRadius: 16,
                                    background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                                    fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer',
                                    marginBottom: 16, boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
                                }}
                            >
                                Activer les rappels
                            </button>
                            
                            <button
                                onClick={handleFinish}
                                style={{
                                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer', fontSize: '0.9rem', padding: 8
                                }}
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
