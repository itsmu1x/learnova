import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { existsSync } from 'node:fs';
import { schema, and, eq, desc } from '@learnova/database';
import { NotFoundError, generateCertificateCode } from '@learnova/shared';
import { getEnv } from '@learnova/config';
import { brandAssets } from '../../core/brand-assets.js';
import { db } from '../../core/database.js';
import { recordAudit } from '../audit/audit.service.js';

export const certificatesService = {
  /** Idempotent: returns the existing certificate if one was already issued. */
  async issue(userId: string, courseId: string) {
    const [existing] = await db()
      .select()
      .from(schema.certificates)
      .where(and(eq(schema.certificates.userId, userId), eq(schema.certificates.courseId, courseId)))
      .limit(1);
    if (existing) return existing;

    const [user] = await db().select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const [course] = await db()
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, courseId))
      .limit(1);
    if (!user || !course) throw new NotFoundError('User or course not found');
    const [instructor] = await db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, course.instructorId))
      .limit(1);

    const [cert] = await db()
      .insert(schema.certificates)
      .values({
        code: generateCertificateCode(),
        userId,
        courseId,
        recipientName: user.name,
        courseTitle: course.title,
        instructorName: instructor?.name ?? 'Learnova Instructor',
      })
      .returning();

    await recordAudit({
      actorId: userId,
      action: 'certificate.issue',
      entityType: 'certificate',
      entityId: cert!.id,
    });
    return cert!;
  },

  async listForUser(userId: string) {
    return db()
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.userId, userId))
      .orderBy(desc(schema.certificates.issuedAt));
  },

  /** Public verification endpoint payload. */
  async verify(code: string) {
    const [cert] = await db()
      .select({
        code: schema.certificates.code,
        recipientName: schema.certificates.recipientName,
        courseTitle: schema.certificates.courseTitle,
        instructorName: schema.certificates.instructorName,
        issuedAt: schema.certificates.issuedAt,
      })
      .from(schema.certificates)
      .where(eq(schema.certificates.code, code))
      .limit(1);
    if (!cert) throw new NotFoundError('Certificate not found or invalid');
    return { valid: true, certificate: cert };
  },

  async renderPdf(code: string): Promise<Buffer> {
    const [cert] = await db()
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.code, code))
      .limit(1);
    if (!cert) throw new NotFoundError('Certificate not found');

    const verifyUrl = `${getEnv().WEB_URL}/verify/certificate/${cert.code}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 140 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1]!, 'base64');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { width, height } = doc.page;

      doc.rect(0, 0, width, height).fill('#f8fafc');
      doc.lineWidth(6).strokeColor('#4f46e5').rect(24, 24, width - 48, height - 48).stroke();
      doc.lineWidth(1).strokeColor('#c7d2fe').rect(36, 36, width - 72, height - 72).stroke();

      if (existsSync(brandAssets.logoMark)) {
        const logoW = 72;
        doc.image(brandAssets.logoMark, (width - logoW) / 2, 48, { width: logoW });
      } else {
        doc.fillColor('#4f46e5').fontSize(28).font('Helvetica-Bold').text('LEARNOVA', 0, 70, { align: 'center' });
      }

      doc.fillColor('#0f172a').fontSize(34).font('Helvetica-Bold').text('Certificate of Completion', 0, 130, {
        align: 'center',
      });

      doc.fillColor('#64748b').fontSize(14).font('Helvetica').text('This is proudly presented to', 0, 195, {
        align: 'center',
      });
      doc.fillColor('#0f172a').fontSize(30).font('Helvetica-Bold').text(cert.recipientName, 0, 220, {
        align: 'center',
      });

      doc.fillColor('#64748b').fontSize(14).font('Helvetica').text('for successfully completing', 0, 280, {
        align: 'center',
      });
      doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(cert.courseTitle, 0, 305, {
        align: 'center',
      });

      doc
        .fillColor('#64748b')
        .fontSize(12)
        .font('Helvetica')
        .text(`Instructor: ${cert.instructorName}`, 0, 360, { align: 'center' })
        .text(`Issued: ${new Date(cert.issuedAt).toLocaleDateString()}`, 0, 378, { align: 'center' })
        .text(`Certificate ID: ${cert.code}`, 0, 396, { align: 'center' });

      doc.image(qrBuffer, width - 150, height - 160, { width: 100 });
      doc.fillColor('#94a3b8').fontSize(9).text('Scan to verify', width - 150, height - 56, { width: 100, align: 'center' });

      doc.end();
    });
  },
};
