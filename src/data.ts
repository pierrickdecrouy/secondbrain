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

Ce cours de démonstration illustre la structuration de la base de connaissances médicale. Un cours est un assemblage de **Concepts Clés** fondamentaux et de **Flashcards** actives pour l'ancrage mémoriel.

### 📖 Introduction

Le Diabète regroupe des maladies métaboliques caractérisées par une hyperglycémie chronique résultant d'un défaut de sécrétion de l'insuline ou d'une résistance à celle-ci. L'Organisation Mondiale de la Santé (OMS) considère cette pathologie comme une épidémie mondiale.

> **Important** : La prise en charge précoce, intensive et multidisciplinaire est vitale pour éviter les complications redoutables (rétinopathie, néphropathie, neuropathie, complications cardiovasculaires).

### 🧠 Méthodologie d'apprentissage

Explorez les concepts ci-dessous (Insuline, Metformine, GLP-1, etc.) pour assimiler les briques fondamentales du cours. Chaque concept déroulant contient les connaissances essentielles à maîtriser. 
Une fois les concepts intégrés, testez-vous avec les **Flashcards** sur la droite pour initier votre algorithme de répétition espacée (FSRS).

---
*(Déroulez les Concepts ci-dessous pour afficher leur contenu intégral !)*`,
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
        details: `Le **Diabète Type 1** (5 à 10% des cas de diabète) survient le plus souvent chez l'enfant, l'adolescent ou le jeune adulte. Il est la conséquence d'une destruction auto-immune des cellules β des îlots de Langerhans du pancréas.

### 🔍 Signes cliniques inauguraux (Syndrome cardinal)
L'apparition est généralement brutale (quelques semaines) :
- **Polyurie** : urines très abondantes, souvent accompagnées d'énurésie chez l'enfant.
- **Polydipsie** : soif intense inextinguible pour compenser les pertes.
- **Amaigrissement paradoxal** : fonte musculaire et adipeuse malgré une polyphagie (faim conservée ou augmentée).

### ⚠️ Complication aiguë révélatrice : L'Acidocétose
> **Urgence diagnostique absolue** : Le risque majeur en l'absence de diagnostic est l'**Acidocétose diabétique**.
Elle se manifeste par des troubles digestifs (nausées, vomissements, douleurs abdominales), une respiration ample de Kussmaul, une haleine caractéristique (pomme reinette) et des troubles de la conscience pouvant aller jusqu'au coma.

### 💊 Traitement
Le seul traitement possible est l'**insulinothérapie à vie**. Elle doit mimer la sécrétion physiologique (schéma basal-bolus avec insulines lentes et rapides, ou pompe à insuline).`,
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
        details: `Le **Diabète Type 2** est une pathologie insidieuse, restant très souvent asymptomatique pendant des années (diagnostic souvent posé de façon fortuite sur un bilan sanguin de routine). Il représente 90% des cas de diabètes et est fortement corrélé au syndrome métabolique (surpoids, obésité abdominale, sédentarité, HTA).

### ⚙️ Physiopathologie : La cascade métabolique
1. **Insulinorésistance** : Sous l'effet de l'accumulation de graisses ectopiques (notamment viscérales), les tissus cibles (muscles striés, foie, tissu adipeux) répondent mal aux signaux de l'insuline.
2. **Hyperinsulinisme compensateur** : Pour maintenir l'homéostasie glycémique, le pancréas sécrète massivement de l'insuline. À ce stade, la glycémie est normale mais l'insuline est très élevée.
3. **Insulinopénie relative** : Après des années de surmenage, les cellules β s'épuisent. La sécrétion d'insuline décline et n'est plus capable de vaincre la résistance : c'est l'apparition de l'hyperglycémie et du diabète clinique.

### 💊 Stratégie thérapeutique
La prise en charge est **graduelle** :
1. **Mesures Hygiéno-Diététiques (MHD)** : Perte de poids (objectif 5 à 10%), activité physique régulière (150 min/semaine), rééquilibrage alimentaire.
2. **Monothérapie** : La **Metformine** reste le traitement médicamenteux de 1ère intention.
3. **Bithérapie / Trithérapie** : Ajout d'inhibiteurs de DPP-4, analogues du GLP-1, ou inhibiteurs de SGLT-2.
4. **Insulinothérapie** : En stade d'insulinorequérence (épuisement pancréatique total).`,
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
        details: `L'**HbA1c** (hémoglobine glyquée) est le marqueur de référence absolu pour l'évaluation de l'équilibre glycémique. Elle se forme par glycation non enzymatique (fixation du glucose) sur l'hémoglobine des globules rouges. 
La durée de vie d'un globule rouge étant de 120 jours, l'HbA1c reflète la **glycémie moyenne des 2 à 3 derniers mois**.

### 📊 Interprétation des valeurs

| Catégorie clinique | Valeur HbA1c |
|--------------------|--------------|
| Normale | < 5.7% |
| Prédiabète (Intolérance) | 5.7% - 6.4% |
| **Diabète avéré** | **≥ 6.5%** |

> **Cible thérapeutique** : L'objectif standard pour la plupart des diabétiques de type 2 est **< 7%**. Cet objectif doit être individualisé (plus strict < 6.5% chez les sujets jeunes ou au diagnostic récent, plus souple < 8% voire 9% chez les sujets âgés polypathologiques).

### 💡 Le saviez-vous ?
Une baisse de **1%** de l'HbA1c entraîne une réduction de plus de **30%** du risque de complications microvasculaires (rétinopathie, néphropathie) !`,
        tags: ['Bioch', 'Surveillance', 'Sang'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: 'ar-glp1',
        type: 'drug',
        nodeType: 'concept',
        parentId: 'demo-course-diabete',
        title: 'Analogues du GLP-1',
        subtitle: 'Incrétino-mimétiques',
        content: 'Classe thérapeutique récente très efficace sur la glycémie et la perte de poids.',
        details: `Les **Analogues du GLP-1** (ex: Sémaglutide, Liraglutide, Dulaglutide) miment l'action de l'hormone intestinale GLP-1 (Glucagon-Like Peptide 1) avec une durée d'action très prolongée (résistance à la DPP-4).

### ✨ Multiples mécanismes d'action
- **Pancréas** : Stimulent la sécrétion d'insuline et inhibent la sécrétion de glucagon de manière *gluco-dépendante* (risque d'hypoglycémie quasi-nul).
- **Estomac** : Ralentissent la vidange gastrique (diminution du pic glycémique post-prandial).
- **Cerveau** : Action centrale sur les centres de la satiété (perte de poids souvent majeure).

### 🛡️ Bénéfice majeur
Ils ont démontré de manière éclatante leur capacité à **réduire le risque cardiovasculaire** (infarctus, AVC) et à protéger la fonction rénale chez les patients diabétiques à haut risque.

> **Effets indésirables** : Essentiellement digestifs (nausées, vomissements) en début de traitement, nécessitant une titration progressive des doses.`,
        tags: ['Diabète', 'Incrétines', 'Perte de poids'],
        manualConnections: ['diabete-type-2'],
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
