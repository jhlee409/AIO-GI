export const WATCH_TIME_COMPLETION_THRESHOLD_PERCENT = 80;

export const TRACKED_F1_WATCH_TIME_LECTURE_TITLES = [
    'Complication_Sedation',
    'Description_Impression',
    'Photo_Report',
    'Biopsy_NBI',
    'Stomach_benign',
    'Stomach_malignant',
    'Duodenum',
    'Lx_Phx_Esophagus',
    'SET',
    'Bx_or_no_Bx',
    '내과전공의를 위한 NVUGIB Mx의 기초',
    'Fundamentals_of_NVUGIB_Management',
];

const WATCH_TIME_TITLE_ALIASES = [
    [
        '내과전공의를 위한 NVUGIB Mx의 기초',
        'Fundamentals_of_NVUGIB_Management',
        'Fundamentals_of_NVUGIB_Management.mp4',
    ],
];

function normalizeWatchTimeTitle(title?: string | null): string {
    return String(title || '')
        .toLowerCase()
        .replace(/\.(mp4|avi|mov|wmv|flv|webm)$/i, '')
        .replace(/::/g, ' ')
        .replace(/[_\s]+/g, ' ')
        .trim();
}

export function isTrackedF1WatchTimeLecture(videoTitle?: string | null): boolean {
    const normalizedTitle = normalizeWatchTimeTitle(videoTitle);
    if (!normalizedTitle) return false;

    return TRACKED_F1_WATCH_TIME_LECTURE_TITLES.some(title => {
        const normalizedTrackedTitle = normalizeWatchTimeTitle(title);
        return normalizedTitle === normalizedTrackedTitle ||
            normalizedTitle.includes(normalizedTrackedTitle) ||
            normalizedTrackedTitle.includes(normalizedTitle);
    });
}

export function watchTimeTitlesMatch(a?: string | null, b?: string | null): boolean {
    const normalizedA = normalizeWatchTimeTitle(a);
    const normalizedB = normalizeWatchTimeTitle(b);
    if (!normalizedA || !normalizedB) return false;

    if (normalizedA === normalizedB || normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
        return true;
    }

    return WATCH_TIME_TITLE_ALIASES.some(group => {
        const normalizedGroup = group.map(normalizeWatchTimeTitle);
        const aInGroup = normalizedGroup.some(alias => normalizedA === alias || normalizedA.includes(alias) || alias.includes(normalizedA));
        const bInGroup = normalizedGroup.some(alias => normalizedB === alias || normalizedB.includes(alias) || alias.includes(normalizedB));
        return aInGroup && bInGroup;
    });
}

export function isAdvancedF1WatchTimeCategory(category?: string | null): boolean {
    const normalizedCategory = String(category || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return normalizedCategory === 'advanced-f1' ||
        normalizedCategory.includes('advanced course for f1') ||
        normalizedCategory.includes('dx egd 실전 강의') ||
        normalizedCategory.includes('other lecture') ||
        normalizedCategory.includes('nvugib');
}

export function isTrackedF1WatchTimeVideo(videoTitle?: string | null, category?: string | null): boolean {
    return isAdvancedF1WatchTimeCategory(category) && isTrackedF1WatchTimeLecture(videoTitle);
}

export function formatWatchTimeReportValue(totalPercentage: number): string {
    if (!Number.isFinite(totalPercentage) || totalPercentage <= 0) {
        return '0%';
    }

    if (totalPercentage >= WATCH_TIME_COMPLETION_THRESHOLD_PERCENT) {
        return 'yes';
    }

    return `${Math.round(totalPercentage)}%`;
}
