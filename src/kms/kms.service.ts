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

  generateDek(): Buffer {
    const dek = crypto.randomBytes(32); 
    console.log("Generated DEK SUCCESS");
    return dek;
  }

  async getKEK() {
    const keyPath = this.client.cryptoKeyPath(
      this.projectId, 
      this.location, 
      this.keyRing, 
      this.kekKey
    );
    
    // Get the crypto key to ensure it exists and is accessible
    await this.client.getCryptoKey({ name: keyPath });
    
    return keyPath;
  }

  async encryptDek() {
    console.log("Encrypting DEK...");

    const dek = this.generateDek();
    const pathKEK = await this.getKEK();

    const [result] = await this.client.encrypt({
      name: pathKEK,
      plaintext: dek
    });

    // Ensure we're getting the ciphertext as a buffer
    let encryptedDekBase64: string;
    if (result.ciphertext instanceof Uint8Array) {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else if (typeof result.ciphertext === 'string') {
      encryptedDekBase64 = Buffer.from(result.ciphertext).toString('base64');
    } else {
      throw new Error('Unexpected ciphertext format from KMS');
    }

    console.log("Encrypted DEK SUCCESS");
    return {
      encryptedDekBase64, 
      dek
    };
  }

  async encryptData(plaintext: any) {
    console.log("Encrypting data...");

    if (typeof plaintext !== "string") {
      plaintext = JSON.stringify(plaintext);
    }

    const iv = crypto.randomBytes(16);
    const { dek, encryptedDekBase64 } = await this.encryptDek();
    
    const cipher = crypto.createCipheriv('aes-256-cbc', dek, iv);
    
    const encryptedData = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const ivAndEncryptedData = Buffer.concat([
      iv,
      encryptedData
    ]);

    console.log("Encrypt data success");
    
    return {
      data: ivAndEncryptedData.toString('base64'),
      encryptedDek: encryptedDekBase64
    };
  }

  async decryptDek(encryptedDekBase64: string) {
    console.log("Decrypting DEK...");
    
    const pathKEK = await this.getKEK();
    
    // Convert the base64 string to binary for KMS
    const ciphertext = Buffer.from(encryptedDekBase64, 'base64');
    
    const [result] = await this.client.decrypt({
      name: pathKEK,
      ciphertext: ciphertext
    });

    if (!result || !result.plaintext) {
      throw new Error("Failed to decrypt DEK");
    }

    // Get the DEK as a buffer
    const dek = 
    result.plaintext instanceof Uint8Array 
      ? Buffer.from(result.plaintext) 
      : Buffer.from(result.plaintext, 'base64'); 

    console.log("DEK decryption success");
    
    return { dek };
  }

  async decryptData(encryptedData: string, encryptedDekBase64: string) {
    console.log("Decrypting data...");
    
    try {
      // Decrypt the DEK first
      const { dek } = await this.decryptDek(encryptedDekBase64);

      if (dek.length !== 32) {
        throw new Error(`Invalid DEK length after decryption: ${dek.length}`);
      }

      // Convert base64 back to buffer
      const dataBuffer = Buffer.from(encryptedData, 'base64');
      
      // Extract IV (first 16 bytes) and encrypted content
      const iv = dataBuffer.slice(0, 16);
      const encryptedContent = dataBuffer.slice(16);

      // Create decipher with the original IV and DEK
      const decipher = crypto.createDecipheriv('aes-256-cbc', dek, iv);
      
      // Decrypt the data
      const decryptedData = Buffer.concat([
        decipher.update(encryptedContent),
        decipher.final(),
      ]);

      console.log("Data decryption success");

      try {
        // Try to parse as JSON if possible
        return JSON.parse(decryptedData.toString('utf8'));
      } catch (e) {
        // Return as string if not valid JSON
        return decryptedData.toString('utf8');
      }
    } catch (error) {
      console.error("Error in decryption process:", error);
      throw error;
    }
  }
}