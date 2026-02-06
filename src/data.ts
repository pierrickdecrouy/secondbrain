import type { Card } from './types';

export const initialCards: Card[] = [
    {
        id: 'insuline',
        type: 'drug',
        title: 'Insuline',
        subtitle: 'Hormone hypoglycémiante',
        content: 'Hormone polypeptidique sécrétée par les cellules bêta des îlots de Langerhans du pancréas.',
        details: `<p>L'<strong>Insuline</strong> est essentielle à la régulation de la glycémie. Elle permet l'entrée du glucose dans les cellules.</p>
    <ul>
      <li>Indication : Diabète de type 1 et type 2 insulinorequérant.</li>
      <li>Mécanisme : Active les récepteurs tyrosine kinase.</li>
    </ul>`,
        tags: ['Diabète', 'Pancréas', 'Endocrino'],
    },
    {
        id: 'metformine',
        type: 'drug',
        title: 'Metformine',
        subtitle: 'Biguanide',
        content: 'Antidiabétique oral de première intention pour le diabète de type 2.',
        details: `<p>La <strong>Metformine</strong> diminue la production hépatique de glucose (néoglucogenèse) et augmente la sensibilité à l'insuline.</p>
    <p>Elle ne provoque pas d'hypoglycémie seule.</p>`,
        tags: ['Diabète', 'T2', 'Foie'],
    },
    {
        id: 'diabete-type-1',
        type: 'patho',
        title: 'Diabète Type 1',
        subtitle: 'Maladie auto-immune',
        content: 'Destruction des cellules bêta du pancréas conduisant à une carence absolue en insuline.',
        details: `<p>Le <strong>Diabète Type 1</strong> nécessite un traitement substitutif à vie par Insuline.</p>
    <p>Complications : Acidocétose (si carence), rétinopathie, néphropathie.</p>`,
        tags: ['Auto-immun', 'Pancréas', 'Pédiatrie'],
    },
    {
        id: 'diabete-type-2',
        type: 'patho',
        title: 'Diabète Type 2',
        subtitle: 'Insulinorésistance',
        content: 'Maladie métabolique caractérisée par une résistance à l\'insuline et une carence relative.',
        details: `<p>Le <strong>Diabète Type 2</strong> est souvent associé à l'obésité. Le traitement commence par les modifications du mode de vie et la Metformine.</p>
    <p>À terme, l'Insuline peut devenir nécessaire.</p>`,
        tags: ['Métabolisme', 'Obésité', 'CV'],
    },
    {
        id: 'cycle-krebs',
        type: 'physio',
        title: 'Cycle de Krebs',
        subtitle: 'Respiration cellulaire',
        content: 'Série de réactions biochimiques produisant de l\'ATP dans la mitochondrie.',
        details: `<p>Aussi appelé cycle de l'acide citrique. Il est central dans le métabolisme des glucides, lipides et protéines.</p>
    <p>Le glucose est transformé en pyruvate, puis en Acétyl-CoA pour entrer dans le cycle.</p>`,
        tags: ['Bioch', 'Énergie', 'Mitochondrie'],
    },
    {
        id: 'hba1c',
        type: 'data',
        title: 'HbA1c',
        subtitle: 'Hémoglobine glyquée',
        content: 'Reflet de la glycémie moyenne sur les 3 derniers mois.',
        details: `<p>L'<strong>HbA1c</strong> est le marqueur de surveillance du Diabète.</p>
    <ul>
      <li>Normale : < 5.7%</li>
      <li>Diabète : ≥ 6.5%</li>
      <li>Objectif : Généralement < 7%</li>
    </ul>`,
        tags: ['Bioch', 'Surveillance', 'Sang'],
    },
    {
        id: 'seuil-renal',
        type: 'data',
        title: 'Seuil rénal du glucose',
        subtitle: 'TmG',
        content: 'Concentration plasmatique de glucose au-delà de laquelle il apparaît dans les urines.',
        details: `<p>Environ <strong>1.80 g/L</strong> (10 mmol/L). Au-delà, le cotransporteur SGLT2 est saturé et une glycosurie apparaît.</p>`,
        tags: ['Rein', 'Physio', 'Diabète'],
    },
];
