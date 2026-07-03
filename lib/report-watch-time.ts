export const WATCH_TIME_COMPLETION_THRESHOLD_PERCENT = 80;

export type VideoCompletionMode = 'percentage' | 'onPlay' | 'none';

export interface VideoWatchRoutineTrackingOptions {
    completionMode?: VideoCompletionMode;
}

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
    'Hemoclip',
    'Injection',
    'APC',
    'NexPowder',
    'EVL',
    'Stent_Eso_GEjunction',
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

    return TRACKED_F1_WATCH_TIME_LECTURE_TITLES.some(title => watchTimeTitlesMatch(normalizedTitle, title));
}

export function watchTimeTitlesMatch(a?: string | null, b?: string | null): boolean {
    const normalizedA = normalizeWatchTimeTitle(a);
    const normalizedB = normalizeWatchTimeTitle(b);
    if (!normalizedA || !normalizedB) return false;

    if (normalizedA === normalizedB) {
        return true;
    }

    return WATCH_TIME_TITLE_ALIASES.some(group => {
        const normalizedGroup = group.map(normalizeWatchTimeTitle);
        const aInGroup = normalizedGroup.includes(normalizedA);
        const bInGroup = normalizedGroup.includes(normalizedB);
        return aInGroup && bInGroup;
    });
}

export function isAdvancedF1WatchTimeCategory(category?: string | null): boolean {
    const normalizedCategory = String(category || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return normalizedCategory === 'advanced-f1' ||
        normalizedCategory.includes('advanced course for f1') ||
        normalizedCategory.includes('dx egd 실전 강의') ||
        normalizedCategory.includes('emergency egd') ||
        normalizedCategory.includes('other lecture') ||
        normalizedCategory.includes('nvugib') ||
        normalizedCategory.includes('simulator advanced course');
}

export function isTrackedF1WatchTimeVideo(videoTitle?: string | null, category?: string | null): boolean {
    return isAdvancedF1WatchTimeCategory(category) && isTrackedF1WatchTimeLecture(videoTitle);
}

export function shouldTrackVideoWatchRoutine(
    videoTitle?: string | null,
    category?: string | null,
    options: VideoWatchRoutineTrackingOptions = {}
): boolean {
    if (options.completionMode === 'percentage') {
        return true;
    }

    if (options.completionMode === 'onPlay' || options.completionMode === 'none') {
        return false;
    }

    return isTrackedF1WatchTimeVideo(videoTitle, category);
}

export interface WatchTimeReportEntry {
    totalPercentage: number;
    duration: number;
    category?: string;
    videoUrl?: string;
    lastUpdated?: Date;
}

export interface WatchTimeReportMatch<T extends WatchTimeReportEntry = WatchTimeReportEntry> {
    key: string;
    watchTime: T;
    score: number;
}

export function normalizeWatchTimeCategory(category?: string | null): string {
    const categoryLower = String(category || '').toLowerCase().trim();
    if (categoryLower === 'advanced-f1' || categoryLower.includes('advanced course for f1')) {
        return 'advanced course for f1';
    }
    if (categoryLower === 'advanced-f2' || categoryLower.includes('advanced course for f2')) {
        return 'advanced course for f2';
    }
    return categoryLower;
}

export function findWatchTimeReportMatch<T extends WatchTimeReportEntry>(
    userWatchTimes: Map<string, T>,
    lectureTitle?: string | null,
    category?: string | null
): WatchTimeReportMatch<T> | null {
    const lectureTitleLower = String(lectureTitle || '').toLowerCase().trim();
    if (!lectureTitleLower) {
        return null;
    }

    const reportCategoryLower = normalizeWatchTimeCategory(category);
    let matchedWatchTime: T | null = null;
    let matchedKey: string | null = null;
    let matchScore = 0;

    for (const [key, watchTime] of userWatchTimes.entries()) {
        const keyLower = key.toLowerCase().trim();
        const watchTimeCategoryLower = normalizeWatchTimeCategory(watchTime.category);

        let score = 0;
        let isMatch = false;

        if (key.includes('::')) {
            const [keyCategory, ...keyTitleParts] = key.split('::');
            const keyTitle = keyTitleParts.join('::');
            if (
                normalizeWatchTimeCategory(keyCategory) === reportCategoryLower &&
                watchTimeTitlesMatch(keyTitle, lectureTitleLower)
            ) {
                score = 100;
                isMatch = true;
            }
        } else if (watchTimeTitlesMatch(keyLower, lectureTitleLower)) {
            score = watchTimeCategoryLower === reportCategoryLower ? 90 : 70;
            isMatch = true;
        }

        if (isMatch && score > matchScore) {
            matchedWatchTime = watchTime;
            matchedKey = key;
            matchScore = score;
        }
    }

    if (!matchedWatchTime || !matchedKey) {
        return null;
    }

    return {
        key: matchedKey,
        watchTime: matchedWatchTime,
        score: matchScore,
    };
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
