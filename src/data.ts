import type { Card } from './types';

export const initialCards: Card[] = [
    {
        id: 'insuline',
        type: 'drug',
        title: 'Insuline',
        subtitle: 'Hormone hypoglycémiante',
        content: 'Hormone polypeptidique sécrétée par les cellules bêta des îlots de Langerhans du pancréas.',
        details: `L'**Insuline** est essentielle à la régulation de la glycémie. Elle permet l'entrée du glucose dans les cellules.

- Indication : Diabète de type 1 et type 2 insulinorequérant.
- Mécanisme : Active les récepteurs tyrosine kinase.`,
        tags: ['Diabète', 'Pancréas', 'Endocrino'],
    },
    {
        id: 'metformine',
        type: 'drug',
        title: 'Metformine',
        subtitle: 'Biguanide',
        content: 'Antidiabétique oral de première intention pour le diabète de type 2.',
        details: `La **Metformine** diminue la production hépatique de glucose (néoglucogenèse) et augmente la sensibilité à l'insuline.

Elle ne provoque pas d'hypoglycémie seule.`,
        tags: ['Diabète', 'T2', 'Foie'],
    },
    {
        id: 'diabete-type-1',
        type: 'patho',
        title: 'Diabète Type 1',
        subtitle: 'Maladie auto-immune',
        content: 'Destruction des cellules bêta du pancréas conduisant à une carence absolue en insuline.',
        details: `Le **Diabète Type 1** nécessite un traitement substitutif à vie par Insuline.

Complications : Acidocétose (si carence), rétinopathie, néphropathie.`,
        tags: ['Auto-immun', 'Pancréas', 'Pédiatrie'],
    },
    {
        id: 'diabete-type-2',
        type: 'patho',
        title: 'Diabète Type 2',
        subtitle: 'Insulinorésistance',
        content: 'Maladie métabolique caractérisée par une résistance à l\'insuline et une carence relative.',
        details: `Le **Diabète Type 2** est souvent associé à l'obésité. Le traitement commence par les modifications du mode de vie et la Metformine.

À terme, l'Insuline peut devenir nécessaire.`,
        tags: ['Métabolisme', 'Obésité', 'CV'],
    },
    {
        id: 'cycle-krebs',
        type: 'physio',
        title: 'Cycle de Krebs',
        subtitle: 'Respiration cellulaire',
        content: 'Série de réactions biochimiques produisant de l\'ATP dans la mitochondrie.',
        details: `Aussi appelé cycle de l'acide citrique. Il est central dans le métabolisme des glucides, lipides et protéines.

Le glucose est transformé en pyruvate, puis en Acétyl-CoA pour entrer dans le cycle.`,
        tags: ['Bioch', 'Énergie', 'Mitochondrie'],
    },
    {
        id: 'hba1c',
        type: 'data',
        title: 'HbA1c',
        subtitle: 'Hémoglobine glyquée',
        content: 'Reflet de la glycémie moyenne sur les 3 derniers mois.',
        details: `L'**HbA1c** est le marqueur de surveillance du Diabète.

| Catégorie | Valeur |
|-----------|--------|
| Normale | < 5.7% |
| Diabète | ≥ 6.5% |
| Objectif | < 7% |`,
        tags: ['Bioch', 'Surveillance', 'Sang'],
    },
    {
        id: 'seuil-renal',
        type: 'data',
        title: 'Seuil rénal du glucose',
        subtitle: 'TmG',
        content: 'Concentration plasmatique de glucose au-delà de laquelle il apparaît dans les urines.',
        details: `Environ **1.80 g/L** (10 mmol/L). Au-delà, le cotransporteur SGLT2 est saturé et une glycosurie apparaît.`,
        tags: ['Rein', 'Physio', 'Diabète'],
    },
];
