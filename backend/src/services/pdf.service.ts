import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import type { PayrollComponent } from '../entities/PayrollRecord.entity';
import { getUploadPath } from '../utils/uploadPath';

const PAYSLIP_DIR = getUploadPath('payslips');
if (!fs.existsSync(PAYSLIP_DIR)) {
  fs.mkdirSync(PAYSLIP_DIR, { recursive: true });
}

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found. Set CHROME_PATH env variable.');
}

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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const absNum = Math.abs(Math.floor(num));
  if (absNum === 0) return 'Zero';

  const parts: number[] = [];
  let remaining = absNum;
  parts.push(remaining % 1000);
  remaining = Math.floor(remaining / 1000);
  while (remaining > 0) {
    parts.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  const words: string[] = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p === 0) continue;
    let w = '';
    if (p >= 100) {
      w += ones[Math.floor(p / 100)] + ' Hundred';
      const r = p % 100;
      if (r > 0) {
        w +=
          r < 20
            ? ' ' + ones[r]
            : ' ' + tens[Math.floor(r / 10)] + (r % 10 ? ' ' + ones[r % 10] : '');
      }
    } else if (p < 20) {
      w = ones[p];
    } else {
      w = tens[Math.floor(p / 10)] + (p % 10 ? ' ' + ones[p % 10] : '');
    }
    if (i < scales.length && scales[i]) w += ' ' + scales[i];
    words.push(w);
  }

  const paise = Math.round((num - Math.floor(num)) * 100);
  let result = 'Rupees ' + words.join(' ');
  if (paise > 0) {
    const paiseW =
      paise < 20
        ? ones[paise]
        : tens[Math.floor(paise / 10)] + (paise % 10 ? ' ' + ones[paise % 10] : '');
    result += ' and ' + paiseW + ' Paise';
  }
  result += ' Only';
  return result;
}

