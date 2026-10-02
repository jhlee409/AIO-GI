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
    'PEG',
    'NVUGIB 총론 강의',
    'Stent_Eso_GEjunction',
];

/** These lectures only earn an instructor log after 80% viewing. */
const COMPLETION_LOG_VIDEO_ITEMS: Record<string, string> = {
    PEG: 'PEG',
    'NVUGIB 총론 강의': 'NVUGIB_overview',
    '내과전공의를 위한 NVUGIB Mx의 기초': 'NVUGIB_Mx_basics_for_residents',
    EUS_basic: 'EUS_basic',
    EUS_SET: 'EUS_SET',
    EUS_case: 'EUS_case',
};

export function getWatchTimeCompletionLogItem(videoTitle?: string | null): string | null {
    if (!videoTitle) return null;
    const title = Object.keys(COMPLETION_LOG_VIDEO_ITEMS)
        .find(candidate => watchTimeTitlesMatch(candidate, videoTitle));
    return title ? COMPLETION_LOG_VIDEO_ITEMS[title] : null;
}

export const HEMOSTASIS_CASE_VIDEO_TITLES = [
    'angiodysplasia_01', 'angiodysplasia_02', 'barogenic_tear_01',
    'cancer_bleeding_01', 'cancer_bleeding_02',
    'Dieulafoy_01', 'Dieulafoy_02', 'Dieulafoy_03',
    'diffuse_oozing_01', 'MW_tear_01', 'MW_tear_02',
    'ESD_ulcer_01', 'ESD_ulcer_02',
    'ulcer_base_01', 'ulcer_base_02', 'ulcer_base_03',
];

export function resolveHemostasisCaseTitle(title?: string | null): string | undefined {
    const normalized = normalizeWatchTimeTitle(title);
    return HEMOSTASIS_CASE_VIDEO_TITLES.find(caseTitle =>
        normalized === normalizeWatchTimeTitle(caseTitle) ||
        normalized.includes(normalizeWatchTimeTitle(caseTitle))
    );
}

export function isHemostasisCaseVideo(title?: string | null): boolean {
    return Boolean(resolveHemostasisCaseTitle(title));
}

const WATCH_TIME_TITLE_ALIASES = [
    ['PEG', '7. PEG', 'PEG_orientation'],
    ['NVUGIB 총론 강의', 'NVUGIB_overview', '1. NVUGIB 총론 강의'],
    [
        '내과전공의를 위한 NVUGIB Mx의 기초',
        'Fundamentals_of_NVUGIB_Management',
        'Fundamentals_of_NVUGIB_Management.mp4',
        'NVUGIB_Mx_basics_for_residents',
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
    const lectureTitleLower = String(resolveHemostasisCaseTitle(lectureTitle) || lectureTitle || '').toLowerCase().trim();
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
            if (watchTimeTitlesMatch(keyTitle, lectureTitleLower)) {
                const sameCategory = normalizeWatchTimeCategory(keyCategory) === reportCategoryLower;
                if (!sameCategory && !getWatchTimeCompletionLogItem(lectureTitleLower)) continue;
                score = sameCategory ? 100 : 80;
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

    return `${Math.floor(totalPercentage)}%`;
}
