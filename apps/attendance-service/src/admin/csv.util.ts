export interface CsvRow {
  employeeName: string;
  email: string;
  date: string;
  clockIn: string;
  clockOut: string;
}

const HEADERS = ['Employee Name', 'Email', 'Date', 'Clock In', 'Clock Out'];

function escape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(rows: CsvRow[]): string {
  const header = HEADERS.join(',');
  const body = rows
    .map((row) =>
      [
        row.employeeName,
        row.email,
        row.date,
        row.clockIn,
        row.clockOut,
      ]
        .map(escape)
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}
