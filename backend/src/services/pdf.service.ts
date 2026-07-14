import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { PayrollComponent } from '../entities/PayrollRecord.entity';

export interface PayslipData {
  companyName: string;
  companyAddress: string;
  companyLogo?: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  bankAccount: string;
  uan: string;
  pfNo?: string;
  esiNo?: string;
  month: number;
  year: number;
  payDate?: string;
  workingDays: number;
  eligibleWorkingDays: number;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  weekOffDays?: number;
  holidayDays?: number;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  pfEmployerContribution?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COLORS = {
  navy: '#073568',
  blue: '#0B72E7',
  teal: '#12B89A',
  ink: '#18324D',
  muted: '#687D96',
  border: '#D8E5F2',
  pale: '#F3F8FD',
  green: '#087A53',
  red: '#C5304F',
  white: '#FFFFFF',
};

function money(value: number): string {
  return `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}

function numberToWords(value: number): string {
  const num = Math.max(0, Math.round(value));
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const underThousand = (n: number): string => {
    const parts: string[] = [];
    if (n >= 100) {
      parts.push(`${ones[Math.floor(n / 100)]} Hundred`);
      n %= 100;
    }
    if (n >= 20) {
      parts.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) parts.push(ones[n]);
    return parts.join(' ');
  };
  const groups: Array<[number, string]> = [
    [10_000_000, 'Crore'], [100_000, 'Lakh'], [1_000, 'Thousand'], [1, ''],
  ];
  let remaining = num;
  const words: string[] = [];
  for (const [size, label] of groups) {
    const part = Math.floor(remaining / size);
    if (part > 0) {
      words.push(underThousand(part), label);
      remaining %= size;
    }
  }
  return words.filter(Boolean).join(' ');
}

function resolveLogo(custom?: string): string | undefined {
  const candidates = [
    custom,
    path.resolve(__dirname, '../templates/logobg.png'),
    path.resolve(process.cwd(), 'dist/templates/logobg.png'),
    path.resolve(process.cwd(), 'src/templates/logobg.png'),
  ];
  return candidates.find((candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)));
}

function safe(value: unknown): string {
  const text = String(value || '').trim();
  return text || '-';
}

export async function generatePayslipPdf(
  data: PayslipData,
  fileName: string,
): Promise<{ buffer: Buffer; fileName: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36, info: { Title: fileName, Author: data.companyName } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileName }));

    const left = 36;
    const width = doc.page.width - 72;
    const right = left + width;
    const logo = resolveLogo(data.companyLogo);

    doc.roundedRect(left, 30, width, 92, 12).fill(COLORS.navy);
    if (logo) doc.image(logo, left + 18, 46, { fit: [60, 60] });
    const brandX = logo ? left + 90 : left + 20;
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(20)
      .text(safe(data.companyName), brandX, 48, { width: right - brandX - 18 });
    doc.fillColor('#D7E9FA').font('Helvetica').fontSize(8.5)
      .text(safe(data.companyAddress), brandX, 76, { width: right - brandX - 18, height: 34 });

    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(18)
      .text('PAYSLIP', left, 143, { width, align: 'center' });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
      .text(`Salary statement for ${MONTH_NAMES[data.month - 1]} ${data.year}`, left, 167, { width, align: 'center' });
    doc.moveTo(left, 188).lineTo(right, 188).strokeColor(COLORS.teal).lineWidth(2).stroke();

    const detailY = 203;
    doc.roundedRect(left, detailY, width, 110, 8).fillAndStroke(COLORS.pale, COLORS.border);
    const info = [
      ['Employee Name', safe(data.employeeName), 'Employee ID', safe(data.employeeCode)],
      ['Designation', safe(data.designation), 'Department', safe(data.department)],
      ['Date of Joining', safe(data.dateOfJoining), 'Bank Account', safe(data.bankAccount)],
      ['UAN / PF No.', safe(data.uan || data.pfNo), 'ESI No.', safe(data.esiNo)],
    ];
    info.forEach((row, index) => {
      const y = detailY + 14 + index * 24;
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(row[0], left + 14, y, { width: 82 });
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(8.5).text(row[1], left + 97, y, { width: 150 });
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(row[2], left + 278, y, { width: 82 });
      doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(8.5).text(row[3], left + 361, y, { width: 150 });
    });

    const attendanceY = 330;
    const attendance = [
      ['Working', data.workingDays], ['Eligible', data.eligibleWorkingDays],
      ['Present', data.presentDays], ['Leave', data.leaveDays],
      ['LOP', data.lopDays], ['Payable', data.payableDays],
    ];
    const cellWidth = width / attendance.length;
    attendance.forEach(([label, value], index) => {
      const x = left + index * cellWidth;
      doc.roundedRect(x + 2, attendanceY, cellWidth - 4, 46, 6).fillAndStroke(COLORS.white, COLORS.border);
      doc.fillColor(COLORS.blue).font('Helvetica-Bold').fontSize(12).text(String(value), x, attendanceY + 9, { width: cellWidth, align: 'center' });
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7).text(String(label), x, attendanceY + 28, { width: cellWidth, align: 'center' });
    });

    const tableY = 394;
    const gap = 12;
    const tableWidth = (width - gap) / 2;
    const drawComponents = (title: string, rows: PayrollComponent[], x: number, accent: string) => {
      doc.roundedRect(x, tableY, tableWidth, 28, 6).fill(accent);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(9).text(title, x + 10, tableY + 9, { width: tableWidth - 20 });
      const normalized = rows.length ? rows : [{ name: 'None', amount: 0 }];
      normalized.forEach((row, index) => {
        const y = tableY + 28 + index * 25;
        if (index % 2 === 0) doc.rect(x, y, tableWidth, 25).fill(COLORS.pale);
        doc.fillColor(COLORS.ink).font('Helvetica').fontSize(8).text(safe(row.name), x + 10, y + 8, { width: tableWidth - 105 });
        doc.font('Helvetica-Bold').text(money(row.amount), x + tableWidth - 100, y + 8, { width: 90, align: 'right' });
      });
      return normalized.length;
    };
    const earningRows = drawComponents('EARNINGS', data.earnings, left, COLORS.blue);
    const deductionRows = drawComponents('DEDUCTIONS', data.deductions, left + tableWidth + gap, COLORS.navy);
    const rows = Math.max(earningRows, deductionRows);
    const summaryY = tableY + 28 + rows * 25 + 18;

    doc.roundedRect(left, summaryY, width, 62, 8).fillAndStroke(COLORS.pale, COLORS.border);
    const summary = [
      ['Gross Earnings', money(data.grossEarnings), COLORS.green],
      ['Total Deductions', money(data.totalDeductions), COLORS.red],
      ['NET PAY', money(data.netPay), COLORS.blue],
    ];
    summary.forEach(([label, value, color], index) => {
      const x = left + index * (width / 3);
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(label, x + 12, summaryY + 13, { width: width / 3 - 24 });
      doc.fillColor(color).font('Helvetica-Bold').fontSize(index === 2 ? 15 : 12)
        .text(value, x + 12, summaryY + 31, { width: width / 3 - 24 });
    });

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8)
      .text('Amount in words', left, summaryY + 78);
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(9)
      .text(`${numberToWords(data.netPay)} Rupees Only`, left, summaryY + 91, { width });
    if (data.pfEmployerContribution && data.pfEmployerContribution > 0) {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5)
        .text(`Employer PF contribution: ${money(data.pfEmployerContribution)} (informational)`, left, summaryY + 110);
    }

    const footerY = Math.max(summaryY + 136, doc.page.height - 62);
    doc.moveTo(left, footerY).lineTo(right, footerY).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5)
      .text(`Generated by ${safe(data.companyName)} through Connect HR. This is a computer-generated payslip and does not require a signature.`, left, footerY + 12, { width, align: 'center' });
    doc.end();
  });
}
