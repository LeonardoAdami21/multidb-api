// src/common/crypto.service.ts
import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class CryptoService {
  private readonly key: string;

  constructor() {
    this.key =
      process.env.ENCRYPTION_KEY ?? 'default-key-change-in-production!!';
  }

  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.key).toString();
  }

  decrypt(cipherText: string): string {
    const bytes = CryptoJS.AES.decrypt(cipherText, this.key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }
}
