import React, { useState, useEffect } from 'react';
import { getLearnedAbbreviations, addAbbreviation, deleteAbbreviation, removeAbbreviation } from '../learnedAbbreviations';
import { Trash2, Plus, Search, Settings, CheckCircle2, Database, AlertCircle, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPageProps {
    onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'abbreviations' | 'data'>('abbreviations');
    const [abbreviations, setAbbreviations] = useState<Record<string, string[]>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [newAbbr, setNewAbbr] = useState('');
    const [newDef, setNewDef] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setAbbreviations(getLearnedAbbreviations());
    };

    const handleAdd = () => {
        if (!newAbbr.trim() || !newDef.trim()) {
            setMessage({ type: 'error', text: 'Champs requis' });
            return;
        }

        try {
            addAbbreviation(newAbbr, newDef);
            setAbbreviations(getLearnedAbbreviations());
            setNewAbbr('');
            setNewDef('');
            setMessage({ type: 'success', text: 'Ajouté avec succès' });

            if (window.electronAPI?.saveAbbreviations) {
                window.electronAPI.saveAbbreviations(getLearnedAbbreviations());
            }

            setTimeout(() => setMessage(null), 2500);
        } catch (e) {
            setMessage({ type: 'error', text: 'Erreur lors de l\'ajout' });
        }
    };

    const handleDelete = (abbr: string, def?: string) => {
        if (def) {
            removeAbbreviation(abbr, def);
        } else {
            deleteAbbreviation(abbr);
        }
        setAbbreviations(getLearnedAbbreviations());

        if (window.electronAPI?.saveAbbreviations) {
            window.electronAPI.saveAbbreviations(getLearnedAbbreviations());
        }
    };

    const filteredAbbrs = Object.entries(abbreviations)
        .filter(([abbr, defs]) => {
            const search = searchTerm.toLowerCase();
            return abbr.toLowerCase().includes(search) ||
                defs.some(d => d.toLowerCase().includes(search));
        })
        .sort((a, b) => a[0].localeCompare(b[0]));

    // Custom Scrollbar styles injected
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onBack();
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[200] flex items-center justify-center font-sans p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm transition-all"
        >
            {/* Modal Container - Matches Mockup Dimensions & Style */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-white w-[960px] h-[640px] rounded-[24px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <aside className="w-[260px] bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col py-8">
                    <div className="px-8 pb-8 border-b border-[#e2e8f0] mb-6">
                        <h1 className="text-[1.5rem] font-bold text-[#334155] tracking-tight m-0">Paramètres</h1>
                        <span className="text-[0.8rem] text-[#64748b] font-medium block mt-1.5">PharmaBrain v1.0</span>
                    </div>

                    <nav className="flex flex-col gap-2 px-4">
                        <NavButton
                            active={activeTab === 'abbreviations'}
                            onClick={() => setActiveTab('abbreviations')}
                            icon={<BookOpen size={20} />}
                            label="Dictionnaire"
                        />
                        <NavButton
                            active={activeTab === 'general'}
                            onClick={() => setActiveTab('general')}
                            icon={<Settings size={20} />}
                            label="Général"
                        />
                        <NavButton
                            active={activeTab === 'data'}
                            onClick={() => setActiveTab('data')}
                            icon={<Database size={20} />}
                            label="Données"
                        />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-[48px] flex flex-col relative bg-white">
                    {/* Close Button */}
                    <button
                        onClick={onBack}
                        className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#f1f5f9] rounded-full transition-colors cursor-pointer"
                    >
                        <X size={24} />
                    </button>

                    {activeTab === 'abbreviations' ? (
                        <>
                            {/* Add Section */}
                            <div className="flex items-center gap-3 mb-8">
                                <Plus size={18} className="text-[#61b3a4]" />
                                <span className="uppercase text-[0.8rem] font-bold tracking-wider text-[#64748b]">Ajouter une définition</span>
                            </div>

                            <div className="grid grid-cols-[160px_1fr_auto] gap-4 mb-12">
                                <input
                                    type="text"
                                    value={newAbbr}
                                    onChange={(e) => setNewAbbr(e.target.value)}
                                    placeholder="Raccourci (ex: IV)"
                                    className="border-[1.5px] border-[#e2e8f0] rounded-[16px] px-5 py-3.5 text-[1rem] outline-none focus:border-[#61b3a4] focus:shadow-[0_0_0_4px_rgba(97,179,164,0.1)] transition-all placeholder:text-[#cbd5e1]"
                                />
                                <input
                                    type="text"
                                    value={newDef}
                                    onChange={(e) => setNewDef(e.target.value)}
                                    placeholder="Définition (ex: Intraveineuse)"
                                    className="border-[1.5px] border-[#e2e8f0] rounded-[16px] px-5 py-3.5 text-[1rem] outline-none focus:border-[#61b3a4] focus:shadow-[0_0_0_4px_rgba(97,179,164,0.1)] transition-all placeholder:text-[#cbd5e1]"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    className="bg-[#61b3a4] hover:translate-y-px hover:shadow-[0_8px_16px_rgba(97,179,164,0.3)] text-white font-semibold px-8 rounded-[16px] flex items-center gap-2.5 shadow-sm transition-all border-none cursor-pointer text-[1rem]"
                                    style={{ height: '54px' }}
                                >
                                    <Plus size={20} />
                                    Ajouter
                                </button>
                            </div>

                            {/* Feedback Message */}
                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        className={`overflow-hidden text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
                                    >
                                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Library Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={18} className="text-[#61b3a4]" />
                                    <span className="uppercase text-[0.8rem] font-bold tracking-wider text-[#64748b]">
                                        Bibliothèque ({filteredAbbrs.length})
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Rechercher..."
                                        className="pl-11 pr-4 h-[42px] w-[240px] text-[0.9rem] bg-white border border-[#e2e8f0] rounded-[12px] outline-none focus:border-[#61b3a4] transition-all"
                                    />
                                </div>
                            </div>

                            {/* List Container */}
                            <div className="flex-1 overflow-y-auto pr-3 -mr-3 space-y-[12px] custom-scrollbar">
                                {filteredAbbrs.length > 0 ? (
                                    filteredAbbrs.map(([abbr, defs]) => (
                                        <div key={abbr} className="group grid grid-cols-[120px_1fr_auto] items-center p-[16px_20px] bg-white border border-[#e2e8f0] rounded-[16px] hover:border-[#61b3a4] hover:bg-[rgba(97,179,164,0.05)] transition-all mb-[12px]">
                                            {/* Badge */}
                                            <div className="flex justify-start">
                                                <div className="text-center font-bold text-[#61b3a4] bg-[#f0fdfa] border border-[rgba(97,179,164,0.3)] rounded-[8px] px-3 py-1.5 text-[0.9rem] inline-block w-full">
                                                    {abbr}
                                                </div>
                                            </div>

                                            {/* Definitions */}
                                            <div className="pl-6 text-[0.95rem] text-[#334155] font-normal leading-relaxed">
                                                {defs.map((def, idx) => (
                                                    <span key={idx} className="block">
                                                        {def}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Delete All Action */}
                                            <button
                                                onClick={() => handleDelete(abbr)}
                                                className="text-[#cbd5e1] hover:text-[#ef4444] p-2 rounded-lg hover:bg-rose-50 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-[#94a3b8] opacity-60">
                                        <Search size={40} className="mb-3" />
                                        <p className="text-base font-medium">Aucun résultat</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <div className="max-w-xs opacity-50">
                                <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                    <Settings size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">En maintenance</h3>
                            </div>
                        </div>
                    )}
                </main>
            </motion.div>
        </div>
    );
};

// Sub-components
const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-6 py-4 text-[0.95rem] font-medium transition-all relative cursor-pointer rounded-r-xl mr-2 ${active
            ? 'bg-white text-[#61b3a4] shadow-sm'
            : 'text-[#64748b] hover:bg-white/60 hover:text-[#61b3a4]'
            }`}
    >
        {active && (
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#61b3a4] rounded-r-full" />
        )}
        {icon}
        {label}
    </button>
);
