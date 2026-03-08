import stream from "node:stream";
import process from "node:process";

const filter = () => {
  const getPattern = () => {
    const indexOfPattern = process.argv.indexOf("--pattern");

    if (indexOfPattern !== -1) {
      return process.argv[indexOfPattern + 1];
    }

    return "";
  };

  const pattern = getPattern();

  let rest = "";

  const transformer = new stream.Transform({
    transform(chunk, encoding, callback) {
      const lines = (rest + chunk.toString()).split("\n");

      rest = lines.pop();

      const result = lines.filter((line) => line.includes(pattern)).join("\n");

      callback(null, result ? result + "\n" : "");
    },

    flush(callback) {
      if (rest) {
        this.push(`${rest}\n`);
      }

      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);
};

filter();
