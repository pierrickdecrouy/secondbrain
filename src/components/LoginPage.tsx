import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './styles/LoginPage.css';

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
        <div className="loginpage-style-1" >
            {/* Canvas */}
            <canvas ref={canvasRef} className="loginpage-style-2"  />

            {/* Orbs */}
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                className="loginpage-style-3"  />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="loginpage-style-4"  />
            <motion.div animate={{ y: [0, -30, 0], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
                className="loginpage-style-5"  />

            {/* Layout — tout centré en colonne serrée */}
            <div className="loginpage-style-6" >

                {/* Logo */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                    <motion.img
                        src="/Logo-linear.svg"
                        alt="Extnd."
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="loginpage-style-7" 
                    />
                </motion.div>

                {/* Slogan */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="loginpage-style-8" >
                    <h1 className="loginpage-style-9" >
                        Your Mind.<br />Without limits.
                    </h1>
                    <AnimatePresence mode="wait">
                        <motion.p key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            className="loginpage-style-10" >
                            {subtitles[mode]}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="loginpage-style-11" 
                >
                    {/* Accent */}
                    <div className="loginpage-style-12"  />

                    <form onSubmit={handleSubmit} className="loginpage-style-13" >
                        <AnimatePresence>
                            {mode === 'signup' && (
                                <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="loginpage-style-14" >
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
                                <motion.div key="pwd" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="loginpage-style-15" >
                                    <input type="password" placeholder={t('auth.password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} required style={inp}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.11)')} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode === 'login' && (
                            <div className="loginpage-style-16" >
                                <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                                    className="loginpage-style-17" >
                                    {t('auth.switch_reset')}
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {(error || success) && (
                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="loginpage-style-18" style={{
  color: error ? '#f87171' : '#34d399',
  background: error ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
  border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`
}}>
                                    {error || success}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 0 36px rgba(16,185,129,0.4)' }} whileTap={{ scale: 0.97 }} disabled={loading}
                            className="loginpage-style-19" style={{
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.6 : 1
}}>
                            {loading ? '…' : mode === 'login' ? t('auth.btn_login') : mode === 'signup' ? t('auth.btn_signup') : t('auth.btn_reset')}
                        </motion.button>
                    </form>

                    {mode !== 'reset' && (
                        <>
                            <div className="loginpage-style-20" >
                                <div className="loginpage-style-21"  />
                                <span className="loginpage-style-22" >OU</span>
                                <div className="loginpage-style-23"  />
                            </div>
                            <motion.button onClick={handleGoogle} whileHover={{ background: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.97 }}
                                className="loginpage-style-24" >
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
                    <div className="loginpage-style-25" >
                        {mode === 'login' && (
                            <p className="loginpage-style-26" >
                                {t('auth.no_account')}{' '}
                                <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                                    className="loginpage-style-27" >
                                    {t('auth.btn_signup')}
                                </button>
                            </p>
                        )}
                        {mode === 'signup' && (
                            <p className="loginpage-style-28" >
                                {t('auth.has_account')}{' '}
                                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                    className="loginpage-style-29" >
                                    {t('auth.btn_login')}
                                </button>
                            </p>
                        )}
                        {mode === 'reset' && (
                            <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                                className="loginpage-style-30" >
                                ← {t('auth.back')}
                            </button>
                        )}
                        <button type="button" onClick={onBypass}
                            className="loginpage-style-31" >
                            {t('auth.bypass')} →
                        </button>
                    </div>
                </motion.div>

                {/* Tags discrets */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                    className="loginpage-style-32" >
                    {['Graphe de connaissances', 'Répétition FSRS', 'Export Anki', 'Cloud'].map(tag => (
                        <span key={tag} className="loginpage-style-33" >
                            {tag}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
