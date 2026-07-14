import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface LoginPageProps {
    onBypass: () => void;
}

type AuthMode = 'login' | 'signup' | 'reset';

export const LoginPage: React.FC<LoginPageProps> = ({ onBypass }) => {
    const { t } = useTranslation();
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animId: number;
        const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        setSize();
        window.addEventListener('resize', setSize);
        const colors = ['#10b981', '#6366f1', '#3b82f6', '#a855f7', '#06b6d4'];
        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.4,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.3 + 0.07,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
                ctx.fill();
            }
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', setSize); };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            if (mode === 'reset') {
                await resetPassword(email);
                setSuccess(t('auth.reset_sent'));
            } else if (mode === 'signup') {
                await signUpWithEmail(email, password, name);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            const c = err.code;
            if (c === 'auth/email-already-in-use') setError(t('auth.email_in_use'));
            else if (c === 'auth/invalid-email') setError(t('auth.invalid_email'));
            else if (c === 'auth/wrong-password' || c === 'auth/invalid-credential') setError(t('auth.wrong_password'));
            else if (c === 'auth/weak-password') setError(t('auth.weak_password'));
            else if (c === 'auth/user-not-found') setError(t('auth.user_not_found'));
            else setError(t('auth.error_generic'));
        } finally { setLoading(false); }
    };

    const handleGoogle = async () => {
        setError(''); setLoading(true);
        try { await signInWithGoogle(); }
        catch { setError(t('auth.google_cancelled')); }
        finally { setLoading(false); }
    };

    const subtitles: Record<AuthMode, string> = {
        login: t('auth.login'),
        signup: t('auth.signup'),
        reset: t('auth.reset'),
    };

    const inp: React.CSSProperties = {
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: '10px',
        padding: '11px 14px',
        color: 'white',
        fontSize: '0.875rem',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'linear-gradient(135deg, #0f0c29, #1a1a4e, #0d1b2a)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            overflow: 'hidden',
        }}>
            {/* Canvas */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

            {/* Orbs */}
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.32) 0%, transparent 70%)', filter: 'blur(70px)', zIndex: 1, pointerEvents: 'none' }} />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '65vw', height: '65vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.38) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 1, pointerEvents: 'none' }} />
            <motion.div animate={{ y: [0, -30, 0], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
                style={{ position: 'absolute', top: '30%', right: '10%', width: '35vw', height: '35vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none' }} />

            {/* Layout — tout centré en colonne serrée */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 420, padding: '0 20px', gap: '20px' }}>

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                    <motion.img
                        src="/Logo-linear.svg"
                        alt="Extnd."
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ height: 'clamp(40px, 7vw, 60px)', filter: 'brightness(0) invert(1)', opacity: 0.9, display: 'block', userSelect: 'none', pointerEvents: 'none' }}
                    />
                </motion.div>

                {/* Slogan */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.6rem, 5.5vw, 2.4rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.15,
                        margin: 0,
                        background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #6ee7b7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Your Mind.<br />Without limits.
                    </h1>
                    <AnimatePresence mode="wait">
                        <motion.p key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem', margin: '8px 0 0', fontWeight: 400, lineHeight: 1.5 }}>
                            {subtitles[mode]}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.13)',
                        borderRadius: '24px',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        padding: '28px 32px',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                >
                    {/* Accent */}
                    <div style={{ height: '1.5px', background: 'linear-gradient(90deg, transparent, #10b981 30%, #6366f1 70%, transparent)', borderRadius: '1px', marginBottom: '22px' }} />

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                                    <input type="text" placeholder={t('auth.name_placeholder')} value={name} onChange={e => setName(e.target.value)} required style={inp}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.11)')} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={e => setEmail(e.target.value)} required style={inp}
                            onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.11)')} />

                        <AnimatePresence>
                            {mode !== 'reset' && (
                                <motion.div key="pwd" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                                    <input type="password" placeholder={t('auth.password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required style={inp}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.11)')} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode === 'login' && (
                            <div style={{ textAlign: 'right', marginTop: '-2px' }}>
                                <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                                    {t('auth.switch_reset')}
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {(error || success) && (
                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ color: error ? '#f87171' : '#34d399', fontSize: '0.75rem', margin: 0, padding: '7px 11px', background: error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: '8px', border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                    {error || success}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 0 36px rgba(16,185,129,0.4)' }} whileTap={{ scale: 0.97 }} disabled={loading}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: '2px', boxShadow: '0 4px 20px rgba(16,185,129,0.35)', transition: 'opacity 0.2s' }}>
                            {loading ? '…' : mode === 'login' ? t('auth.btn_login') : mode === 'signup' ? t('auth.btn_signup') : t('auth.btn_reset')}
                        </motion.button>
                    </form>

                    {mode !== 'reset' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.09)' }} />
                                <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.68rem', letterSpacing: '0.05em' }}>OU</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.09)' }} />
                            </div>
                            <motion.button onClick={handleGoogle} whileHover={{ background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.97 }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
                                <svg width="17" height="17" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                {t('auth.btn_google')}
                            </motion.button>
                        </>
                    )}

                    {/* Toggle + Offline */}
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {mode === 'login' && (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
                                {t('auth.no_account')}{' '}
                                <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
                                    {t('auth.btn_signup')}
                                </button>
                            </p>
                        )}
                        {mode === 'signup' && (
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: 0 }}>
                                {t('auth.has_account')}{' '}
                                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit' }}>
                                    {t('auth.btn_login')}
                                </button>
                            </p>
                        )}
                        {mode === 'reset' && (
                            <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                ← {t('auth.back')}
                            </button>
                        )}
                        <button type="button" onClick={onBypass}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                            {t('auth.bypass')} →
                        </button>
                    </div>
                </motion.div>

                {/* Tags discrets */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                    {['Graphe de connaissances', 'Répétition FSRS', 'Export Anki', 'Cloud'].map(tag => (
                        <span key={tag} style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', fontWeight: 500, padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {tag}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
