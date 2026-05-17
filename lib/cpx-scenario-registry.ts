import dysphagiaScenario from '../data/cpx/cpx_01_dysphagia.json';
import jaundiceScenario from '../data/cpx/cpx_02_jaundice.json';
import indigestionScenario from '../data/cpx/cpx_03_indigestion.json';
import hematocheziaScenario from '../data/cpx/cpx_04_hematochezia.json';
import abdominalPainScenario from '../data/cpx/cpx_05_abdominal_pain.json';
import constipationScenario from '../data/cpx/cpx_06_constipation.json';
import hematemesisScenario from '../data/cpx/cpx_07_hematemesis.json';
import diarrheaScenario from '../data/cpx/cpx_08_diarrhea.json';
import vomitingScenario from '../data/cpx/cpx_09_vomiting.json';
import epigastricPainScenario from '../data/cpx/cpx_10_epigastric_pain.json';
import { normalizeCpxCaseId } from './cpx-case';
import { StructuredCpxScenario } from './cpx-structured-scenario';

const STRUCTURED_CPX_SCENARIOS: Record<string, StructuredCpxScenario> = {
    cpx_01: dysphagiaScenario as StructuredCpxScenario,
    cpx_02: jaundiceScenario as StructuredCpxScenario,
    cpx_03: indigestionScenario as StructuredCpxScenario,
    cpx_04: hematocheziaScenario as StructuredCpxScenario,
    cpx_05: abdominalPainScenario as StructuredCpxScenario,
    cpx_06: constipationScenario as StructuredCpxScenario,
    cpx_07: hematemesisScenario as StructuredCpxScenario,
    cpx_08: diarrheaScenario as StructuredCpxScenario,
    cpx_09: vomitingScenario as StructuredCpxScenario,
    cpx_10: epigastricPainScenario as StructuredCpxScenario,
};

export function getStructuredCpxScenario(caseId: string | null | undefined): StructuredCpxScenario | null {
    const normalizedCaseId = normalizeCpxCaseId(caseId);
    return normalizedCaseId ? STRUCTURED_CPX_SCENARIOS[normalizedCaseId] || null : null;
}
