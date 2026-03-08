import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";

const sourceDir = path.join("workspace", "toCompress");
const outputDir = path.join("workspace", "compressed");
const archivePath = path.join(outputDir, "archive.br");

async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function compressDir() {
  try {
    await fs.access(sourceDir);
  } catch (error) {
    throw new Error("FS operation failed");
  }

  await fs.mkdir(outputDir, { recursive: true });

  const files = await getFiles(sourceDir);

  const archiveFormatter = new Transform({
    objectMode: true,
    transform(filePath, encoding, callback) {
      const relativePath = path.relative(sourceDir, filePath);
      const header = Buffer.from(`${relativePath}\n`);

      const fileStream = fsSync.createReadStream(filePath);
      const chunks = [];

      fileStream.on("data", (chunk) => chunks.push(chunk));
      fileStream.on("end", () => {
        const content = Buffer.concat(chunks);
        const contentLength = Buffer.alloc(4);
        contentLength.writeUInt32BE(content.length, 0);

        const entry = Buffer.concat([header, contentLength, content]);

        callback(null, entry);
      });
      fileStream.on("error", callback);
    },
  });

  const fileStream = Readable.from(files);

  const writeStream = fsSync.createWriteStream(archivePath);
  const brotliStream = zlib.createBrotliCompress();

  try {
    await pipeline(fileStream, archiveFormatter, brotliStream, writeStream);
  } catch (error) {
    throw new Error("FS operation failed");
  }
}
compressDir();
