/**
 * 暗号化ユーティリティ
 * X OAuth トークンなどの機密情報を暗号化/復号化するための関数群
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * 暗号化キーを取得
 * 環境変数から32バイトのキーを取得（64文字のHEX文字列）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * テキストを暗号化
 * @param text - 暗号化するテキスト
 * @returns 暗号化されたテキスト（iv:authTag:encrypted の形式）
 */
export function encrypt(text: string): string {
  try {
    const KEY = getEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // iv:authTag:encrypted の形式で返す
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 暗号化されたテキストを復号化
 * @param encryptedText - 暗号化されたテキスト（iv:authTag:encrypted の形式）
 * @returns 復号化されたテキスト
 */
export function decrypt(encryptedText: string): string {
  try {
    const KEY = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * 暗号化キーを生成（開発用）
 * 本番環境では安全に生成・保管する必要がある
 * @returns 64文字のHEX文字列（32バイト）
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
