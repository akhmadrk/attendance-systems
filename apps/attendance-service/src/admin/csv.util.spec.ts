import { toCsv } from './csv.util';

describe('csv.util (FR-HRD-006)', () => {
  it('renders header and rows', () => {
    const csv = toCsv([
      {
        employeeName: 'John Doe',
        email: 'john@company.com',
        date: '2026-09-07',
        clockIn: '08:00:00',
        clockOut: '17:00:00',
      },
    ]);

    expect(csv).toContain('Employee Name,Email,Date,Clock In,Clock Out');
    expect(csv).toContain('John Doe,john@company.com,2026-09-07,08:00:00,17:00:00');
  });

  it('escapes values containing commas', () => {
    const csv = toCsv([
      {
        employeeName: 'Doe, John',
        email: 'john@company.com',
        date: '2026-09-07',
        clockIn: '08:00:00',
        clockOut: '17:00:00',
      },
    ]);

    expect(csv).toContain('"Doe, John"');
  });
});
