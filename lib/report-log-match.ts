function normalizeLogMatchValue(value?: string | null): string {
    const normalized = String(value || '')
        .toLowerCase()
        .replace(/\.(txt|log)$/i, '')
        .replace(/\.(mp4|avi|mov|wmv|flv|webm)$/i, '')
        .replace(/[_\s]+/g, ' ')
        .trim();
    if (['nvugib overview', 'nvugib 총론 강의', '1. nvugib 총론 강의'].includes(normalized)) {
        return 'nvugib overview';
    }
    if (normalized === 'nvugib mx basics for residents' || normalized === 'fundamentals of nvugib management') {
        return '내과전공의를 위한 nvugib mx의 기초';
    }
    return normalized;
}

function stripKnownPrefix(fileName: string, userName?: string | null, userPosition?: string | null): string | null {
    const normalizedFileName = fileName.toLowerCase();
    const rawPrefixes = [
        [userPosition, userName],
        [userName],
    ];

    for (const parts of rawPrefixes) {
        const compactParts = parts
            .map(part => String(part || '').trim())
            .filter(Boolean);

        if (compactParts.length === 0) continue;

        for (const separator of ['-', ' ', '_']) {
            const prefix = `${compactParts.join(separator)}${separator}`.toLowerCase();
            if (normalizedFileName.startsWith(prefix)) {
                return fileName.slice(prefix.length);
            }
        }

        const compactPrefix = compactParts.join('').toLowerCase();
        if (normalizedFileName.startsWith(compactPrefix)) {
            return fileName.slice(compactPrefix.length);
        }
    }

    return null;
}

function getLogFieldValues(logContent?: string): string[] {
    if (!logContent) return [];

    const lectureFieldNames = new Set([
        'case',
        'code',
        'item',
        'lecture',
        'lecture title',
        'title',
        'video',
        'video title',
    ]);
    const values: string[] = [];

    for (const line of logContent.split(/\r?\n/)) {
        const match = line.match(/^\s*([^:]+)\s*:\s*(.+?)\s*$/);
        if (!match) continue;

        const fieldName = match[1].trim().toLowerCase();
        if (!lectureFieldNames.has(fieldName)) continue;

        const value = match[2].trim();
        values.push(value);

        const dashIndex = value.indexOf(' - ');
        if (dashIndex > 0) {
            values.push(value.slice(0, dashIndex).trim());
        }
    }

    return values;
}

export function getLogLectureMatchCandidates(
    fileName: string,
    logContent?: string,
    userName?: string | null,
    userPosition?: string | null
): string[] {
    const fileBaseName = (fileName.split(/[\\/]/).pop() || fileName)
        .replace(/\.(txt|log)$/i, '')
        .replace(/(PBL_F2_\d{2}|PEG|NVUGIB_overview|NVUGIB_Mx_basics_for_residents|EUS_basic|EUS_SET|EUS_case)-Completed$/i, '$1');
    const candidates: string[] = [];
    const strippedPrefix = stripKnownPrefix(fileBaseName, userName, userPosition);

    if (strippedPrefix) {
        candidates.push(strippedPrefix);
    }

    const hyphenParts = fileBaseName.split('-');
    if (hyphenParts.length >= 3) {
        candidates.push(hyphenParts.slice(2).join('-'));
    }

    candidates.push(...getLogFieldValues(logContent));

    return Array.from(new Set(candidates.map(candidate => candidate.trim()).filter(Boolean)));
}

/** Earlier PBL files were written on open and cannot prove completion. */
export function isReportableLearningLog(fileName: string): boolean {
    const name = (fileName.split(/[\\/]/).pop() || fileName).replace(/\.(txt|log)$/i, '');
    if (/(?:^|-)PEG(?:$|-)/i.test(name)) {
        return /(?:^|-)PEG-Completed$/i.test(name);
    }
    if (/(?:^|-)(?:NVUGIB_overview|NVUGIB_Mx_basics_for_residents|EUS_basic|EUS_SET|EUS_case)(?:$|-)/i.test(name)) {
        return /(?:^|-)(?:NVUGIB_overview|NVUGIB_Mx_basics_for_residents|EUS_basic|EUS_SET|EUS_case)-Completed$/i.test(name);
    }
    return !/PBL_F2_\d{2}(?:$|-)/i.test(name) ||
        /PBL_F2_\d{2}-Completed$/i.test(name);
}

export function logLectureTitleMatches(
    fileName: string,
    lectureTitle: string,
    logContent?: string,
    userName?: string | null,
    userPosition?: string | null
): boolean {
    const normalizedTitle = normalizeLogMatchValue(lectureTitle);
    const normalizedLectureTitle = normalizedTitle === '7. peg'
        ? 'peg'
        : normalizedTitle;
    if (!normalizedLectureTitle) return false;

    return getLogLectureMatchCandidates(fileName, logContent, userName, userPosition)
        .some(candidate => normalizeLogMatchValue(candidate) === normalizedLectureTitle);
}