function fmt(n: number): string {
  return Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPayslipHtml(data: PayslipData): string {
  const monthYear = `${MONTH_NAMES[data.month - 1]} ${data.year}`;
  const payDate =
    data.payDate ||
    `${new Date(data.year, data.month, 0).getDate()}/${String(data.month).padStart(2, '0')}/${data.year}`;

  const earningsFiltered = data.earnings.filter((e) => e.amount > 0);
  const deductionsFiltered = data.deductions.filter((d) => d.amount > 0);
  const maxRows = Math.max(earningsFiltered.length, deductionsFiltered.length, 4);

  let salaryTableRows = '';
  for (let i = 0; i < maxRows; i++) {
    const e = earningsFiltered[i];
    const d = deductionsFiltered[i];
    salaryTableRows += `<tr>
      <td>${e ? esc(e.name) : ''}</td>
      <td class="amount">${e ? '&#8377; ' + fmt(e.amount) : ''}</td>
      <td>${d ? esc(d.name) : ''}</td>
      <td class="amount">${d ? '&#8377; ' + fmt(d.amount) : ''}</td>
    </tr>`;
  }

  const maskedBank = data.bankAccount
    ? data.bankAccount.length > 4
      ? 'XXXX' + data.bankAccount.slice(-4)
      : data.bankAccount
    : '-';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1f2937; background: #fff; padding: 20px; }
  .sheet { width: 100%; border: 1px solid #d6d3e1; }
  .title-wrap { text-align: center; border-bottom: 2px solid #7548b9; padding: 12px 8px 10px; }
  .title-wrap h1 { font-size: 22px; color: #7548b9; margin-bottom: 2px; }
  .title-wrap .address { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .title-wrap .sub { font-size: 16px; font-weight: 700; color: #111827; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td, th { border: 1px solid #d6d3e1; padding: 6px 8px; vertical-align: middle; }
  th { background: #f4effb; color: #3f2a63; font-weight: 700; text-align: left; }
  .label { color: #6b7280; width: 22%; }
  .value { font-weight: 600; color: #111827; width: 28%; }
  .summary-label { color: #4b5563; font-weight: 600; }
  .summary-value { font-weight: 700; text-align: right; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .total-row td { background: #f8f5fd; font-weight: 700; }
  .net-row td { background: #efe7fb; font-size: 14px; font-weight: 800; color: #3f2a63; }
  .muted { color: #6b7280; font-style: italic; }
  .footer { margin-top: 12px; font-size: 9px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<div class="sheet">
  <div class="title-wrap">
    <h1>${esc(data.companyName)}</h1>
    <div class="address">${esc(data.companyAddress || '-')}</div>
    <div class="sub">Pay Slip for ${monthYear}</div>
  </div>

  <table>
    <tr>
      <td class="label">Employee ID</td><td class="value">${esc(data.employeeCode || '-')}</td>
      <td class="label">UAN</td><td class="value">${esc(data.uan || '-')}</td>
    </tr>
    <tr>
      <td class="label">Employee Name</td><td class="value">${esc(data.employeeName || '-')}</td>
      <td class="label">PF No</td><td class="value">${esc(data.pfNo || '-')}</td>
    </tr>
    <tr>
      <td class="label">Designation</td><td class="value">${esc(data.designation || '-')}</td>
      <td class="label">ESI No</td><td class="value">${esc(data.esiNo || '-')}</td>
    </tr>
    <tr>
      <td class="label">Department</td><td class="value">${esc(data.department || '-')}</td>
      <td class="label">Bank Account</td><td class="value">${esc(maskedBank || '-')}</td>
    </tr>
    <tr>
      <td class="label">Date of Joining</td><td class="value">${esc(data.dateOfJoining || '-')}</td>
      <td class="label">Pay Date</td><td class="value">${esc(payDate)}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td class="summary-label">Gross Wages</td>
      <td class="summary-value">&#8377; ${fmt(data.grossEarnings)}</td>
      <td class="summary-label">Week Off</td>
      <td class="summary-value">${data.weekOffDays ?? '-'}</td>
    </tr>
    <tr>
      <td class="summary-label">Total Working Days</td>
      <td class="summary-value">${data.eligibleWorkingDays || data.workingDays}</td>
      <td class="summary-label">Holidays</td>
      <td class="summary-value">${data.holidayDays ?? '-'}</td>
    </tr>
    <tr>
      <td class="summary-label">LOP Days</td>
      <td class="summary-value">${data.lopDays}</td>
      <td class="summary-label">Paid Days</td>
      <td class="summary-value">${data.payableDays}</td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th colspan="2">Earnings</th>
        <th colspan="2">Deductions</th>
      </tr>
    </thead>
    <tbody>
      ${salaryTableRows}
      <tr class="total-row">
        <td>Total Earnings</td>
        <td class="amount">&#8377; ${fmt(data.grossEarnings)}</td>
        <td>Total Deductions</td>
        <td class="amount">&#8377; ${fmt(data.totalDeductions)}</td>
      </tr>
      <tr class="net-row">
        <td colspan="3">Net Salary</td>
        <td class="amount">&#8377; ${fmt(data.netPay)}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <tr>
      <td class="muted"><strong>Amount in Words:</strong> ${numberToWords(data.netPay)}</td>
    </tr>
  </table>

  ${
    data.pfEmployerContribution && data.pfEmployerContribution > 0
      ? `<table><tr><td class="muted"><strong>Employer PF Contribution:</strong> &#8377; ${fmt(data.pfEmployerContribution)} (informational only)</td></tr></table>`
      : ''
  }
</div>
<div class="footer">This is a system-generated payslip.</div>
</body>
</html>`;
}

export async function generatePayslipPdf(
  data: PayslipData,
  fileName: string,
): Promise<{ filePath: string; fileName: string }> {
  const html = buildPayslipHtml(data);
  const filePath = path.join(PAYSLIP_DIR, fileName);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findChrome(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
  } finally {
    await browser.close();
  }

  return { filePath, fileName };
}

export { PAYSLIP_DIR };
