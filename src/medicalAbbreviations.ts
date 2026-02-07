/**
 * Medical Abbreviation Dictionary
 * Maps common medical abbreviations to their full forms for query expansion
 */

export const MEDICAL_ABBREVIATIONS: Record<string, string[]> = {
    // Diabète
    'dt1': ['diabete type 1', 'diabete insulinodependant', 'did'],
    'dt2': ['diabete type 2', 'diabete non insulinodependant', 'dnid'],
    'did': ['diabete insulinodependant', 'diabete type 1', 'dt1'],
    'dnid': ['diabete non insulinodependant', 'diabete type 2', 'dt2'],

    // Cardiovasculaire
    'hta': ['hypertension arterielle', 'tension arterielle elevee'],
    'idm': ['infarctus du myocarde', 'crise cardiaque', 'infarctus'],
    'avc': ['accident vasculaire cerebral', 'attaque cerebrale'],
    'ic': ['insuffisance cardiaque'],
    'fa': ['fibrillation auriculaire', 'fibrillation atriale'],
    'ep': ['embolie pulmonaire'],
    'tvp': ['thrombose veineuse profonde', 'phlebite'],

    // Respiratoire
    'bpco': ['bronchopneumopathie chronique obstructive', 'bronchite chronique'],
    'ir': ['insuffisance respiratoire'],
    'ira': ['insuffisance respiratoire aigue', 'insuffisance renale aigue'], // Both meanings

    // Renal
    'irc': ['insuffisance renale chronique', 'maladie renale chronique'],
    'dfg': ['debit de filtration glomerulaire'],

    // Hepatique
    'ihc': ['insuffisance hepatocellulaire', 'insuffisance hepatique'],

    // Neurologie
    'sep': ['sclerose en plaques'],
    'alz': ['alzheimer', 'maladie alzheimer'],
    'park': ['parkinson', 'maladie parkinson'],

    // Infectieux
    'vih': ['virus immunodeficience humaine', 'sida', 'hiv'],
    'ist': ['infection sexuellement transmissible', 'mst'],
    'mst': ['maladie sexuellement transmissible', 'ist'],

    // Oncologie
    'k': ['cancer', 'carcinome', 'neoplasie'],
    'chimio': ['chimiotherapie'],
    'radio': ['radiotherapie'],

    // Medicaments
    'ains': ['anti inflammatoire non steroidien', 'ibuprofene', 'aspirine'],
    'atb': ['antibiotique', 'antibiotiques'],
    'avk': ['anti vitamine k', 'anticoagulant oral'],
    'aod': ['anticoagulant oral direct', 'naco'],
    'ipp': ['inhibiteur pompe protons', 'omeprazole', 'pantoprazole'],
    'iec': ['inhibiteur enzyme conversion'],
    'ara2': ['antagoniste recepteurs angiotensine', 'sartan'],
    'bb': ['beta bloquant', 'betabloquant'],
    'icc': ['inhibiteur calcique'],

    // Examens
    'nfs': ['numeration formule sanguine', 'hemogramme'],
    'crp': ['proteine c reactive', 'inflammation'],
    'vs': ['vitesse sedimentation'],
    'ecg': ['electrocardiogramme'],
    'irm': ['imagerie resonance magnetique'],
    'tdm': ['tomodensitometrie', 'scanner'],
    'rx': ['radiographie'],
    'bio': ['biologie', 'bilan biologique'],

    // Autres
    'atcd': ['antecedent', 'antecedents'],
    'ttt': ['traitement'],
    'po': ['per os', 'voie orale'],
    'iv': ['intraveineuse', 'voie intraveineuse'],
    'im': ['intramusculaire'],
    'sc': ['sous cutanee', 'voie sous cutanee'],
};
import { expandWithLearned } from './learnedAbbreviations';

/**
 * Expand a search query with medical abbreviations
 * Returns the original query plus any matched expansions from static + learned dictionaries
 */
export function expandMedicalQuery(query: string): string[] {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    const expansions = new Set<string>([lowerQuery]);

    // Check each word for abbreviation matches in static dictionary
    words.forEach(word => {
        const matches = MEDICAL_ABBREVIATIONS[word];
        if (matches) {
            matches.forEach(expansion => expansions.add(expansion));
        }
    });

    // Also check the full query as a single abbreviation
    const fullMatch = MEDICAL_ABBREVIATIONS[lowerQuery];
    if (fullMatch) {
        fullMatch.forEach(expansion => expansions.add(expansion));
    }

    // Add expansions from learned abbreviations
    const learnedExpansions = expandWithLearned(lowerQuery);
    learnedExpansions.forEach(exp => expansions.add(exp));

    return Array.from(expansions);
}
