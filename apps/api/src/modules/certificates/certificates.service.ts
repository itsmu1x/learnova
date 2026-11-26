import QRCode from 'qrcode';
import { schema, and, eq, desc } from '@learnova/database';
import { NotFoundError, generateCertificateCode } from '@learnova/shared';
import { getEnv } from '@learnova/config';
import { drawCertificatePdf } from './certificate-pdf.js';
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
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 300, color: { dark: '#0F1A3A' } });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1]!, 'base64');

    return drawCertificatePdf(cert, qrBuffer);
  },
};
