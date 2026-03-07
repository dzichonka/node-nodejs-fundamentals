import { argv } from "node:process";

const parseArgs = () => {
  const args = {};

  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i++;
    }
  }

  return {
    duration: Number(args.duration) || 5000,
    interval: Number(args.interval) || 100,
    length: Number(args.length) || 30,
    color: args.color || null,
  };
};

const hexToAnsi = (hex) => {
  const valid = /^#[0-9A-Fa-f]{6}$/;

  if (!valid.test(hex)) return null;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `\x1b[38;2;${r};${g};${b}m`;
};

const progress = () => {
  const { duration, interval, length, color } = parseArgs();

  const totalTicks = Math.ceil(duration / interval);
  let tick = 0;

  const ansiColor = color ? hexToAnsi(color) : null;

  const timer = setInterval(() => {
    tick++;

    const progress = tick / totalTicks;
    const percent = Math.min(100, Math.floor(progress * 100));

    const filledLength = Math.round(length * progress);
    const emptyLength = length - filledLength;

    let filled = "█".repeat(filledLength);
    const empty = " ".repeat(emptyLength);

    if (ansiColor) {
      filled = `${ansiColor}${filled}\x1b[0m`;
    }

    const bar = `[${filled}${empty}] ${percent}%`;

    process.stdout.write(`\r${bar}`);

    if (tick >= totalTicks) {
      clearInterval(timer);
      process.stdout.write("\nDone!\n");
    }
  }, interval);
};

progress();
