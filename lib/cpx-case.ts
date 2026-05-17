const STRUCTURED_CPX_CASE_IDS = new Set([
    'cpx_01',
    'cpx_02',
    'cpx_03',
    'cpx_04',
    'cpx_05',
    'cpx_06',
    'cpx_07',
    'cpx_08',
    'cpx_09',
    'cpx_10',
]);

export function normalizeCpxCaseId(caseId: string | null | undefined): string | null {
    if (!caseId) {
        return null;
    }

    const normalizedCaseId = caseId.trim().toLowerCase();
    const numericOnlyMatch = normalizedCaseId.match(/^(\d{1,2})$/);
    const cpxMatch = normalizedCaseId.match(/cpx[_-]?(\d{1,2})/);
    const caseNumber = cpxMatch?.[1] || numericOnlyMatch?.[1];

    return caseNumber ? `cpx_${caseNumber.padStart(2, '0')}` : normalizedCaseId;
}

export function isCpx07CaseId(caseId: string | null | undefined): boolean {
    return normalizeCpxCaseId(caseId) === 'cpx_07';
}

export function isStructuredCpxCaseId(caseId: string | null | undefined): boolean {
    const normalizedCaseId = normalizeCpxCaseId(caseId);
    return normalizedCaseId ? STRUCTURED_CPX_CASE_IDS.has(normalizedCaseId) : false;
}
