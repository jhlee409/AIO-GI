/**
 * API Route: Build Table
 * Creates Excel table based on selected filters and fills with completion data
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const { hospitals, positions, name, categories } = await request.json();

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

        // Filter by positions
        if (positions && Array.isArray(positions) && positions.length > 0) {
            users = users.filter(user => {
                const position = String(user['직위'] || user['position'] || '').trim();
                return position && positions.includes(position);
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

        // Sort users
        users.sort((a, b) => {
            const hospitalA = String(a['병원'] || a['병원명'] || '').trim();
            const hospitalB = String(b['병원'] || b['병원명'] || '').trim();
            const hospitalCompare = hospitalA.localeCompare(hospitalB, 'ko');
            if (hospitalCompare !== 0) return hospitalCompare;

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
        const lectures: Array<{ category: string; title: string }> = [];

        lectureItems.forEach(item => {
            const category = item['카테고리'] || item['카테고리명'] || item['category'] || item['Category'];
            const title = item['강의제목'] || item['제목'] || item['title'] || item['Title'] || '';

            if (category && typeof category === 'string' && categories.includes(category.trim())) {
                if (title && typeof title === 'string') {
                    lectures.push({
                        category: category.trim(),
                        title: title.trim()
                    });
                }
            }
        });

        if (lectures.length === 0) {
            return NextResponse.json(
                { error: '선택한 카테고리에 해당하는 강의가 없습니다.' },
                { status: 400 }
            );
        }

        // 3. Check if EGD Lesion Dx F1 or F2 is selected
        const isEGDLesionDx = categories.some((cat: string) =>
            cat === 'EGD Lesion Dx F1' || cat === 'EGD Lesion Dx F2'
        );

        // 3-1. Get log file names from Firebase Storage
        const adminStorage = getAdminStorage();
        const bucket = adminStorage.bucket();
        const logPrefix = isEGDLesionDx ? 'log_EGD_Lesion_Dx/' : 'log/';
        const [files] = await bucket.getFiles({ prefix: logPrefix });
        const logFileNames = files
            .map(file => file.name.split('/').pop() || file.name)
            .filter(fileName => fileName && fileName.length > 0);

        // 4. Read template Excel file
        // Use process.cwd() which should point to project root in Next.js API routes
        const templatePath = path.resolve(process.cwd(), 'data', 'lecture-list.xlsx');

        console.log('Looking for template file at:', templatePath);
        console.log('Current working directory:', process.cwd());

        if (!fs.existsSync(templatePath)) {
            // Try alternative path
            const altPath = path.join(process.cwd(), 'data', 'lecture-list.xlsx');
            console.log('Trying alternative path:', altPath);

            if (!fs.existsSync(altPath)) {
                console.error('Template file not found at either path');
                return NextResponse.json(
                    { error: `템플릿 엑셀 파일을 찾을 수 없습니다. 경로: ${templatePath}` },
                    { status: 404 }
                );
            }
        }

        let workbook;
        try {
            const finalPath = fs.existsSync(templatePath) ? templatePath : path.join(process.cwd(), 'data', 'lecture-list.xlsx');
            console.log('Reading Excel file from:', finalPath);

            // Read file as buffer first, then parse (more reliable for OneDrive paths)
            const fileBuffer = fs.readFileSync(finalPath);
            workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        } catch (fileError: any) {
            console.error('Error reading Excel file:', fileError);
            console.error('Error stack:', fileError.stack);
            return NextResponse.json(
                { error: `엑셀 파일을 읽는 중 오류가 발생했습니다: ${fileError.message}` },
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

        // Convert to JSON for easier manipulation
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // 5. Fill user data (row 0: positions, row 1: names)
        // Row 0 is header row, Row 1 is user names row
        // We need to fill positions in row 0 (index 0) starting from column C (index 2)
        // We need to fill names in row 1 (index 1) starting from column C (index 2)

        // Clear existing data from column C onwards in rows 0 and 1
        for (let col = 2; col < data[0]?.length || 0; col++) {
            if (data[0]) data[0][col] = '';
            if (data[1]) data[1][col] = '';
        }

        // Fill positions in row 0 (index 0)
        users.forEach((user, index) => {
            const colIndex = 2 + index; // Start from column C (index 2)
            const position = user['직위'] || user['position'] || '';
            if (data[0]) {
                if (!data[0][colIndex]) data[0][colIndex] = '';
                data[0][colIndex] = position;
            }
        });

        // Fill names in row 1 (index 1)
        users.forEach((user, index) => {
            const colIndex = 2 + index; // Start from column C (index 2)
            const name = user['이름'] || user['성명'] || user['name'] || '';
            if (data[1]) {
                if (!data[1][colIndex]) data[1][colIndex] = '';
                data[1][colIndex] = name;
            }
        });

        // 6. Fill lecture data starting from row 2 (index 2, which is A3 in Excel)
        // Clear existing lecture data (from row 2 to before the last row which has instructions)
        const lastDataRow = data.length - 1; // Last row has instructions
        for (let row = 2; row < lastDataRow; row++) {
            if (data[row]) {
                data[row][0] = ''; // Column A (category)
                data[row][1] = ''; // Column B (title)
                // Clear completion data from column C onwards
                for (let col = 2; col < data[row].length; col++) {
                    data[row][col] = '';
                }
            }
        }

        // Fill lectures
        lectures.forEach((lecture, index) => {
            const rowIndex = 2 + index; // Start from row 2 (A3 in Excel)
            if (!data[rowIndex]) {
                data[rowIndex] = [];
            }
            data[rowIndex][0] = lecture.category; // Column A
            data[rowIndex][1] = lecture.title;    // Column B
        });

        // 7. Fill completion data based on log file names
        // For EGD Lesion Dx F1/F2: count matching files (0 if none)
        // For others: yes/no based on existence
        // For each lecture row (starting from row 2), check each user column (starting from column C, index 2)
        // Compare B column (lecture title) and C/D/E... column header (user name) with log file names

        for (let row = 2; row < data.length - 1; row++) { // Exclude last row (instructions)
            const lectureTitle = String(data[row]?.[1] || '').trim(); // Column B
            if (!lectureTitle) continue; // Skip empty rows

            for (let col = 2; col < data[1]?.length || 0; col++) { // Start from column C
                const userName = String(data[1]?.[col] || '').trim(); // Get user name from row 1
                if (!userName) continue; // Skip empty columns

                if (data[row]) {
                    if (!data[row][col]) data[row][col] = '';

                    if (isEGDLesionDx) {
                        // Count matching files for EGD Lesion Dx F1/F2
                        const matchingFiles = logFileNames.filter(fileName => {
                            const fileNameLower = fileName.toLowerCase();
                            const lectureLower = lectureTitle.toLowerCase();
                            const userLower = userName.toLowerCase();

                            // Check if file name contains both lecture title and user name
                            return fileNameLower.includes(lectureLower) && fileNameLower.includes(userLower);
                        });
                        data[row][col] = matchingFiles.length.toString();
                    } else {
                        // Check if any log file name contains both lecture title and user name
                        const hasCompletion = logFileNames.some(fileName => {
                            const fileNameLower = fileName.toLowerCase();
                            const lectureLower = lectureTitle.toLowerCase();
                            const userLower = userName.toLowerCase();

                            // Check if file name contains both lecture title and user name
                            return fileNameLower.includes(lectureLower) && fileNameLower.includes(userLower);
                        });
                        data[row][col] = hasCompletion ? 'yes' : 'no';
                    }
                }
            }
        }

        // 8. Return table data as JSON (for display in new window)
        // Remove the last row which contains instructions
        const tableData = data.slice(0, -1);

        return NextResponse.json({
            success: true,
            message: '테이블 구성이 완료되었습니다.',
            tableData: tableData
        });
    } catch (error: any) {
        console.error('Error building table:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || '테이블 구성 중 오류가 발생했습니다.'
            },
            { status: 500 }
        );
    }
}

