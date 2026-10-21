const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

let timer: ReturnType<typeof setInterval> | null = null;

export const clearLine = (): void => {
  process.stdout.write("\r\x1b[K");
};

export const startSpin = (label: string = "Thinking .."): void => {
  let i = 0;

  timer = setInterval(() => {
    process.stdout.write(`\r${FRAMES[i++ % FRAMES.length]} ${label}`);
  }, 100);
};

export const stopSpin = (): void => {
  if (timer) {
    clearInterval(timer);
  }

  timer = null;

  clearLine();
};
