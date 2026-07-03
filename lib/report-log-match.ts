function normalizeLogMatchValue(value?: string | null): string {
    return String(value || '')
        .toLowerCase()
        .replace(/\.(txt|log)$/i, '')
        .replace(/\.(mp4|avi|mov|wmv|flv|webm)$/i, '')
        .replace(/[_\s]+/g, ' ')
        .trim();
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
    const fileBaseName = fileName.split(/[\\/]/).pop() || fileName;
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

export function logLectureTitleMatches(
    fileName: string,
    lectureTitle: string,
    logContent?: string,
    userName?: string | null,
    userPosition?: string | null
): boolean {
    const normalizedLectureTitle = normalizeLogMatchValue(lectureTitle);
    if (!normalizedLectureTitle) return false;

    return getLogLectureMatchCandidates(fileName, logContent, userName, userPosition)
        .some(candidate => normalizeLogMatchValue(candidate) === normalizedLectureTitle);
}
