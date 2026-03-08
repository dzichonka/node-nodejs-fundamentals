import { Worker } from "worker_threads";
import os from "os";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const main = async () => {
  try {
    const dataPath = path.join(__dirname, "data.json");
    const fileContent = await fs.readFile(dataPath, "utf-8");
    const numbers = JSON.parse(fileContent);

    if (!Array.isArray(numbers)) {
      throw new Error("data.json must contain an array");
    }

    const numCores = os.cpus().length;

    const chunkSize = Math.ceil(numbers.length / numCores);
    const chunks = [];

    for (let i = 0; i < numCores; i += 1) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, numbers.length);
      if (start < numbers.length) {
        chunks.push(numbers.slice(start, end));
      }
    }

    const workers = [];
    const results = new Array(chunks.length);

    for (let i = 0; i < chunks.length; i += 1) {
      const worker = new Worker(path.join(__dirname, "worker.js"));

      workers.push(
        new Promise((resolve, reject) => {
          worker.on("message", (sortedChunk) => {
            if (sortedChunk && sortedChunk.error) {
              reject(new Error(sortedChunk.error));
            } else {
              results[i] = sortedChunk;
              resolve();
            }
          });

          worker.on("error", reject);

          worker.on("exit", (code) => {
            if (code !== 0) {
              reject(
                new Error(`Worker ${i + 1} stopped with exit code ${code}`),
              );
            }
          });

          worker.postMessage(chunks[i]);
        }),
      );
    }

    await Promise.all(workers);

    const kWayMerge = (sortedChunks) => {
      const result = [];
      const indices = new Array(sortedChunks.length).fill(0);

      while (true) {
        let minValue = Infinity;
        let minIndex = -1;

        for (let i = 0; i < sortedChunks.length; i += 1) {
          if (
            indices[i] < sortedChunks[i].length &&
            sortedChunks[i][indices[i]] < minValue
          ) {
            minValue = sortedChunks[i][indices[i]];
            minIndex = i;
          }
        }

        if (minIndex === -1) break;

        result.push(minValue);
        indices[minIndex]++;
      }
      return result;
    };

    const sortedArray = kWayMerge(results);
    console.log(sortedArray);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

await main();
