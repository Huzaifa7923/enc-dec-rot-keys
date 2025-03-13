import { Injectable } from '@nestjs/common';
import { KeyManagementServiceClient } from '@google-cloud/kms';
import * as crypto from 'crypto';

@Injectable()
export class KmsService {
  private client: KeyManagementServiceClient;
  private projectId: string;
  private location: string;
  private keyRing: string;
  private kekKey: string;

  constructor() {
    this.client = new KeyManagementServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID ?? "";
    this.location = process.env.KMS_LOCATION ?? "";
    this.keyRing = process.env.KMS_KEYRING ?? "";
    this.kekKey = process.env.KEK_KEY ?? "";
  }


  async isPrimaryVersion(): Promise<boolean> {
    const dekToDecrypt = process.env.ENCRYPTED_DEK?? null;
    if (!dekToDecrypt) {
      throw new Error("No encrypted DEK available. Generate one first with generateEncryptedDek()");
    }
    const kekPath=await this.getKEK();
    const [result] = await this.client.decrypt({
      name: kekPath,
      ciphertext: dekToDecrypt,
    });
    return result.usedPrimary ??false;
  }

  async generateEncryptedDek(): Promise<string> {
    const dek = crypto.randomBytes(32);
    const pathKEK = await this.getKEK();

    const [result] = await this.client.encrypt({
      name: pathKEK,
      plaintext: dek
    });

    let encryptedDekBase64: string;
    if (result.ciphertext instanceof Uint8Array) {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else if (typeof result.ciphertext === 'string') {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else {
      throw new Error('Unexpected ciphertext format from KMS');
    }

    return encryptedDekBase64;
  }

  async reEncryptDek(): Promise<string> {
    const dek = await this.decryptDek();
    const pathKEK = await this.getKEK();
    const [result] = await this.client.encrypt({
      name: pathKEK,
      plaintext: dek
    });
    if(!result.ciphertext){
      throw new Error('Failed to re-encrypt DEK');
    }
    let encryptedDekBase64: string;
    if (result.ciphertext instanceof Uint8Array ) {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else if (typeof result.ciphertext === 'string') {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else {
      throw new Error('Unexpected ciphertext format from KMS');
    }
    return encryptedDekBase64;
  }

  async getKEK() {
    return this.client.cryptoKeyPath(
      this.projectId, 
      this.location, 
      this.keyRing, 
      this.kekKey
    );
  }

  async decryptDek(): Promise<Buffer> {
    const dekToDecrypt = process.env.ENCRYPTED_DEK ?? null;
    if (!dekToDecrypt) {
      throw new Error("No encrypted DEK available. Generate one first with generateEncryptedDek()");
    }

    const pathKEK = await this.getKEK();
    const ciphertext = Buffer.from(dekToDecrypt, 'base64');

    try {
      const [result] = await this.client.decrypt({
        name: pathKEK,
        ciphertext: ciphertext
      });

      if (!result || !result.plaintext) {
        throw new Error("Failed to decrypt DEK: Empty result from KMS");
      }

      const dek = result.plaintext instanceof Uint8Array 
        ? Buffer.from(result.plaintext) 
        : Buffer.from(result.plaintext, 'base64');

      if (dek.length !== 32) {
        throw new Error(`Invalid DEK length after decryption: ${dek.length} bytes (expected 32)`);
      }

      return dek;
    } catch (error) {
      throw new Error(`Failed to decrypt DEK: ${error.message || 'Unknown error'}`);
    }
  }

  async encryptData(plaintext: any): Promise<{ data: string }> {
    if (plaintext === undefined || plaintext === null) {
      throw new Error('Cannot encrypt null or undefined data');
    }

    if (typeof plaintext !== "string") {
      plaintext = JSON.stringify(plaintext);
    }

    try {
      const dek = await this.decryptDek();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', dek, iv);

      const encryptedData = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const ivAndEncryptedData = Buffer.concat([iv, encryptedData]);
      return {
        data: ivAndEncryptedData.toString('base64')
      };
    } catch (error) {
      throw new Error(`Failed to encrypt data: ${error.message || 'Unknown error'}`);
    }
  }

  async decryptData(encryptedData: string): Promise<any> {
    if (!encryptedData) {
      throw new Error('Cannot decrypt empty or null data');
    }

    let dataToDecrypt = encryptedData;
    try {
      const parsedData = JSON.parse(encryptedData);
      if (parsedData && parsedData.data) {
        dataToDecrypt = parsedData.data;
      }
    } catch (e) {}

    try {
      const dek = await this.decryptDek();
      const dataBuffer = Buffer.from(dataToDecrypt, 'base64');

      if (dataBuffer.length <= 16) {
        throw new Error(`Invalid encrypted data: too short to contain IV and content. Length: ${dataBuffer.length} bytes`);
      }

      const iv = dataBuffer.slice(0, 16);
      const encryptedContent = dataBuffer.slice(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', dek, iv);

      const decryptedData = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final(),
      ]);

      try {
        return JSON.parse(decryptedData.toString('utf8'));
      } catch (e) {
        return decryptedData.toString('utf8');
      }
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error.message || 'Unknown error'}`);
    }
  }
}
