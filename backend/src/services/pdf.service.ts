import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-core';
import type { PayrollComponent } from '../entities/PayrollRecord.entity';

const PAYSLIP_DIR = path.resolve('uploads', 'payslips');
if (!fs.existsSync(PAYSLIP_DIR)) {
  fs.mkdirSync(PAYSLIP_DIR, { recursive: true });
}

// Try common Chrome locations
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
  // Company
  companyName: string;
  companyAddress: string;
  companyLogo?: string;

  // Employee
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  bankAccount: string;
  uan: string;

  // Period
  month: number;
  year: number;
  payDate?: string;

  // Attendance
  workingDays: number;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;

  // Components
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;

  // Optional informational
  pfEmployerContribution?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const absNum = Math.abs(Math.floor(num));
  if (absNum === 0) return 'Zero';

  // Indian numbering: ones(3), then pairs of 2 digits
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
        w += r < 20 ? ' ' + ones[r] : ' ' + tens[Math.floor(r / 10)] + (r % 10 ? ' ' + ones[r % 10] : '');
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
    const paiseW = paise < 20 ? ones[paise] : tens[Math.floor(paise / 10)] + (paise % 10 ? ' ' + ones[paise % 10] : '');
    result += ' and ' + paiseW + ' Paise';
  }
  result += ' Only';
  return result;
}

