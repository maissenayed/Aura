import * as fs from 'fs/promises';
import * as path from 'path';

export class JsonFileRepository<T> {
  private readonly filePath: string;

  constructor(filename: string, defaultData: T) {
    const storageDir = path.join(__dirname, '..', 'storage');
    this.filePath = path.join(storageDir, filename);
    this.ensureStorageExists(defaultData);
  }

  private async ensureStorageExists(defaultData: T): Promise<void> {
    try {
      const storageDir = path.dirname(this.filePath);
      await fs.mkdir(storageDir, { recursive: true });
      try {
        await fs.access(this.filePath);
      } catch {
        await this.write(defaultData);
      }
    } catch (err) {
      console.error(`Error ensuring storage exists for ${this.filePath}`, err);
    }
  }

  async read(): Promise<T> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(`Error reading ${this.filePath}`, err);
      throw err;
    }
  }

  async write(data: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(this.filePath, jsonString, 'utf-8');
    } catch (err) {
      console.error(`Error writing ${this.filePath}`, err);
      throw err;
    }
  }
}
