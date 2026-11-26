import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { brandAssets } from '../../core/brand-assets.js';

export interface CertificateContent {
  code: string;
  recipientName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: Date | string;
}

const C = {
  navy: '#0F1A3A',
  cobalt: '#2756D8',
  cobaltDeep: '#1C3FA8',
  marigold: '#FFAE1A',
  ink: '#0F1A3A',
  mute: '#5E6884',
  line: '#E1E4EE',
};

/**
 * Landscape A4 certificate. Mirrors the web view at /verify/certificate/:code:
 * navy band with logo, seal and QR on the left; recipient and course on the right.
 */
export function drawCertificatePdf(cert: CertificateContent, qrPng: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: { Title: `Learnova certificate: ${cert.courseTitle}`, Author: 'Learnova', Subject: cert.recipientName },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Brand fonts when shipped; Helvetica otherwise so a missing asset never breaks downloads.
    const hasFonts = [brandAssets.fontDisplay, brandAssets.fontBody, brandAssets.fontBodyBold].every((f) => existsSync(f));
    const DISPLAY = hasFonts ? 'Display' : 'Helvetica-Bold';
    const BODY = hasFonts ? 'Body' : 'Helvetica';
    const BOLD = hasFonts ? 'BodyBold' : 'Helvetica-Bold';
    if (hasFonts) {
      doc.registerFont('Display', brandAssets.fontDisplay);
      doc.registerFont('Body', brandAssets.fontBody);
      doc.registerFont('BodyBold', brandAssets.fontBodyBold);
    }

    const W = doc.page.width;
    const H = doc.page.height;
    const BAND = 250;

    // --- Left band ---
    doc.rect(0, 0, BAND, H).fill(C.navy);
    const glow = doc.radialGradient(BAND, 0, 0, BAND, 0, 320);
    glow.stop(0, C.cobalt, 0.85).stop(1, C.navy, 0);
    doc.rect(0, 0, BAND, H).fill(glow);

    if (existsSync(brandAssets.logoMark)) {
      doc.image(brandAssets.logoMark, 40, 46, { width: 54 });
    }
    doc.font(DISPLAY).fontSize(22).fillColor('#FFFFFF').text('Learnova', 104, 54, { lineBreak: false });

    // QR card
    const qrSize = 108;
    const qrX = 40;
    const qrY = H - 196;
    doc.roundedRect(qrX, qrY, qrSize + 20, qrSize + 20, 14).fill('#FFFFFF');
    doc.image(qrPng, qrX + 10, qrY + 10, { width: qrSize });
    doc
      .font(BODY)
      .fontSize(10)
      .fillColor('#FFFFFF', 0.7)
      .text('Scan to verify this certificate', qrX, qrY + qrSize + 32, { width: 170 });
    doc.fillOpacity(1);

    // Seal straddling the band edge
    const sx = BAND;
    const sy = 168;
    doc.circle(sx, sy, 54).fill('#FFFFFF');
    doc.circle(sx, sy, 46).fill(C.marigold);
    doc.circle(sx, sy, 38).lineWidth(1.2).strokeColor(C.navy, 0.35).stroke();
    doc.strokeOpacity(1);
    doc
      .moveTo(sx - 15, sy + 1)
      .lineTo(sx - 4, sy + 12)
      .lineTo(sx + 17, sy - 11)
      .lineWidth(5)
      .lineCap('round')
      .lineJoin('round')
      .strokeColor(C.navy)
      .stroke();

    // --- Right content ---
    const x = BAND + 80;
    const w = W - x - 64;

    const rowY = H - 132;
    // Shrink text until it fits in `maxLines` lines of the column (never truncate a name or title).
    const fit = (text: string, font: string, start: number, min: number, maxLines: number) => {
      let size = start;
      doc.font(font);
      while (size > min && doc.fontSize(size).heightOfString(text, { width: w }) > size * 1.25 * maxLines) size -= 1;
      return size;
    };

    let y = 104;
    doc.font(BOLD).fontSize(13).fillColor(C.cobalt).text('Certificate of completion', x, y, { width: w });
    y += 36;
    doc.font(BODY).fontSize(13).fillColor(C.mute).text('This certifies that', x, y, { width: w });
    y += 24;

    // One big line if it fits at >= 26pt, otherwise two smaller lines.
    const oneLine = fit(cert.recipientName, DISPLAY, 46, 26, 1);
    const fitsOneLine = doc.font(DISPLAY).fontSize(oneLine).heightOfString(cert.recipientName, { width: w }) <= oneLine * 1.25;
    const nameSize = fitsOneLine ? oneLine : fit(cert.recipientName, DISPLAY, 34, 22, 2);
    doc.font(DISPLAY).fontSize(nameSize).fillColor(C.ink).text(cert.recipientName, x, y, { width: w, lineGap: -2 });
    y = doc.y + 18;

    doc.font(BODY).fontSize(13).fillColor(C.mute).text('has successfully completed the course', x, y, { width: w });
    y += 24;
    const titleSize = fit(cert.courseTitle, DISPLAY, 26, 16, 3);
    // Hard stop above the details row so very long titles can't overlap it.
    const titleRoom = rowY - 48 - y;
    doc
      .font(DISPLAY)
      .fontSize(titleSize)
      .fillColor(C.cobaltDeep)
      .text(cert.courseTitle, x, y, { width: w, height: titleRoom, ellipsis: true, lineGap: 1 });
    y = Math.min(doc.y, rowY - 40) + 18;

    doc.rect(x, y, 64, 5).fill(C.marigold);

    // Details row
    doc.moveTo(x, rowY).lineTo(x + w, rowY).lineWidth(1).strokeColor(C.line).stroke();
    const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const cols: [string, string][] = [
      ['Instructor', cert.instructorName],
      ['Issued on', issued],
      ['Certificate ID', cert.code],
    ];
    const colW = w / cols.length;
    cols.forEach(([label, value], i) => {
      const cx = x + i * colW;
      doc.font(BODY).fontSize(10).fillColor(C.mute).text(label, cx, rowY + 20, { width: colW - 16 });
      doc
        .font(BOLD)
        .fontSize(13)
        .fillColor(C.ink)
        .text(value, cx, rowY + 36, { width: colW - 16, height: 36, ellipsis: true });
    });

    doc.end();
  });
}