function fmt(n: number): string {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPayslipHtml(data: PayslipData): string {
  const monthYear = `${MONTH_NAMES[data.month - 1]} ${data.year}`;
  const payDate = data.payDate || `${new Date(data.year, data.month, 0).getDate()}/${String(data.month).padStart(2, '0')}/${data.year}`;
  const payPeriod = `01/${String(data.month).padStart(2, '0')}/${data.year} - ${new Date(data.year, data.month, 0).getDate()}/${String(data.month).padStart(2, '0')}/${data.year}`;

  const earningsFiltered = data.earnings.filter((e) => e.amount > 0);
  const deductionsFiltered = data.deductions.filter((d) => d.amount > 0);
  const maxRows = Math.max(earningsFiltered.length, deductionsFiltered.length);

  let salaryTableRows = '';
  for (let i = 0; i < maxRows; i++) {
    const e = earningsFiltered[i];
    const d = deductionsFiltered[i];
    salaryTableRows += `<tr>
      <td class="comp-name">${e ? esc(e.name) : ''}</td>
      <td class="comp-amt">${e ? fmt(e.amount) : ''}</td>
      <td class="comp-name">${d ? esc(d.name) : ''}</td>
      <td class="comp-amt">${d ? fmt(d.amount) : ''}</td>
    </tr>`;
  }

  const maskedBank = data.bankAccount
    ? data.bankAccount.length > 4
      ? 'XXXX' + data.bankAccount.slice(-4)
      : data.bankAccount
    : '—';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11px; color: #222; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 28px 32px; }

  /* ── Header ── */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #444; margin-bottom: 0; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .logo-circle { width: 44px; height: 44px; border-radius: 50%; background: #4F46E5; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 18px; flex-shrink: 0; }
  .company-name { font-size: 18px; font-weight: 700; color: #1a1a2e; letter-spacing: 0.3px; }
  .company-address { font-size: 9.5px; color: #666; margin-top: 2px; max-width: 320px; }
  .header-right { text-align: right; }
  .payslip-title { font-size: 16px; font-weight: 700; color: #1a1a2e; letter-spacing: 1px; }
  .payslip-period { font-size: 11px; color: #555; font-weight: 600; margin-top: 2px; }

  /* ── Employee Summary ── */
  .emp-section { display: grid; grid-template-columns: 1fr 1fr; border-left: 1px solid #ccc; border-right: 1px solid #ccc; }
  .emp-section .emp-row { display: flex; justify-content: space-between; padding: 5px 14px; border-bottom: 1px solid #e5e5e5; font-size: 10.5px; }
  .emp-section .emp-row:nth-child(odd) { background: #fafafa; }
  .emp-col { border-right: 1px solid #ccc; }
  .emp-col:last-child { border-right: none; }
  .emp-label { color: #777; font-weight: 500; }
  .emp-value { font-weight: 600; color: #222; }

  /* ── Net Pay Highlight ── */
  .net-highlight { border: 1px solid #ccc; border-top: 2px solid #444; margin-top: 0; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; background: #f7f7f7; }
  .net-main { }
  .net-label { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .net-amount { font-size: 22px; font-weight: 800; color: #1a1a2e; margin-top: 2px; }
  .net-stats { display: flex; gap: 24px; }
  .net-stat { text-align: center; }
  .net-stat-val { font-size: 14px; font-weight: 700; color: #222; }
  .net-stat-lbl { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }

  /* ── Salary Table ── */
  .salary-section { margin-top: 16px; }
  .salary-table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; }
  .salary-table thead th { padding: 8px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border-bottom: 2px solid #bbb; background: #f2f2f2; color: #444; }
  .salary-table thead th.earn-h { text-align: left; }
  .salary-table thead th.ded-h { text-align: left; border-left: 1px solid #ccc; }
  .salary-table thead th.amt-h { text-align: right; width: 110px; }
  .salary-table tbody td { padding: 5px 14px; font-size: 10.5px; border-bottom: 1px solid #eee; }
  .salary-table tbody td.comp-name { color: #444; }
  .salary-table tbody td.comp-amt { text-align: right; font-weight: 600; color: #222; font-variant-numeric: tabular-nums; }
  .salary-table tbody td:nth-child(3) { border-left: 1px solid #ccc; }
  .salary-table tfoot td { padding: 8px 14px; font-weight: 700; font-size: 11px; border-top: 2px solid #bbb; background: #f2f2f2; }
  .salary-table tfoot td.total-label { color: #444; }
  .salary-table tfoot td.total-amt { text-align: right; color: #222; font-variant-numeric: tabular-nums; }
  .salary-table tfoot td.ded-border { border-left: 1px solid #ccc; }

  /* ── Net Row ── */
  .net-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #ccc; border-top: none; background: #f7f7f7; }
  .net-row-label { font-size: 12px; font-weight: 700; color: #1a1a2e; }
  .net-row-amount { font-size: 14px; font-weight: 800; color: #1a1a2e; }

  /* ── Amount In Words ── */
  .words-row { padding: 8px 14px; border: 1px solid #ccc; border-top: none; font-size: 10px; color: #555; font-style: italic; }

  /* ── Employer Info (optional) ── */
  .employer-info { margin-top: 12px; padding: 8px 14px; border: 1px dashed #ccc; border-radius: 4px; font-size: 9.5px; color: #888; }

  /* ── Footer ── */
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; text-align: center; }
  .footer-text { font-size: 9px; color: #999; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="logo-circle">${esc(data.companyName.charAt(0))}</div>
      <div>
        <div class="company-name">${esc(data.companyName)}</div>
        <div class="company-address">${esc(data.companyAddress)}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="payslip-title">PAYSLIP</div>
      <div class="payslip-period">${monthYear}</div>
    </div>
  </div>

  <!-- Employee Summary -->
  <div class="emp-section">
    <div class="emp-col">
      <div class="emp-row"><span class="emp-label">Employee Name</span><span class="emp-value">${esc(data.employeeName)}</span></div>
      <div class="emp-row"><span class="emp-label">Employee ID</span><span class="emp-value">${esc(data.employeeCode)}</span></div>
      <div class="emp-row"><span class="emp-label">Designation</span><span class="emp-value">${esc(data.designation || '—')}</span></div>
      <div class="emp-row"><span class="emp-label">Pay Period</span><span class="emp-value">${payPeriod}</span></div>
    </div>
    <div class="emp-col">
      <div class="emp-row"><span class="emp-label">Department</span><span class="emp-value">${esc(data.department || '—')}</span></div>
      <div class="emp-row"><span class="emp-label">Date of Joining</span><span class="emp-value">${esc(data.dateOfJoining || '—')}</span></div>
      <div class="emp-row"><span class="emp-label">Bank Account</span><span class="emp-value">${maskedBank}</span></div>
      <div class="emp-row"><span class="emp-label">Pay Date</span><span class="emp-value">${payDate}</span></div>
    </div>
  </div>

  <!-- Net Pay Highlight -->
  <div class="net-highlight">
    <div class="net-main">
      <div class="net-label">Net Pay for ${MONTH_NAMES[data.month - 1]} ${data.year}</div>
      <div class="net-amount">&#8377; ${fmt(data.netPay)}</div>
    </div>
    <div class="net-stats">
      <div class="net-stat"><div class="net-stat-val">${data.payableDays}</div><div class="net-stat-lbl">Paid Days</div></div>
      <div class="net-stat"><div class="net-stat-val">${data.lopDays}</div><div class="net-stat-lbl">LOP Days</div></div>
    </div>
  </div>

  <!-- Attendance -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);border:1px solid #ccc;border-top:none;font-size:9.5px;text-align:center;">
    <div style="padding:6px 4px;border-right:1px solid #eee;"><span style="color:#888;">Working Days</span><br><strong>${data.workingDays}</strong></div>
    <div style="padding:6px 4px;border-right:1px solid #eee;"><span style="color:#888;">Present Days</span><br><strong>${data.presentDays}</strong></div>
    <div style="padding:6px 4px;border-right:1px solid #eee;"><span style="color:#888;">Leave Days</span><br><strong>${data.leaveDays}</strong></div>
    <div style="padding:6px 4px;border-right:1px solid #eee;"><span style="color:#888;">Paid Days</span><br><strong>${data.payableDays}</strong></div>
    <div style="padding:6px 4px;"><span style="color:#888;">LOP Days</span><br><strong>${data.lopDays}</strong></div>
  </div>

  <!-- Earnings & Deductions Table -->
  <div class="salary-section">
    <table class="salary-table">
      <thead>
        <tr>
          <th class="earn-h">Earnings</th>
          <th class="amt-h">Amount (&#8377;)</th>
          <th class="ded-h">Deductions</th>
          <th class="amt-h">Amount (&#8377;)</th>
        </tr>
      </thead>
      <tbody>
        ${salaryTableRows || '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:10px;">No components</td></tr>'}
      </tbody>
      <tfoot>
        <tr>
          <td class="total-label">Gross Earnings</td>
          <td class="total-amt">&#8377; ${fmt(data.grossEarnings)}</td>
          <td class="total-label ded-border">Total Deductions</td>
          <td class="total-amt">&#8377; ${fmt(data.totalDeductions)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Net -->
    <div class="net-row">
      <span class="net-row-label">Net Pay (Gross Earnings - Total Deductions)</span>
      <span class="net-row-amount">&#8377; ${fmt(data.netPay)}</span>
    </div>

    <!-- Amount in words -->
    <div class="words-row"><strong>Amount in Words:</strong> ${numberToWords(data.netPay)}</div>
  </div>

  ${data.pfEmployerContribution && data.pfEmployerContribution > 0 ? `
  <div class="employer-info">
    <strong>Note:</strong> Employer PF Contribution: &#8377; ${fmt(data.pfEmployerContribution)} (This amount is contributed by the employer and does not reduce your net salary.)
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span class="footer-text">This is a system-generated payslip and does not require a signature.</span>
  </div>
</div>
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
