import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

const __dirname = "./";
const archivePath = path.join(
  __dirname,
  "workspace",
  "compressed",
  "archive.br",
);
const outputDir = path.join(__dirname, "workspace", "decompressed");

export async function decompressDir() {
  try {
    await fs.access(archivePath);
  } catch (error) {
    throw new Error("FS operation failed");
  }

  await fs.mkdir(outputDir, { recursive: true });

  const readStream = fsSync.createReadStream(archivePath);
  const brotliStream = zlib.createBrotliDecompress();

  const archiveParser = new Transform({
    readableObjectMode: true,
    writableHighWaterMark: 16 * 1024,
    transform(chunk, encoding, callback) {
      if (!this.buffer) {
        this.buffer = Buffer.alloc(0);
      }

      this.buffer = Buffer.concat([this.buffer, chunk]);

      while (this.buffer.length > 0) {
        const newlineIndex = this.buffer.indexOf(10);
        if (newlineIndex === -1) break;

        const filePath = this.buffer.subarray(0, newlineIndex).toString();

        if (this.buffer.length < newlineIndex + 1 + 4) break;

        const contentLength = this.buffer.readUInt32BE(newlineIndex + 1);

        const totalNeeded = newlineIndex + 1 + 4 + contentLength;
        if (this.buffer.length < totalNeeded) break;

        const content = this.buffer.subarray(newlineIndex + 1 + 4, totalNeeded);

        this.push({
          path: filePath,
          content: content,
        });

        this.buffer = this.buffer.subarray(totalNeeded);
      }

      callback();
    },

    flush(callback) {
      if (this.buffer && this.buffer.length > 0) {
        callback(new Error("Incomplete archive entry"));
      } else {
        callback();
      }
    },
  });

  try {
    const filePromises = [];

    const fileWriter = new Transform({
      objectMode: true,
      transform(fileData, encoding, callback) {
        const fullPath = path.join(outputDir, fileData.path);
        const dirPath = path.dirname(fullPath);

        const promise = fs
          .mkdir(dirPath, { recursive: true })
          .then(() => fs.writeFile(fullPath, fileData.content))
          .catch((error) => {
            throw new Error("FS operation failed");
          });

        filePromises.push(promise);
        callback();
      },

      flush(callback) {
        Promise.all(filePromises)
          .then(() => callback())
          .catch(callback);
      },
    });

    await pipeline(readStream, brotliStream, archiveParser, fileWriter);
  } catch (error) {
    throw new Error("FS operation failed");
  }
}
decompressDir();
