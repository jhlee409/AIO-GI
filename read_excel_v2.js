const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(process.cwd(), 'data', 'lecture-list.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = 'report format';
if (workbook.SheetNames.includes(sheetName)) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(JSON.stringify(data));
} else {
    console.log(`Sheet '${sheetName}' not found. Available sheets:`, workbook.SheetNames);
}
