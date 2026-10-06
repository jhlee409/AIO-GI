// Only course material may be served through the Admin SDK download routes.
const VIDEO_PREFIXES = [
    'Lectures/',
    'EGD_Hemostasis_training/lecture/',
    'EGD_Hemostasis_training/cases/',
    'EGD_variation/',
    ...['Sim', 'MT', 'SHT', 'EMT', 'LHT', 'Hemoclip', 'Injection', 'APC',
        'NexPowder', 'EVL', 'PEG', 'Stent'].map(folder => `Simulator_training/${folder}/`),
];

export function isCourseVideoPath(path: string): boolean {
    if (!path || path.includes('\\') || path.split('/').some(part => !part || part === '.' || part === '..')) {
        return false;
    }
    if (!VIDEO_PREFIXES.some(prefix => path.startsWith(prefix))) return false;
    if (path.split('/').some(part => /(?:_result|_visualization)$/i.test(part))) return false;
    return /\.(?:mp4|m4v|mov|avi|webm)$/i.test(path);
}

export const COURSE_DOWNLOAD_PATHS = new Set([
    'Simulator_training/MT/EGD 시행 동작 순서 Bx 포함 2024.docx',
    'Simulator_training/MT/memory test narration 13분.mp3',
]);
