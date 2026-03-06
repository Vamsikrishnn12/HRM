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

  // Employee
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  pan: string;
  bankAccount: string;
  uan: string;

  // Period
  month: number;
  year: number;

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
  let result = words.join(' ') + ' Rupees';
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

  const earningRows = data.earnings
    .filter((e) => e.amount > 0)
    .map((e) => `<tr><td>${esc(e.name)}</td><td class="amt">${fmt(e.amount)}</td></tr>`)
    .join('');

  const deductionRows = data.deductions
    .filter((d) => d.amount > 0)
    .map((d) => `<tr><td>${esc(d.name)}</td><td class="amt">${fmt(d.amount)}</td></tr>`)
    .join('');

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
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }
  .container { max-width: 780px; margin: 0 auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4F46E5; padding-bottom: 16px; margin-bottom: 16px; }
  .company-name { font-size: 20px; font-weight: 700; color: #4F46E5; }
  .company-address { font-size: 10px; color: #64748B; margin-top: 2px; }
  .payslip-title { font-size: 14px; font-weight: 700; color: #1a1a2e; text-align: right; }
  .payslip-period { font-size: 11px; color: #4F46E5; font-weight: 600; text-align: right; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .info-box { border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; }
  .info-box h3 { font-size: 10px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .info-label { color: #64748B; font-size: 10px; }
  .info-value { font-weight: 600; font-size: 10px; color: #1a1a2e; }
  .attendance-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
  .att-item { text-align: center; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 4px; }
  .att-value { font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .att-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
  .comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .comp-box { border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; }
  .comp-header { padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .comp-header.earn { background: #F0FDF4; color: #166534; }
  .comp-header.ded { background: #FEF2F2; color: #991B1B; }
  .comp-table { width: 100%; border-collapse: collapse; }
  .comp-table td { padding: 5px 12px; font-size: 10px; border-top: 1px solid #F1F5F9; }
  .comp-table .amt { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .comp-total { display: flex; justify-content: space-between; padding: 8px 12px; font-weight: 700; font-size: 11px; border-top: 2px solid #E2E8F0; }
  .comp-total.earn { background: #F0FDF4; color: #166534; }
  .comp-total.ded { background: #FEF2F2; color: #991B1B; }
  .net-box { border: 2px solid #4F46E5; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
  .net-label { font-size: 13px; font-weight: 700; color: #4F46E5; }
  .net-amount { font-size: 20px; font-weight: 800; color: #4F46E5; }
  .net-words { font-size: 10px; color: #64748B; font-style: italic; margin-bottom: 16px; }
  .footer { border-top: 1px solid #E2E8F0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 9px; color: #94A3B8; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <div class="company-name">${esc(data.companyName)}</div>
      <div class="company-address">${esc(data.companyAddress)}</div>
    </div>
    <div>
      <div class="payslip-title">PAYSLIP</div>
      <div class="payslip-period">${monthYear}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Employee Information</h3>
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${esc(data.employeeName)}</span></div>
      <div class="info-row"><span class="info-label">Employee ID</span><span class="info-value">${esc(data.employeeCode)}</span></div>
      <div class="info-row"><span class="info-label">Designation</span><span class="info-value">${esc(data.designation || '—')}</span></div>
      <div class="info-row"><span class="info-label">Department</span><span class="info-value">${esc(data.department || '—')}</span></div>
    </div>
    <div class="info-box">
      <h3>Financial Details</h3>
      <div class="info-row"><span class="info-label">Date of Joining</span><span class="info-value">${esc(data.dateOfJoining || '—')}</span></div>
      <div class="info-row"><span class="info-label">PAN</span><span class="info-value">${esc(data.pan || '—')}</span></div>
      <div class="info-row"><span class="info-label">Bank Account</span><span class="info-value">${maskedBank}</span></div>
      <div class="info-row"><span class="info-label">UAN</span><span class="info-value">${esc(data.uan || '—')}</span></div>
    </div>
  </div>

  <div class="attendance-bar">
    <div class="att-item"><div class="att-value">${data.workingDays}</div><div class="att-label">Working Days</div></div>
    <div class="att-item"><div class="att-value">${data.payableDays}</div><div class="att-label">Payable Days</div></div>
    <div class="att-item"><div class="att-value">${data.presentDays}</div><div class="att-label">Present Days</div></div>
    <div class="att-item"><div class="att-value">${data.leaveDays}</div><div class="att-label">Leave Days</div></div>
    <div class="att-item"><div class="att-value">${data.lopDays}</div><div class="att-label">LOP Days</div></div>
  </div>

  <div class="comp-grid">
    <div class="comp-box">
      <div class="comp-header earn">Earnings</div>
      <table class="comp-table"><tbody>${earningRows || '<tr><td colspan="2" style="text-align:center;color:#94A3B8;">No earnings</td></tr>'}</tbody></table>
      <div class="comp-total earn"><span>Gross Earnings</span><span>₹ ${fmt(data.grossEarnings)}</span></div>
    </div>
    <div class="comp-box">
      <div class="comp-header ded">Deductions</div>
      <table class="comp-table"><tbody>${deductionRows || '<tr><td colspan="2" style="text-align:center;color:#94A3B8;">No deductions</td></tr>'}</tbody></table>
      <div class="comp-total ded"><span>Total Deductions</span><span>₹ ${fmt(data.totalDeductions)}</span></div>
    </div>
  </div>

  <div class="net-box">
    <span class="net-label">NET PAY</span>
    <span class="net-amount">₹ ${fmt(data.netPay)}</span>
  </div>
  <div class="net-words">${numberToWords(data.netPay)}</div>

  <div class="footer">
    <span class="footer-text">This is a computer-generated payslip and does not require a signature.</span>
    <span class="footer-text">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
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
  const outputPath = path.join(PAYSLIP_DIR, fileName);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
  } finally {
    await browser.close();
  }

  return { filePath: outputPath, fileName };
}

export { PAYSLIP_DIR };
