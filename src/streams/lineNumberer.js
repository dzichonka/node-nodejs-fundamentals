import stream from "node:stream";
import process from "node:process";

const lineNumberer = () => {
  let rest = "";

  const transformer = new stream.Transform({
    transform(chunk, encoding, callback) {
      const lines = (rest + chunk.toString()).split("\n");

      rest = lines.pop();

      const result = lines.map((line) => `| ${line}`).join("\n");

      callback(null, result + "\n");
    },

    flush(callback) {
      if (rest) {
        this.push(`| ${rest}\n`);
      }

      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);
};

lineNumberer();
