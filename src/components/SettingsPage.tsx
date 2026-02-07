import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Settings,
    Database,
    X,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import { loadCustomAbbreviations, saveCustomAbbreviations, resetToDefaults } from '../storage';
import { MEDICAL_ABBREVIATIONS as defaultAbbreviations } from '../medicalAbbreviations';

interface SettingsPageProps {
    onClose: () => void;
    onSave?: () => void;
}

type Tab = 'dictionary' | 'general' | 'data';

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<Tab>('dictionary');
    const [abbreviations, setAbbreviations] = useState<{ [key: string]: string }>({});
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loaded = loadCustomAbbreviations();
        setAbbreviations(loaded);
    }, []);

    const handleAdd = () => {
        if (newKey && newValue) {
            const updated = { ...abbreviations, [newKey.toLowerCase()]: newValue };
            setAbbreviations(updated);
            saveCustomAbbreviations(updated);
            setNewKey('');
            setNewValue('');
            if (onSave) onSave();
        }
    };

    const handleDelete = (key: string) => {
        const updated = { ...abbreviations };
        delete updated[key];
        setAbbreviations(updated);
        saveCustomAbbreviations(updated);
        if (onSave) onSave();
    };

    const handleReset = () => {
        if (window.confirm('Voulez-vous vraiment réinitialiser le dictionnaire par défaut ?')) {
            resetToDefaults();
            // Convert Record<string, string[]> to Record<string, string> for the state
            const defaultSimple: Record<string, string> = {};
            Object.entries(defaultAbbreviations).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                    defaultSimple[key] = values[0];
                }
            });
            setAbbreviations(defaultSimple);
            if (onSave) onSave();
        }
    };

    // Filtrage pour la recherche
    const filteredAbbreviations = Object.entries(abbreviations).filter(([key, value]) =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        value.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a[0].localeCompare(b[0]));

    // Gestion du clic à l'extérieur pour fermer
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center font-sans p-6 bg-slate-900/60 backdrop-blur-md transition-all"
            onClick={handleOverlayClick}
        >
            <div className="bg-white w-[1080px] h-[720px] rounded-[32px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] flex relative overflow-hidden ring-1 ring-slate-100">

                {/* Sidebar */}
                <aside className="w-[280px] bg-slate-50/80 border-r border-slate-100 flex flex-col py-10 backdrop-blur-sm">
                    <div className="px-8 pb-8 border-b border-slate-100 mb-8">
                        <h1 className="text-[1.75rem] font-bold text-slate-800 tracking-tight m-0">Paramètres</h1>
                        <span className="text-[0.85rem] text-slate-400 font-medium block mt-2">PharmaBrain v1.0</span>
                    </div>

                    <nav className="flex flex-col gap-3 px-6">
                        <button
                            onClick={() => setActiveTab('dictionary')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-[1rem] font-medium transition-all relative cursor-pointer rounded-[20px] group ${activeTab === 'dictionary'
                                ? 'bg-white text-[#61b3a4] shadow-[0_4px_12px_rgba(97,179,164,0.1),0_0_0_1px_rgba(97,179,164,0.1)]'
                                : 'text-slate-500 hover:bg-white hover:text-[#61b3a4] hover:shadow-sm'
                                }`}
                        >
                            <BookOpen size={22} className={`transition-transform duration-300 ${activeTab === 'dictionary' ? 'scale-110' : 'group-hover:scale-110'}`} />
                            Dictionnaire
                        </button>
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-[1rem] font-medium transition-all relative cursor-pointer rounded-[20px] group ${activeTab === 'general'
                                ? 'bg-white text-[#61b3a4] shadow-[0_4px_12px_rgba(97,179,164,0.1),0_0_0_1px_rgba(97,179,164,0.1)]'
                                : 'text-slate-500 hover:bg-white hover:text-[#61b3a4] hover:shadow-sm'
                                }`}
                        >
                            <Settings size={22} className={`transition-transform duration-300 ${activeTab === 'general' ? 'scale-110' : 'group-hover:scale-110'}`} />
                            Général
                        </button>
                        <button
                            onClick={() => setActiveTab('data')}
                            className={`w-full flex items-center gap-4 px-6 py-4 text-[1rem] font-medium transition-all relative cursor-pointer rounded-[20px] group ${activeTab === 'data'
                                ? 'bg-white text-[#61b3a4] shadow-[0_4px_12px_rgba(97,179,164,0.1),0_0_0_1px_rgba(97,179,164,0.1)]'
                                : 'text-slate-500 hover:bg-white hover:text-[#61b3a4] hover:shadow-sm'
                                }`}
                        >
                            <Database size={22} className={`transition-transform duration-300 ${activeTab === 'data' ? 'scale-110' : 'group-hover:scale-110'}`} />
                            Données
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-[56px] flex flex-col relative bg-white">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[16px] transition-all cursor-pointer group z-10"
                    >
                        <X size={26} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {activeTab === 'dictionary' && (
                        <>
                            {/* Header Ajouter */}
                            <div className="flex items-center gap-3 mb-8 pl-1">
                                <span className="uppercase text-[0.75rem] font-bold tracking-widest text-[#64748b]/60">Ajouter une définition</span>
                            </div>

                            <div className="grid grid-cols-[180px_1fr_auto] gap-5 mb-14">
                                <input
                                    type="text"
                                    placeholder="Raccourci"
                                    className="h-[60px] bg-slate-50 border border-slate-100 rounded-[20px] px-8 text-[1.05rem] outline-none focus:bg-white focus:border-[#61b3a4] focus:shadow-[0_0_0_4px_rgba(97,179,164,0.1)] transition-all placeholder:text-slate-300 font-medium text-slate-700"
                                    value={newKey}
                                    onChange={(e) => setNewKey(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Définition complète"
                                    className="h-[60px] bg-slate-50 border border-slate-100 rounded-[20px] px-8 text-[1.05rem] outline-none focus:bg-white focus:border-[#61b3a4] focus:shadow-[0_0_0_4px_rgba(97,179,164,0.1)] transition-all placeholder:text-slate-300 text-slate-600"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    className="h-[60px] bg-[#61b3a4] hover:bg-[#5aa899] hover:translate-y-[-2px] hover:shadow-[0_12px_24px_-8px_rgba(97,179,164,0.4)] text-white font-bold px-10 rounded-[20px] flex items-center gap-3 shadow-[0_4px_12px_-4px_rgba(97,179,164,0.3)] transition-all border-none cursor-pointer text-[1.05rem] active:translate-y-[0px]"
                                >
                                    <Plus size={22} strokeWidth={2.5} />
                                    Ajouter
                                </button>
                            </div>

                            {/* Header Bibliothèque */}
                            <div className="flex justify-between items-end mb-6 pl-1 border-b border-slate-50 pb-6">
                                <div className="flex flex-col gap-1">
                                    <span className="uppercase text-[0.75rem] font-bold tracking-widest text-[#64748b]/60">Bibliothèque</span>
                                    <span className="text-2xl font-bold text-slate-700">{Object.keys(abbreviations).length} termes</span>
                                </div>
                                <div className="relative">
                                    <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        className="pl-16 pr-6 h-[50px] w-[320px] text-[0.95rem] bg-slate-50 border border-slate-100 rounded-[16px] outline-none focus:bg-white focus:border-[#61b3a4] focus:shadow-sm transition-all placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Liste */}
                            <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4 custom-scrollbar pb-6">
                                {filteredAbbreviations.map(([key, value]) => (
                                    <div key={key} className="group grid grid-cols-[140px_1fr_auto] items-center p-5 bg-white border border-slate-100 rounded-[20px] hover:border-[#61b3a4]/30 hover:shadow-[0_4px_20px_-12px_rgba(97,179,164,0.2)] transition-all">

                                        {/* Badge */}
                                        <div className="flex justify-start">
                                            <div className="text-center font-bold text-[#61b3a4] bg-[#f0fdfa] border border-[#ccfbf1] rounded-[12px] px-4 py-2.5 text-[0.95rem] inline-block shadow-sm">
                                                {key}
                                            </div>
                                        </div>

                                        <div className="pl-6 text-[1rem] text-slate-600 font-medium leading-relaxed">
                                            {value}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(key)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[12px] cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}

                                {filteredAbbreviations.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                                            <Search size={40} className="text-slate-200" />
                                        </div>
                                        <p className="text-lg font-medium">Aucun résultat</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'general' && (
                        <div className="h-full flex items-center justify-center text-center">
                            <div className="max-w-xs opacity-50">
                                <div className="w-20 h-20 bg-slate-100 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                    <Settings size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">En maintenance</h3>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <Database size={18} className="text-[#61b3a4]" />
                                <span className="uppercase text-[0.8rem] font-bold tracking-wider text-[#64748b]">Gestion des données</span>
                            </div>

                            <div className="p-8 border border-[#e2e8f0] rounded-[16px] bg-[#f8fafc]">
                                <h3 className="font-bold text-[#334155] text-lg mb-2">Réinitialisation</h3>
                                <p className="text-[#64748b] mb-6 leading-relaxed">
                                    Restaurer le dictionnaire médical par défaut. Attention, vos ajouts personnels seront perdus si vous n'avez pas de sauvegarde.
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-white border border-[#e2e8f0] text-rose-500 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm cursor-pointer"
                                >
                                    Réinitialiser le dictionnaire
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
