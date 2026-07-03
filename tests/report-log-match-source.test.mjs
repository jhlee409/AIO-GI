import assert from 'node:assert/strict';
import fs from 'node:fs';

const generateReportSource = fs.readFileSync(
  new URL('../app/api/instructor/generate-report/route.ts', import.meta.url),
  'utf8'
);
const buildTableSource = fs.readFileSync(
  new URL('../app/api/instructor/build-table/route.ts', import.meta.url),
  'utf8'
);

const egdLesionBranch = generateReportSource.slice(
  generateReportSource.indexOf('if (isEGDLesionDxRow)'),
  generateReportSource.indexOf('} else {', generateReportSource.indexOf('if (isEGDLesionDxRow)'))
);
const regularYesNoBranch = generateReportSource.slice(
  generateReportSource.indexOf('const matchingFilesForYes = logFileNames.filter'),
  generateReportSource.indexOf('const hasCompletion = matchingFilesForYes.length > 0')
);

assert.match(
  egdLesionBranch,
  /fileNameLower\.includes\(lectureLower\)/,
  'EGD lesion Dx rows should keep legacy lecture-title substring matching'
);
assert.doesNotMatch(
  regularYesNoBranch,
  /fileNameLower\.includes\(lectureLower\)/,
  'Regular yes/no log rows should still require exact lecture-title matching'
);

const buildTableEgdLesionBranch = buildTableSource.slice(
  buildTableSource.indexOf('if (isEGDLesionDx)'),
  buildTableSource.indexOf('} else {', buildTableSource.indexOf('if (isEGDLesionDx)'))
);
const buildTableRegularBranch = buildTableSource.slice(
  buildTableSource.indexOf('const hasCompletion = logFileNames.some'),
  buildTableSource.indexOf("data[row][col] = hasCompletion ? 'yes' : 'no';")
);

assert.match(
  buildTableEgdLesionBranch,
  /fileNameLower\.includes\(lectureLower\)/,
  'Build-table EGD lesion Dx rows should keep legacy lecture-title substring matching'
);
assert.doesNotMatch(
  buildTableRegularBranch,
  /fileNameLower\.includes\(lectureLower\)/,
  'Build-table regular yes/no rows should still require exact lecture-title matching'
);
