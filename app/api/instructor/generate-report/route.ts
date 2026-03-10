import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { isAdminEmail } from '@/lib/auth-server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (parseError: any) {
            return NextResponse.json(
                {
                    success: false,
                    error: '요청 데이터를 파싱하는 중 오류가 발생했습니다: ' + parseError.message
                },
                { status: 400 }
            );
        }

        const { hospitals, positions, name, categories, userEmail } = requestBody;

        // 서버 측 검증: 교육자는 병원 정보가 있어야 하고, 자신의 병원만 선택 가능
        if (userEmail && !isAdminEmail(userEmail)) {
            const adminDb = getAdminDb();

            let snapshot = await adminDb.collection('users')
                .where('이메일', '==', userEmail)
                .limit(1)
                .get();

            if (snapshot.empty) {
                snapshot = await adminDb.collection('users')
                    .where('email', '==', userEmail)
                    .limit(1)
                    .get();
            }

            if (snapshot.empty) {
                snapshot = await adminDb.collection('patients')
                    .where('이메일', '==', userEmail)
                    .limit(1)
                    .get();
            }

            if (snapshot.empty) {
                snapshot = await adminDb.collection('patients')
                    .where('email', '==', userEmail)
                    .limit(1)
                    .get();
            }

            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                const userHospital = String(userData['병원'] || userData['병원명'] || userData['hospital'] || '').trim();

                // 교육자에게 병원 정보가 없으면 접근 차단
                if (!userHospital) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: '병원 정보가 등록되어 있지 않아 접근할 수 없습니다. 관리자에게 문의하세요.'
                        },
                        { status: 403 }
                    );
                }

                // 교육자가 자신의 병원이 아닌 다른 병원을 선택했는지 확인
                if (hospitals && Array.isArray(hospitals) && hospitals.length > 0) {
                    const hasInvalidHospital = hospitals.some((hospital: string) => hospital !== userHospital);
                    if (hasInvalidHospital) {
                        return NextResponse.json(
                            {
                                success: false,
                                error: '자신이 속한 병원만 선택할 수 있습니다.'
                            },
                            { status: 403 }
                        );
                    }
                }
            }
        }

        // 1. Get filtered users (try users collection first, fallback to patients for backward compatibility)
        const adminDb = getAdminDb();
        let usersSnapshot = await adminDb.collection('users').get();

        // If users collection is empty, try patients collection
        if (usersSnapshot.empty) {
            usersSnapshot = await adminDb.collection('patients').get();
        }

        let users: any[] = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter by hospitals
        if (hospitals && Array.isArray(hospitals) && hospitals.length > 0) {
            users = users.filter(user => {
                const hospital = String(user['병원'] || user['병원명'] || user['hospital'] || '').trim();
                return hospital && hospitals.includes(hospital);
            });
        }

        // Filter by positions (F2 also matches F2D, F2C, FCD)
        if (positions && Array.isArray(positions) && positions.length > 0) {
            const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
            const hasF2 = positions.includes('F2');
            users = users.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                if (!position) return false;
                if (positions.includes(position)) return true;
                if (hasF2 && f2Variants.includes(position.toUpperCase())) return true;
                return false;
            });
        }

        // Filter by name
        if (name && typeof name === 'string' && name.trim()) {
            const nameLower = name.trim().toLowerCase();
            users = users.filter(user => {
                const userName = (user['이름'] || user['성명'] || user['name'] || '').toString().toLowerCase();
                return userName.includes(nameLower);
            });
        }

        // Sort users: hospital → position → name
        users.sort((a, b) => {
            const hospitalA = String(a['병원'] || a['병원명'] || '').trim();
            const hospitalB = String(b['병원'] || b['병원명'] || '').trim();
            const hospitalCompare = hospitalA.localeCompare(hospitalB, 'ko');
            if (hospitalCompare !== 0) return hospitalCompare;

            const positionA = String(a['직위'] || a['position'] || '').trim();
            const positionB = String(b['직위'] || b['position'] || '').trim();
            const positionCompare = positionA.localeCompare(positionB, 'ko');
            if (positionCompare !== 0) return positionCompare;

            const nameA = String(a['이름'] || a['성명'] || '').trim();
            const nameB = String(b['이름'] || b['성명'] || '').trim();
            return nameA.localeCompare(nameB, 'ko');
        });

        if (users.length === 0) {
            return NextResponse.json(
                { error: '선택한 조건에 해당하는 사용자가 없습니다.' },
                { status: 400 }
            );
        }

        // 2. Get lectures by categories
        const lectureSnapshot = await adminDb.collection('lecture_list').get();
        const lectureItems: any[] = lectureSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Find order field name
        const orderFieldName = Object.keys(lectureItems[0] || {}).find(key =>
            key === '순서' || key === '순번' || key.toLowerCase() === 'order' || key.toLowerCase() === 'sequence'
        ) || null;

        // Sort items by order field
        if (orderFieldName && lectureItems.length > 0) {
            lectureItems.sort((a, b) => {
                const valueA = a[orderFieldName];
                const valueB = b[orderFieldName];

                const numA = typeof valueA === 'number' ? valueA : (typeof valueA === 'string' ? parseFloat(valueA) : 0);
                const numB = typeof valueB === 'number' ? valueB : (typeof valueB === 'string' ? parseFloat(valueB) : 0);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }

                const strA = String(valueA || '').trim();
                const strB = String(valueB || '').trim();
                return strA.localeCompare(strB, 'ko');
            });
        }

        // Filter by categories and extract lectures
        const lectures: Array<{ category: string; title: string; isVideo: boolean }> = [];

        // 카테고리 이름을 정규화하여 비교 (대소문자 무시, 공백 정규화)
        const normalizeCategory = (cat: string): string => {
            return cat.toLowerCase().replace(/\s+/g, ' ').trim();
        };


        const normalizedCategories = categories.map((cat: string) => normalizeCategory(cat));

        console.log('[Report Generation] Selected categories:', categories);
        console.log('[Report Generation] Normalized categories:', normalizedCategories);

        lectureItems.forEach(item => {
            const category = item['카테고리'] || item['카테고리명'] || item['category'] || item['Category'];
            const title = item['강의제목'] || item['제목'] || item['title'] || item['Title'] || '';
            // 동영상 여부 확인 (여러 필드명 지원)
            const isVideo = item['동영상'] || item['동영상여부'] || item['video'] || item['isVideo'] || item['타입'] === '동영상' || item['type'] === 'video' || false;

            if (category && typeof category === 'string') {
                const normalizedCategoryName = normalizeCategory(category);

                // 정규화된 카테고리 이름으로 비교
                if (normalizedCategories.includes(normalizedCategoryName)) {
                    if (title && typeof title === 'string') {
                        // 원본 카테고리 이름 사용 (정규화된 것이 아닌)
                        lectures.push({
                            category: category.trim(),
                            title: title.trim(),
                            isVideo: Boolean(isVideo)
                        });
                        console.log(`[Report Generation] Added lecture: Category="${category.trim()}", Title="${title.trim()}", IsVideo=${Boolean(isVideo)}`);
                    }
                }
            }
        });

        // Stent Eso GE junction: Advanced course for F2에 포함되어 있으면 lecture_list에 없어도 추가
        const hasAdvancedF2 = normalizedCategories.some((c: string) =>
            c.includes('advanced course for f2') || c === 'advanced'
        );
        const hasStentEsoGeJunction = lectures.some((l: { title: string }) =>
            l.title.toLowerCase().includes('stent_eso_gejunction')
        );
        if (hasAdvancedF2 && !hasStentEsoGeJunction) {
            lectures.push({
                category: 'Advanced course for F2',
                title: 'Stent_Eso_GEjunction',
                isVideo: true
            });
            console.log('[Report Generation] Added Stent_Eso_GEjunction to Advanced course for F2');
        }

        // EGD variation: keep only the first code per letter group (e.g. A1, B1, C1 — exclude A2, A3, B2, etc.)
        const seenLetters = new Set<string>();
        const filteredLectures = lectures.filter(lecture => {
            const catLower = lecture.category.toLowerCase().replace(/\s+/g, ' ').trim();
            const isEGDVariation = catLower.includes('egd variation');
            const codeMatch = /^([A-Z])(\d+)$/i.exec(lecture.title.trim());
            if (isEGDVariation && codeMatch) {
                const letter = codeMatch[1].toUpperCase();
                if (seenLetters.has(letter)) return false;
                seenLetters.add(letter);
            }
            return true;
        });
        lectures.length = 0;
        lectures.push(...filteredLectures);

        console.log(`[Report Generation] Total lectures found: ${lectures.length}`);
        console.log('[Report Generation] Lectures by category:',
            lectures.reduce((acc, lecture) => {
                const cat = lecture.category;
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        );

        if (lectures.length === 0) {
            return NextResponse.json(
                { error: '선택한 카테고리에 해당하는 강의가 없습니다.' },
                { status: 400 }
            );
        }

        // 3. Get log file names and metadata (timeCreated) from Firebase Storage (both folders)
        let regularLogFileNames: string[] = [];
        let egdLogFileNames: string[] = [];
        const regularLogFileMeta = new Map<string, Date>(); // fileName -> timeCreated (24시간 이내 변경 감지용)
        const egdLogFileMeta = new Map<string, Date>();
        let bucket;

        const HOURS_24_MS = 24 * 60 * 60 * 1000;

        try {
            const adminStorage = getAdminStorage();
            bucket = adminStorage.bucket();

            const fetchFileMeta = async (files: Array<{ name: string; getMetadata: () => Promise<unknown> }>) => {
                const results = await Promise.allSettled(files.map(f => f.getMetadata()));
                const metaMap = new Map<string, Date>();
                const names: string[] = [];
                files.forEach((file, i) => {
                    const fileName = file.name.split('/').pop() || file.name;
                    if (!fileName) return;
                    names.push(fileName);
                    const result = results[i];
                    if (result.status === 'fulfilled') {
                        const res = result.value as [unknown] | unknown;
                        const metadata = Array.isArray(res) ? res[0] : (res as { timeCreated?: string });
                        const timeCreated = (metadata as { timeCreated?: string })?.timeCreated;
                        if (timeCreated) {
                            metaMap.set(fileName, new Date(timeCreated));
                        }
                    }
                });
                return { names, metaMap };
            };

            // Get files from regular log folder
            try {
                const [regularFiles] = await bucket.getFiles({ prefix: 'log/' });
                const { names, metaMap } = await fetchFileMeta(regularFiles as Array<{ name: string; getMetadata: () => Promise<unknown> }>);
                regularLogFileNames = names.filter(n => n && n.length > 0);
                metaMap.forEach((v, k) => regularLogFileMeta.set(k, v));
            } catch (regularError: any) {
                console.error('Error getting regular log files:', regularError);
            }

            // Get files from EGD Lesion Dx log folder
            try {
                const [egdFiles] = await bucket.getFiles({ prefix: 'log_EGD_Lesion_Dx/' });
                const { names, metaMap } = await fetchFileMeta(egdFiles as Array<{ name: string; getMetadata: () => Promise<unknown> }>);
                egdLogFileNames = names.filter(n => n && n.length > 0);
                metaMap.forEach((v, k) => egdLogFileMeta.set(k, v));
            } catch (egdError: any) {
                console.error('Error getting EGD log files:', egdError);
            }
        } catch (storageError: any) {
            console.error('Error accessing Firebase Storage:', storageError);
        }

        // 4. Read template Excel file
        // Try local file first, then Firebase Storage
        const templatePath = path.resolve(process.cwd(), 'data', 'lecture-list.xlsx');
        let fileBuffer: Buffer;

        if (fs.existsSync(templatePath)) {
            // Use local file if available
            try {
                fileBuffer = fs.readFileSync(templatePath);
            } catch (fileError: any) {
                return NextResponse.json(
                    { error: `로컬 템플릿 파일을 읽는 중 오류가 발생했습니다: ${fileError.message}` },
                    { status: 500 }
                );
            }
        } else {
            // Try to download from Firebase Storage
            try {
                // Initialize bucket if not already initialized
                if (!bucket) {
                    const adminStorage = getAdminStorage();
                    bucket = adminStorage.bucket();
                }

                const templateFile = bucket.file('templates/lecture-list.xlsx');
                const [exists] = await templateFile.exists();

                if (!exists) {
                    return NextResponse.json(
                        {
                            error: `템플릿 엑셀 파일을 찾을 수 없습니다. 로컬 파일과 Firebase Storage 모두에서 찾을 수 없습니다.`,
                            details: 'Firebase Storage의 templates/lecture-list.xlsx 경로에 템플릿 파일을 업로드해주세요.'
                        },
                        { status: 404 }
                    );
                }

                // Download file from Storage
                const [buffer] = await templateFile.download();
                fileBuffer = buffer;
            } catch (storageError: any) {
                console.error('Error downloading template from Storage:', storageError);
                return NextResponse.json(
                    {
                        error: `Firebase Storage에서 템플릿 파일을 다운로드하는 중 오류가 발생했습니다: ${storageError.message}`,
                        details: '로컬 파일(data/lecture-list.xlsx) 또는 Firebase Storage(templates/lecture-list.xlsx)에 템플릿 파일이 필요합니다.'
                    },
                    { status: 500 }
                );
            }
        }

        let workbook;
        try {
            workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        } catch (xlsxError: any) {
            return NextResponse.json(
                { error: `엑셀 파일을 파싱하는 중 오류가 발생했습니다: ${xlsxError.message}` },
                { status: 500 }
            );
        }

        const worksheet = workbook.Sheets['report format'];
        if (!worksheet) {
            return NextResponse.json(
                { error: 'report format 시트를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Convert to JSON
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // 5. Fill user data (row 0: positions, row 1: names)
        // Clear existing data from column C onwards in rows 0 and 1
        for (let col = 2; col < (data[0]?.length || 0); col++) {
            if (data[0]) data[0][col] = '';
            if (data[1]) data[1][col] = '';
        }

        // Fill positions in row 0 (index 0)
        users.forEach((user, index) => {
            const colIndex = 2 + index; // Start from column C
            const position = user['직위'] || user['position'] || '';
            if (!data[0]) data[0] = [];
            data[0][colIndex] = position;
        });

        // Fill names in row 1 (index 1)
        users.forEach((user, index) => {
            const colIndex = 2 + index; // Start from column C
            const name = user['이름'] || user['성명'] || user['name'] || '';
            if (!data[1]) data[1] = [];
            data[1][colIndex] = name;
        });

        // 3월 근무가 'no'인 F1/F2 사용자의 이름 셀 컬럼 인덱스 수집 (연한 복숭아색 배경용)
        // F2는 F2, F2D, F2C, FCD와 동일하게 취급
        const f2Variants = ['F2', 'F2D', 'F2C', 'FCD'];
        const peachBackgroundNameCols: number[] = [];
        users.forEach((user, index) => {
            const position = String(user['직위'] || user['position'] || '').trim().toUpperCase();
            const marchWork = String(user['3월 근무'] ?? user['3월근무'] ?? '').trim().toLowerCase();
            const isF1OrF2 = position === 'F1' || f2Variants.includes(position);
            if (isF1OrF2 && marchWork === 'no') {
                peachBackgroundNameCols.push(2 + index);
            }
        });

        // 6. Fill lecture data starting from row 2 (index 2)
        // We will reconstruct the rows from index 2 onwards based on selected lectures
        // First, keep the header rows (0 and 1)
        const newData = [data[0], data[1]];

        // Add lecture rows
        lectures.forEach((lecture) => {
            const newRow: any[] = [];
            newRow[0] = lecture.category;
            newRow[1] = lecture.title;
            // Initialize user columns with empty strings
            for (let i = 0; i < users.length; i++) {
                newRow[i + 2] = '';
            }
            newData.push(newRow);
        });

        // 6.5. Pre-fetch all watch time data for 'Dx EGD 실전 강의' category
        // Hook을 사용하여 누적 시청 시간 계산
        const { calculateAccumulatedWatchTime } = await import('@/lib/hooks/useCalculateAccumulatedWatchTime');

        // Collect all user emails
        const userEmails = users
            .map(user => {
                const email = user['이메일'] || user['email'] || user['Email'] || '';
                return { email, userName: user['이름'] || user['성명'] || user['name'] || '' };
            })
            .filter(u => u.email);

        // Hook을 사용하여 누적 시청 시간 계산
        console.log(`[generate-report] Fetching watch time data for ${userEmails.length} users`);
        const watchTimeMap = await calculateAccumulatedWatchTime(userEmails, adminDb);
        console.log(`[generate-report] Watch time map size: ${watchTimeMap.size}`);
        watchTimeMap.forEach((userWatchTimes, email) => {
            console.log(`[generate-report] User ${email} has ${userWatchTimes.size} watch time entries:`, Array.from(userWatchTimes.keys()));
        });

        // 7. Fill completion data
        const recentlyChangedCells: [number, number][] = [];
        const now = Date.now();

        const isWithin24Hours = (d: Date | undefined) =>
            d && (now - d.getTime()) < HOURS_24_MS;

        for (let row = 2; row < newData.length; row++) {
            const category = String(newData[row][0] || '').trim(); // A column (category)
            const lectureTitle = String(newData[row][1] || '').trim(); // B column (title)
            if (!lectureTitle) continue;

            // Check if this row is EGD Lesion Dx category (case-insensitive, space-insensitive)
            const categoryNormalized = category.toLowerCase().replace(/\s+/g, ' ').trim();
            const categoryLower = category.toLowerCase().trim();
            const isEGDLesionDxRow =
                categoryNormalized === 'egd lesion dx f1' ||
                categoryNormalized === 'egd lesion dx f2' ||
                categoryNormalized.startsWith('egd lesion dx f1') ||
                categoryNormalized.startsWith('egd lesion dx f2');

            // Check if this row is CPX category
            const isCPXRow = categoryLower.includes('cpx') ||
                categoryLower.includes('환자 병력청취') ||
                categoryNormalized.includes('cpx') ||
                categoryNormalized.includes('환자 병력청취');

            // Check if this row is EGD variation category
            const isEGDVariationRow = categoryLower.includes('egd variation') ||
                categoryNormalized.includes('egd variation');

            // Check if this row is 'Dx EGD 실전 강의' category
            // 'Dx EGD 실전 강의'는 "Advanced course for F1" 카테고리의 "진단 내시경" 섹션에 속한 강의들
            const dxEgdLectureTitles = [
                'complication_sedation', 'description_impression', 'photo_report',
                'biopsy_nbi', 'stomach_benign', 'stomach_malignant', 'duodenum',
                'lx_phx_esophagus', 'set'
            ];
            const lectureTitleLower = lectureTitle.toLowerCase().trim();

            // 카테고리 매칭: 'advanced-f1', 'Advanced course for F1', 'Dx EGD 실전 강의' 모두 허용
            const isAdvancedF1Category = categoryLower.includes('advanced course for f1') ||
                categoryNormalized.includes('advanced course for f1') ||
                categoryLower === 'advanced-f1' ||
                categoryNormalized.includes('advanced-f1') ||
                categoryLower.includes('dx egd 실전 강의') ||
                categoryNormalized.includes('dx egd 실전 강의') ||
                category.includes('Dx EGD 실전 강의');

            // 강의 제목 매칭: 정확히 일치하거나 포함 관계 확인
            const isDxEgdLectureTitle = dxEgdLectureTitles.some(title => {
                return lectureTitleLower === title || lectureTitleLower.includes(title) || title.includes(lectureTitleLower);
            });

            const isDxEgdLectureRow = isAdvancedF1Category && isDxEgdLectureTitle;

            // Debug log for Dx EGD 실전 강의 - 모든 Dx EGD 강의에 대해 로그 출력
            if (dxEgdLectureTitles.some(title => lectureTitleLower.includes(title))) {
                console.log(`[Dx EGD 실전 강의 체크] Category: "${category}", CategoryLower: "${categoryLower}", CategoryNormalized: "${categoryNormalized}"`);
                console.log(`[Dx EGD 실전 강의 체크] Lecture: "${lectureTitle}", LectureLower: "${lectureTitleLower}"`);
                console.log(`[Dx EGD 실전 강의 체크] isAdvancedF1Category: ${isAdvancedF1Category}, isDxEgdLectureTitle: ${isDxEgdLectureTitle}, isDxEgdLectureRow: ${isDxEgdLectureRow}`);
                console.log(`[Dx EGD 실전 강의 체크] Category checks:`, {
                    'categoryLower.includes("advanced course for f1")': categoryLower.includes('advanced course for f1'),
                    'categoryNormalized.includes("advanced course for f1")': categoryNormalized.includes('advanced course for f1'),
                    'categoryLower === "advanced-f1"': categoryLower === 'advanced-f1',
                    'categoryNormalized.includes("advanced-f1")': categoryNormalized.includes('advanced-f1')
                });
                console.log(`[Dx EGD 실전 강의 체크] dxEgdLectureTitles:`, dxEgdLectureTitles);
                console.log(`[Dx EGD 실전 강의 체크] Matching check:`, dxEgdLectureTitles.map(title => ({
                    title,
                    'lectureTitleLower === title': lectureTitleLower === title,
                    'lectureTitleLower.includes(title)': lectureTitleLower.includes(title),
                    'title.includes(lectureTitleLower)': title.includes(lectureTitleLower)
                })));
            }

            // 강제로 Dx EGD 강의로 인식하도록 임시 수정 (디버깅용)
            // Complication_Sedation 등이 포함된 경우 무조건 Dx EGD 강의로 처리
            const forceDxEgdRow = dxEgdLectureTitles.some(title => {
                const titleLower = title.toLowerCase();
                return lectureTitleLower.includes(titleLower) || titleLower.includes(lectureTitleLower);
            }) && (categoryLower.includes('advanced') || categoryLower.includes('f1'));

            if (forceDxEgdRow && !isDxEgdLectureRow) {
                console.log(`[Dx EGD 실전 강의] ⚠️ Force enabling Dx EGD row detection!`);
                console.log(`[Dx EGD 실전 강의] Original isDxEgdLectureRow: ${isDxEgdLectureRow}, Forced: true`);
            }

            const finalIsDxEgdLectureRow = isDxEgdLectureRow || forceDxEgdRow;

            if (finalIsDxEgdLectureRow) {
                console.log(`[Dx EGD 실전 강의] ✓ Row detected! Category: "${category}", Lecture: "${lectureTitle}"`);
            } else if (dxEgdLectureTitles.some(title => lectureTitleLower.includes(title))) {
                console.log(`[Dx EGD 실전 강의] ✗ Row NOT detected! Category: "${category}", Lecture: "${lectureTitle}"`);
                console.log(`[Dx EGD 실전 강의] ✗ Reason: isAdvancedF1Category=${isAdvancedF1Category}, isDxEgdLectureTitle=${isDxEgdLectureTitle}`);
            }

            // Debug log (can be removed later)
            if (categoryNormalized.includes('egd lesion dx')) {
                console.log(`Category: "${category}" -> Normalized: "${categoryNormalized}" -> isEGDLesionDxRow: ${isEGDLesionDxRow}`);
            }

            // Select appropriate log file list and meta based on category
            const logFileNames = isEGDLesionDxRow ? egdLogFileNames : regularLogFileNames;
            const logFileMeta = isEGDLesionDxRow ? egdLogFileMeta : regularLogFileMeta;

            for (let col = 2; col < newData[1].length; col++) {
                // Only process if we have a user in this column
                if (col - 2 >= users.length) break;

                const userName = String(newData[1][col] || '').trim();
                if (!userName) continue;

                // Get user position from users array (for CPX matching)
                const userIndex = col - 2;
                const user = users[userIndex];
                const userPosition = user ? String(user['직위'] || user['position'] || '').trim() : '';

                // 강의제목이 코드 형식인지 확인 (예: A1, B1, B2, C1, C2, D2, F2 등)
                const isCodeFormat = /^[A-Z]\d+$/i.test(lectureTitle.trim());

                // 로그 파일 이름에서 코드 추출 함수 (마지막 부분만 사용)
                // 구분자가 있는 경우: "F1-홍길동-B1" -> "b1"
                // 구분자가 없는 경우: "F1남효진B1" -> "b1"
                const extractCodeFromLogFileName = (fileName: string): string | null => {
                    // 먼저 하이픈으로 분리 시도
                    const parts = fileName.split('-');
                    if (parts.length >= 3) {
                        // 마지막 부분이 코드 형식인지 확인
                        const lastPart = parts[parts.length - 1].trim();
                        if (/^[A-Z]\d+$/i.test(lastPart)) {
                            return lastPart.toLowerCase();
                        }
                    }

                    // 구분자가 없는 경우: 파일명 끝에서 코드 형식 찾기
                    // 예: "F1남효진B1" -> "B1" 추출
                    const codeMatch = fileName.match(/([A-Z]\d+)$/i);
                    if (codeMatch) {
                        return codeMatch[1].toLowerCase();
                    }

                    return null;
                };

                // CPX 로그 파일명에서 CPX 케이스 번호 추출 (예: "F1-홍길동-CPX_01" -> "cpx_01")
                const extractCPXCaseFromLogFileName = (fileName: string): string | null => {
                    // CPX_XX 형식 찾기
                    const cpxMatch = fileName.match(/cpx[_-](\d+)/i);
                    if (cpxMatch) {
                        return `cpx_${cpxMatch[1]}`.toLowerCase();
                    }
                    return null;
                };

                // 강의제목에서 CPX 케이스 번호 추출 (예: "CPX_01_dysphagia" -> "cpx_01")
                const extractCPXCaseFromLectureTitle = (title: string): string | null => {
                    const cpxMatch = title.match(/cpx[_-](\d+)/i);
                    if (cpxMatch) {
                        return `cpx_${cpxMatch[1]}`.toLowerCase();
                    }
                    return null;
                };

                if (isEGDLesionDxRow) {
                    // For EGD Lesion Dx: count matching files and return number (0 if none)
                    const matchingFiles = logFileNames.filter(fileName => {
                        const fileNameLower = fileName.toLowerCase();
                        const lectureLower = lectureTitle.toLowerCase();
                        const userLower = userName.toLowerCase();

                        // 코드 형식인 경우: 마지막 부분만 매칭
                        if (isCodeFormat) {
                            const codeFromFile = extractCodeFromLogFileName(fileName);
                            if (codeFromFile && codeFromFile === lectureLower) {
                                // 사용자 이름도 확인
                                return fileNameLower.includes(userLower);
                            }
                            return false;
                        }

                        // 코드 형식이 아닌 경우: 기존 로직 사용
                        return fileNameLower.includes(lectureLower) && fileNameLower.includes(userLower);
                    });
                    const cellVal = matchingFiles.length > 0 ? matchingFiles.length.toString() : '0';
                    newData[row][col] = cellVal;
                    if (parseInt(cellVal, 10) > 0) {
                        const anyRecent = matchingFiles.some(fn => isWithin24Hours(logFileMeta.get(fn)));
                        if (anyRecent) recentlyChangedCells.push([row, col]);
                    }
                } else {
                    // For other categories: use yes/no, or percentage if no completion
                    const matchingFilesForYes = logFileNames.filter(fileName => {
                        const fileNameLower = fileName.toLowerCase();
                        const lectureLower = lectureTitle.toLowerCase();
                        const userLower = userName.toLowerCase();

                        // CPX 카테고리인 경우: CPX 케이스 번호로 매칭
                        if (isCPXRow) {
                            const cpxCaseFromFile = extractCPXCaseFromLogFileName(fileName);
                            const cpxCaseFromLecture = extractCPXCaseFromLectureTitle(lectureTitle);

                            // CPX 케이스 번호가 일치하는지 확인
                            if (cpxCaseFromFile && cpxCaseFromLecture && cpxCaseFromFile === cpxCaseFromLecture) {
                                // 파일명 형식: "F1서시온CPX_01" (구분자 없음) 또는 "F1-서시온-CPX_01" (하이픈) 또는 "F1 서시온 CPX_01" (공백)
                                // CPX 케이스 번호를 제거한 후, 직위와 이름이 모두 포함되어 있는지 확인

                                // 파일명에서 CPX 케이스 번호 부분 제거 (예: "CPX_01" 또는 "cpx_01")
                                const fileNameWithoutCPX = fileNameLower.replace(/cpx[_-]\d+/i, '').trim();

                                // 사용자 이름과 직위가 파일명에 포함되어 있는지 확인
                                const userPositionLower = userPosition.toLowerCase();
                                const userInFileName = fileNameLower.includes(userLower);
                                const positionInFileName = userPositionLower && fileNameLower.includes(userPositionLower);

                                // CPX 케이스 번호를 제거한 부분에서도 확인 (더 정확한 매칭)
                                const userInFileNameWithoutCPX = fileNameWithoutCPX.includes(userLower);
                                const positionInFileNameWithoutCPX = userPositionLower && fileNameWithoutCPX.includes(userPositionLower);

                                // 매칭 조건:
                                // 1. CPX 케이스 번호가 일치하고
                                // 2. 사용자 이름이 파일명에 포함되어 있고
                                // 3. (직위가 있으면) 직위도 파일명에 포함되어 있어야 함
                                const isMatch = userInFileName && (userPositionLower ? positionInFileName : true);

                                // 디버깅 로그
                                if (cpxCaseFromFile === cpxCaseFromLecture) {
                                    console.log(`[CPX Match] File: "${fileName}", User: "${userName}", Position: "${userPosition}", Lecture: "${lectureTitle}"`);
                                    console.log(`[CPX Match] CPX Case: ${cpxCaseFromFile} === ${cpxCaseFromLecture}`);
                                    console.log(`[CPX Match] User in file: ${userInFileName}, Position in file: ${positionInFileName}`);
                                    console.log(`[CPX Match] Result: ${isMatch}`);
                                }

                                return isMatch;
                            }
                            return false;
                        }

                        // EGD variation 카테고리인 경우: 코드 형식으로 매칭 (구분자 없음 지원)
                        if (isEGDVariationRow && isCodeFormat) {
                            const codeFromFile = extractCodeFromLogFileName(fileName);
                            if (codeFromFile && codeFromFile === lectureLower) {
                                // 사용자 이름과 직위 확인
                                const userPositionLower = userPosition.toLowerCase();
                                const userInFileName = fileNameLower.includes(userLower);
                                const positionInFileName = userPositionLower && fileNameLower.includes(userPositionLower);

                                // 매칭 조건: 코드가 일치하고, 사용자 이름이 포함되어 있으며, 직위도 포함되어 있어야 함
                                return userInFileName && (userPositionLower ? positionInFileName : true);
                            }
                            return false;
                        }

                        // 코드 형식인 경우: 마지막 부분만 매칭
                        if (isCodeFormat) {
                            const codeFromFile = extractCodeFromLogFileName(fileName);
                            if (codeFromFile && codeFromFile === lectureLower) {
                                // 사용자 이름도 확인
                                return fileNameLower.includes(userLower);
                            }
                            return false;
                        }

                        // 코드 형식이 아닌 경우: 기존 로직 사용
                        return fileNameLower.includes(lectureLower) && fileNameLower.includes(userLower);
                    });
                    const hasCompletion = matchingFilesForYes.length > 0;

                    // 'Dx EGD 실전 강의' 카테고리인 경우: 시청 시간 데이터 확인 후 누적 % 표시
                    // 강제 인식된 경우도 포함
                    const finalIsDxEgdLectureRow = isDxEgdLectureRow || (dxEgdLectureTitles.some(title => {
                        const titleLower = title.toLowerCase();
                        return lectureTitleLower.includes(titleLower) || titleLower.includes(lectureTitleLower);
                    }) && (categoryLower.includes('advanced') || categoryLower.includes('f1')));

                    if (finalIsDxEgdLectureRow) {
                        const user = users[col - 2];
                        const userEmail = user['이메일'] || user['email'] || user['Email'] || '';

                        console.log(`[Dx EGD 실전 강의 매칭] Checking for user: ${userEmail}`);
                        console.log(`[Dx EGD 실전 강의 매칭] watchTimeMap.has(${userEmail}): ${watchTimeMap.has(userEmail)}`);
                        console.log(`[Dx EGD 실전 강의 매칭] All emails in watchTimeMap:`, Array.from(watchTimeMap.keys()));

                        // 먼저 시청 시간 데이터 확인
                        if (userEmail && watchTimeMap.has(userEmail)) {
                            const userWatchTimes = watchTimeMap.get(userEmail)!;

                            // videoTitle과 lectureTitle 매칭
                            let matchedWatchTime: { totalPercentage: number; duration: number; category?: string; videoUrl?: string } | null = null;
                            let matchedKey: string | null = null;
                            let matchScore = 0;

                            const lectureTitleLower = lectureTitle.toLowerCase().trim();

                            // 카테고리 정규화: 'advanced-f1'과 'Advanced course for F1' 모두 매칭
                            const normalizedCategoryForMatching = (cat: string) => {
                                const catLower = cat.toLowerCase().trim();
                                if (catLower === 'advanced-f1' || catLower.includes('advanced course for f1')) {
                                    return 'advanced course for f1';
                                }
                                return catLower;
                            };

                            console.log(`[Dx EGD 실전 강의 매칭] User: ${userName}, Email: ${userEmail}, Lecture: "${lectureTitle}", Category: "${category}"`);
                            console.log(`[Dx EGD 실전 강의 매칭] Available watch time keys:`, Array.from(userWatchTimes.keys()));

                            for (const [key, watchTime] of userWatchTimes.entries()) {
                                const keyLower = key.toLowerCase().trim();
                                const watchTimeCategory = watchTime.category || '';
                                const watchTimeCategoryLower = normalizedCategoryForMatching(watchTimeCategory);
                                const reportCategoryLower = normalizedCategoryForMatching(category);

                                let score = 0;
                                let isMatch = false;

                                // category::videoTitle 형식으로 정확히 일치
                                if (key.includes('::')) {
                                    const [keyCategory, keyTitle] = key.split('::');
                                    const normalizedKeyCategory = normalizedCategoryForMatching(keyCategory);
                                    if (normalizedKeyCategory === reportCategoryLower &&
                                        keyTitle.toLowerCase().trim() === lectureTitleLower) {
                                        score = 100;
                                        isMatch = true;
                                        console.log(`[Dx EGD 실전 강의 매칭] Matched with category::title format: ${key}, Score: ${score}`);
                                    }
                                }
                                // videoTitle만 정확히 일치
                                else if (keyLower === lectureTitleLower) {
                                    // category도 일치하면 더 높은 점수
                                    if (watchTimeCategoryLower === reportCategoryLower) {
                                        score = 90;
                                    } else {
                                        score = 70;
                                    }
                                    isMatch = true;
                                    console.log(`[Dx EGD 실전 강의 매칭] Matched with title only: ${key}, Score: ${score}`);
                                }
                                // category가 일치하고 videoTitle이 부분 일치
                                else if (watchTimeCategoryLower === reportCategoryLower) {
                                    if (keyLower.includes(lectureTitleLower) || lectureTitleLower.includes(keyLower)) {
                                        score = 60;
                                        isMatch = true;
                                        console.log(`[Dx EGD 실전 강의 매칭] Matched with category + partial title: ${key}, Score: ${score}`);
                                    }
                                }
                                // videoTitle만 부분 일치
                                else if (keyLower.includes(lectureTitleLower) || lectureTitleLower.includes(keyLower)) {
                                    score = 30;
                                    isMatch = true;
                                    console.log(`[Dx EGD 실전 강의 매칭] Matched with partial title: ${key}, Score: ${score}`);
                                }

                                if (isMatch && score > matchScore) {
                                    matchedWatchTime = watchTime;
                                    matchedKey = key;
                                    matchScore = score;
                                }
                            }

                            if (matchedWatchTime && matchedWatchTime.duration > 0) {
                                // 누적 시청 시간 데이터가 있으면 % 표시 (로그 파일 유무와 관계없이)
                                const totalPercentage = (matchedWatchTime as any).totalPercentage || 0;
                                console.log(`[Dx EGD 실전 강의 매칭] Final match: Key="${matchedKey}", Percentage=${totalPercentage}%`);
                                newData[row][col] = `${Math.round(totalPercentage)}%`;
                                if (isWithin24Hours((matchedWatchTime as any).lastUpdated)) {
                                    recentlyChangedCells.push([row, col]);
                                }
                            } else {
                                // 시청 시간 데이터가 없으면 로그 파일 확인
                                if (hasCompletion) {
                                    // 로그 파일이 있으면 "yes" 표시
                                    console.log(`[Dx EGD 실전 강의 매칭] No watch time data but log file exists, showing "yes"`);
                                    newData[row][col] = 'yes';
                                    if (matchingFilesForYes.some(fn => isWithin24Hours(logFileMeta.get(fn)))) {
                                        recentlyChangedCells.push([row, col]);
                                    }
                                } else {
                                    // 로그 파일도 없으면 "no" 표시
                                    console.log(`[Dx EGD 실전 강의 매칭] No watch time data and no log file, showing "no"`);
                                    newData[row][col] = 'no';
                                }
                            }
                        } else {
                            // 시청 시간 데이터가 없으면 로그 파일 확인
                            console.log(`[Dx EGD 실전 강의 매칭] No watch time data found for user: ${userEmail}`);
                            console.log(`[Dx EGD 실전 강의 매칭] watchTimeMap.has(${userEmail}): ${watchTimeMap.has(userEmail)}`);
                            if (!watchTimeMap.has(userEmail)) {
                                console.log(`[Dx EGD 실전 강의 매칭] Available emails in watchTimeMap:`, Array.from(watchTimeMap.keys()));
                            }
                            if (hasCompletion) {
                                // 로그 파일이 있으면 "yes" 표시
                                console.log(`[Dx EGD 실전 강의 매칭] No watch time data for user: ${userEmail}, but log file exists, showing "yes"`);
                                newData[row][col] = 'yes';
                                if (matchingFilesForYes.some(fn => isWithin24Hours(logFileMeta.get(fn)))) {
                                    recentlyChangedCells.push([row, col]);
                                }
                            } else {
                                // 로그 파일도 없으면 "no" 표시
                                console.log(`[Dx EGD 실전 강의 매칭] No watch time data and no log file for user: ${userEmail}, showing "no"`);
                                newData[row][col] = 'no';
                            }
                        }
                    } else {
                        // 다른 카테고리: 로그 파일이 있으면 "yes", 없으면 "no"
                        if (hasCompletion) {
                            newData[row][col] = 'yes';
                            if (matchingFilesForYes.some(fn => isWithin24Hours(logFileMeta.get(fn)))) {
                                recentlyChangedCells.push([row, col]);
                            }
                        } else {
                            newData[row][col] = 'no';
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: '레포트 작성이 완료되었습니다.',
            tableData: newData,
            recentlyChangedCells,
            peachBackgroundNameCols
        });

    } catch (error: any) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || '레포트 작성 중 오류가 발생했습니다.'
            },
            { status: 500 }
        );
    }
}
