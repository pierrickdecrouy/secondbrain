import type { Card } from '../types';
import { generateId } from '../types';

export const defaultCards: Card[] = [
    {
        id: generateId(),
        nodeType: 'concept',
        type: 'drug',
        title: 'Paracétamol',
        subtitle: 'Doliprane, Dafalgan, Efferalgan',
        content: `Le paracétamol (ou acétaminophène) est le composé actif de nombreuses spécialités médicamenteuses de la classe des antalgiques antipyrétiques non salicylés.`,
        details: `Il est indiqué dans le traitement symptomatique de la douleur d'intensité légère à modérée et/ou des états fébriles.\n\n## Mécanisme d'action\nInhibition centrale de la synthèse des prostaglandines.\n\n## Posologie (adulte)\n- 500 mg à 1 g par prise\n- Espace minimum entre les prises : 4 à 6 heures\n- Dose maximale journalière : 4 g (en l'absence de facteurs de risque)`,
        tags: ['antalgique', 'antipyrétique'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        manualConnections: [],
        progress: {
            status: 'new',
            step: 0,
            dueDate: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            lapses: 0
        }
    },
    {
        id: generateId(),
        nodeType: 'flashcard',
        type: 'physio',
        format: 'q&a',
        title: 'Quel est l\'antidote en cas d\'intoxication au paracétamol ?',
        subtitle: 'Toxicologie',
        details: 'La **N-acétylcystéine** (Fluimucil) administrée par voie intraveineuse.',
        content: 'Question sur l\'antidote du paracétamol',
        tags: ['toxicologie', 'antidote'],
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
        manualConnections: [],
        progress: {
            status: 'new',
            step: 0,
            dueDate: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            lapses: 0
        }
    },
    {
        id: generateId(),
        nodeType: 'concept',
        type: 'patho',
        title: 'Infarctus du Myocarde (IDM)',
        subtitle: 'Syndrome Coronarien Aigu (SCA)',
        content: `L'infarctus du myocarde (IDM) est une nécrose d'une partie du muscle cardiaque secondaire à une ischémie prolongée.`,
        details: `## Signes cliniques\n- Douleur thoracique rétro-sternale, constrictive, irradiant vers le bras gauche ou la mâchoire.\n- Dyspnée, sueurs, nausées.\n\n## Diagnostic\n- **ECG** : Sus-décalage du segment ST (SCA ST+).\n- **Biologie** : Élévation de la troponine.`,
        tags: ['cardiologie', 'urgence'],
        createdAt: Date.now() - 2000,
        updatedAt: Date.now() - 2000,
        manualConnections: [],
        progress: {
            status: 'new',
            step: 0,
            dueDate: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            lapses: 0
        }
    },
    {
        id: generateId(),
        nodeType: 'flashcard',
        type: 'drug',
        format: 'cloze',
        title: 'Traitement de l\'IDM (MONA)',
        subtitle: 'Mnémonique',
        content: `Le traitement immédiat de l'IDM peut être mémorisé par l'acronyme MONA : {Morphine}, {Oxygène}, {Nitroglycérine} (dérivés nitrés), {Aspirine}.`,
        details: `Le traitement immédiat de l'IDM peut être mémorisé par l'acronyme MONA : {Morphine}, {Oxygène}, {Nitroglycérine} (dérivés nitrés), {Aspirine}.`,
        tags: ['cardiologie', 'mnémonique'],
        createdAt: Date.now() - 3000,
        updatedAt: Date.now() - 3000,
        manualConnections: [],
        progress: {
            status: 'new',
            step: 0,
            dueDate: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            lapses: 0
        }
    }
];
