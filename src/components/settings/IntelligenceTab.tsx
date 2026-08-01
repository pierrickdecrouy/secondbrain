import React, { useState, useEffect } from 'react';
import { Brain, Lightning, ShieldWarning, Trash } from '@phosphor-icons/react';
import { getDashboardStats, resetFeedback, type DashboardStats } from '../../linkFeedback';
import { S, SettingsCard, CardSection, CardBody, StatCard, DangerButton } from './SettingsUI';
import './styles/IntelligenceTab.css';

export const IntelligenceTab: React.FC = () => {
    const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        setDashStats(getDashboardStats());
    }, []);

    if (!dashStats) return null;

    const score = dashStats.learningScore;
    const scoreColor = score >= 75 ? S.primary : score >= 40 ? S.warning : S.danger;

    return (
        <div className="intelligencetab-style-1" >
            {/* Score card */}
            <SettingsCard>
                <CardBody className="intelligencetab-style-2" >
                    {/* Circle gauge */}
                    <div className="intelligencetab-style-3" >
                        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="intelligencetab-style-4" >
                            <circle cx="44" cy="44" r="36" stroke={S.border} strokeWidth="8" fill="none" />
                            <circle
                                cx="44" cy="44" r="36"
                                stroke={scoreColor}
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 100)}`}
                                strokeLinecap="round"
                                className="intelligencetab-style-5" 
                            />
                        </svg>
                        <div className="intelligencetab-style-6" >
                            <span className="intelligencetab-style-7" style={{
  color: scoreColor
}}>{score}</span>
                            <span className="intelligencetab-style-8" style={{
  color: S.muted
}}>/100</span>
                        </div>
                    </div>
                    <div>
                        <div className="intelligencetab-style-9" style={{
  color: S.text
}}>Score d'apprentissage</div>
                        <div className="intelligencetab-style-10" style={{
  color: S.muted
}}>
                            Évaluation de la qualité de l'algorithme de liens sémantiques basée sur vos retours.
                        </div>
                    </div>
                </CardBody>
            </SettingsCard>

            {/* KPI grid */}
            <div className="intelligencetab-style-11" >
                <StatCard label="Liens générés" value={dashStats.totalLinksGenerated} color="#a855f7" />
                <StatCard label="Supprimés" value={dashStats.totalSuppressed} color={S.danger} />
                <StatCard label="Manuels" value={dashStats.totalManual} color={S.primary} />
                <StatCard label="Taux d'acceptation" value={`${dashStats.acceptanceRate}%`} color="#8b5cf6" />
            </div>

            {/* Patterns + type-pair */}
            <div className="intelligencetab-style-12" >
                <SettingsCard>
                    <CardSection title="Patterns appris" icon={<Brain size={16} />} />
                    <CardBody className="intelligencetab-style-13" >
                        {[
                            { label: 'Positifs (boosts)', value: dashStats.positivePatternCount, color: S.primary },
                            { label: 'Négatifs (pénalités)', value: dashStats.negativePatternCount, color: S.danger },
                            { label: 'Vetos (hard)', value: dashStats.vetoCount, color: S.warning },
                        ].map((row, i, arr) => (
                            <div key={row.label} className="intelligencetab-style-14" style={{
  borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : 'none'
}}>
                                <span className="intelligencetab-style-15" style={{
  color: S.muted
}}>{row.label}</span>
                                <span className="intelligencetab-style-16" style={{
  color: row.color
}}>{row.value}</span>
                            </div>
                        ))}
                    </CardBody>
                </SettingsCard>

                <SettingsCard>
                    <CardSection title="Scores type-pair" icon={<Lightning size={16} />} />
                    <CardBody>
                        {Object.entries(dashStats.typePairScores).length === 0 ? (
                            <div className="intelligencetab-style-17" style={{
  color: S.muted
}}>
                                Aucune donnée enregistrée pour l'instant.
                            </div>
                        ) : (
                            <div className="intelligencetab-style-18" >
                                {Object.entries(dashStats.typePairScores).map(([pair, score]) => (
                                    <div key={pair} className="intelligencetab-style-19" >
                                        <span className="intelligencetab-style-20" style={{
  color: S.muted
}}>{pair.replace('|', ' ↔ ')}</span>
                                        <span className="intelligencetab-style-21" style={{
  color: score > 0 ? S.primary : score < 0 ? S.danger : S.muted
}}>
                                            {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </SettingsCard>
            </div>

            {/* Toxic keywords */}
            {dashStats.topToxicKeywords.length > 0 && (
                <SettingsCard>
                    <CardSection title="Mots-clés toxiques" subtitle="Ces termes génèrent souvent des faux positifs et sont automatiquement pénalisés." icon={<ShieldWarning size={16} />} />
                    <CardBody>
                        <div className="intelligencetab-style-22" >
                            {dashStats.topToxicKeywords.map(tw => (
                                <span key={tw.word} className="intelligencetab-style-23" style={{
  border: `1px solid ${tw.count >= 3 ? S.danger + '66' : S.warning + '66'}`,
  background: tw.count >= 3 ? S.dangerDim : S.warningDim,
  color: tw.count >= 3 ? S.danger : S.warning
}}>
                                    {tw.word} <span className="intelligencetab-style-24" >×{tw.count}</span>
                                </span>
                            ))}
                        </div>
                    </CardBody>
                </SettingsCard>
            )}

            {/* Reset */}
            <SettingsCard danger>
                <CardBody className="intelligencetab-style-25" >
                    <div className="intelligencetab-style-26" style={{
  background: S.dangerDim,
  color: S.danger
}}>
                        <Trash size={20} />
                    </div>
                    <div className="intelligencetab-style-27" >
                        <div className="intelligencetab-style-28" style={{
  color: S.text
}}>Réinitialiser l'intelligence</div>
                        <div className="intelligencetab-style-29" style={{
  color: S.muted
}}>
                            Supprime tous les patterns, vetos et mots toxiques appris. L'algorithme repartira de zéro.
                        </div>
                    </div>
                    <DangerButton onClick={() => {
                        if (confirm("Réinitialiser toute l'intelligence apprise ?")) {
                            resetFeedback();
                            setDashStats(getDashboardStats());
                        }
                    }}>
                        Réinitialiser
                    </DangerButton>
                </CardBody>
            </SettingsCard>
        </div>
    );
};
