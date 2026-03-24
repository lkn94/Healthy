import crypto from 'crypto';
import { env } from '../env';

const algorithm = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

export const encrypt = (value: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.from(
    JSON.stringify({
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: authTag.toString('hex')
    })
  ).toString('base64');
};

export const decrypt = (payload: string): string => {
  const decoded = Buffer.from(payload, 'base64').toString('utf8');
  const { iv, content, tag } = JSON.parse(decoded) as {
    iv: string;
    content: string;
    tag: string;
  };

  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
};
