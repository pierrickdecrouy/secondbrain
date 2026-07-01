import type { Card } from './types';
import { COURSE_TYPE } from './types';

export const initialCards: Card[] = [
    {
        id: 'demo-course-diabete',
        type: COURSE_TYPE,
        nodeType: 'course',
        title: 'Le Diabète (Démo)',
        subtitle: 'Physiopathologie, Diagnostic et Traitements',
        content: 'Cours de référence complet sur le diabète de type 1 et 2.',
        details: `Bienvenue dans la visionneuse de cours d'Extnd !

Ce cours de démonstration vous montre comment structurer vos connaissances médicales. Un cours est composé de **Concepts Clés** (fiches) et de **Flashcards** (pour la mémorisation).

### 📖 Introduction
Le Diabète regroupe des maladies métaboliques caractérisées par une hyperglycémie chronique résultant d'un défaut de sécrétion de l'insuline ou d'une résistance à celle-ci.

> **Important** : La prise en charge précoce est vitale pour éviter les complications micro et macrovasculaires.

### 🧠 Méthodologie
Explorez les concepts ci-dessous (Insuline, Metformine, etc.) pour comprendre les briques fondamentales de ce cours. 
Ensuite, testez-vous avec les **Flashcards** pour expérimenter notre algorithme de répétition espacée (FSRS).

---
*(Cliquez sur les Concepts ou les Flashcards ci-dessous pour les afficher !)*`,
        tags: ['Endocrinologie', 'Métabolisme', 'Démo'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    // ==========================================
    // CONCEPTS
    // ==========================================
    {
        id: 'diabete-type-1',
        type: 'patho',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'Diabète de Type 1 (DT1)',
        subtitle: 'Maladie auto-immune',
        content: 'Destruction des cellules bêta du pancréas conduisant à une carence absolue en insuline.',
        details: `Le **Diabète Type 1** (5 à 10% des cas) survient généralement chez l'enfant ou le jeune adulte. Il est dû à une destruction auto-immune des cellules β des îlots de Langerhans du pancréas.

### Signes cliniques inauguraux (Syndrome cardinal)
- Polyurie (urines abondantes)
- Polydipsie (soif intense)
- Amaigrissement paradoxal
- Polyphagie

> **Urgence diagnostique** : Le risque majeur en l'absence de diagnostic est l'**Acidocétose diabétique** (coma, haleine pomme reinette, respiration de Kussmaul).

Le seul traitement possible est l'insulinothérapie à vie.`,
        tags: ['Auto-immun', 'Pancréas', 'Pédiatrie'],
        manualConnections: ['insuline'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'diabete-type-2',
        type: 'patho',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'Diabète de Type 2 (DT2)',
        subtitle: 'Insulinorésistance et carence relative',
        content: 'Maladie métabolique évolutive (90% des cas) caractérisée par une résistance à l\'insuline.',
        details: `Le **Diabète Type 2** est insidieux et souvent asymptomatique pendant des années. Il est fortement associé au surpoids, à la sédentarité et à l'âge.

### Physiopathologie
1. **Insulinorésistance** : Les muscles et le foie répondent mal à l'insuline.
2. **Hyperinsulinisme compensateur** : Le pancréas produit plus d'insuline pour maintenir la glycémie.
3. **Insulinopénie relative** : Épuisement des cellules β du pancréas.

### Traitement
Le traitement de 1ère intention repose toujours sur les **Mesures Hygiéno-Diététiques (MHD)** et la **Metformine**.`,
        tags: ['Métabolisme', 'Obésité', 'CV'],
        manualConnections: ['metformine', 'hba1c'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'insuline',
        type: 'drug',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'Insuline',
        subtitle: 'Hormone hypoglycémiante',
        content: 'Hormone polypeptidique sécrétée par les cellules bêta des îlots de Langerhans.',
        details: `L'**Insuline** est la seule hormone de l'organisme capable de faire baisser la glycémie.

### Action physiologique
Elle se lie aux récepteurs à activité Tyrosine Kinase, provoquant la translocation des transporteurs GLUT4 à la membrane des cellules musculaires et adipeuses.

### Indication thérapeutique
- Diabète de type 1 (absolument vitale)
- Diabète de type 2 (au stade d'insulinopénie ou en cas de déséquilibre sévère)
- Diabète gestationnel

> **Effet indésirable majeur** : L'hypoglycémie.`,
        tags: ['Diabète', 'Pancréas', 'Endocrino'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'metformine',
        type: 'drug',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'Metformine',
        subtitle: 'Biguanide',
        content: 'Antidiabétique oral de 1ère intention pour le diabète de type 2.',
        details: `La **Metformine** est la molécule de référence. Son avantage majeur est qu'elle ne provoque **pas d'hypoglycémie** en monothérapie.

### Mécanisme d'action
- Diminue la production hépatique de glucose (inhibition de la néoglucogenèse).
- Augmente la sensibilité à l'insuline au niveau musculaire.

### Contre-indications
- Insuffisance rénale sévère (DFG < 30 mL/min)
- Insuffisance cardiaque ou respiratoire sévère
Risque d'acidose lactique (rare mais gravissime).`,
        tags: ['Diabète', 'T2', 'Foie'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'hba1c',
        type: 'data',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'HbA1c (Hémoglobine glyquée)',
        subtitle: 'Marqueur de surveillance',
        content: 'Reflet de la glycémie moyenne sur les 2 à 3 derniers mois.',
        details: `L'**HbA1c** (hémoglobine glyquée) se forme par fixation non enzymatique du glucose sur l'hémoglobine des globules rouges (dont la durée de vie est de 120 jours).

| Catégorie | Valeur HbA1c |
|-----------|--------------|
| Normale | < 5.7% |
| Prédiabète | 5.7% - 6.4% |
| Diabète | ≥ 6.5% |

**Objectif cible** : Généralement < 7% pour la plupart des diabétiques de type 2.`,
        tags: ['Bioch', 'Surveillance', 'Sang'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    
    // ==========================================
    // FLASHCARDS
    // ==========================================
    {
        id: 'fc-1',
        type: 'data',
        nodeType: 'flashcard',
        format: 'q&a',
        parentId: 'demo-course-diabete',
        title: 'Seuil diagnostique Diabète (Glycémie à jeun)',
        subtitle: '',
        content: 'Quel est le seuil de glycémie veineuse à jeun pour poser le diagnostic de Diabète ?',
        details: '≥ 1.26 g/L (ou 7 mmol/L), vérifié à deux reprises.',
        tags: ['Diagnostic'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'fc-2',
        type: 'data',
        nodeType: 'flashcard',
        format: 'q&a',
        parentId: 'demo-course-diabete',
        title: 'Seuil HbA1c Diabète',
        subtitle: '',
        content: 'À partir de quel pourcentage d\'HbA1c peut-on poser le diagnostic de diabète ?',
        details: '≥ 6.5%',
        tags: ['Diagnostic', 'HbA1c'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'fc-3',
        type: 'patho',
        nodeType: 'flashcard',
        format: 'cloze',
        parentId: 'demo-course-diabete',
        title: 'Syndrome cardinal DT1',
        subtitle: '',
        content: 'Le syndrome cardinal du Diabète de Type 1 comprend une ||polyurie||, une ||polydipsie||, une polyphagie et un ||amaigrissement|| paradoxal.',
        details: 'Ceci est un texte à trou. Pendant la révision, les mots entre "||" seront masqués !',
        tags: ['Clinique'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'fc-4',
        type: 'drug',
        nodeType: 'flashcard',
        format: 'q&a',
        parentId: 'demo-course-diabete',
        title: 'Mécanisme d\'action Metformine',
        subtitle: '',
        content: 'Quel est le mécanisme d\'action principal de la Metformine ?',
        details: 'Elle diminue la néoglucogenèse hépatique (production de glucose par le foie).',
        tags: ['Pharmaco'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'fc-5',
        type: 'drug',
        nodeType: 'flashcard',
        format: 'cloze',
        parentId: 'demo-course-diabete',
        title: 'Contre-indication Metformine',
        subtitle: '',
        content: 'La complication majeure (bien que rare) redoutée avec la Metformine est l\'||acidose lactique||. Elle est donc contre-indiquée en cas d\'insuffisance ||rénale|| sévère (DFG < 30).',
        details: '',
        tags: ['Pharmaco', 'CI'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    }
];
