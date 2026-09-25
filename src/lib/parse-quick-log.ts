export type QuickLog = {
  weight: number | null;
  reps: number | null;
  durationMin?: number | null;
};

const WORD: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

function wordsToNumber(text: string): string {
  const parts = text.toLowerCase().split(/\s+/);
  const out: string[] = [];
  const nums: number[] = [];
  const flushNums = () => {
    if (!nums.length) return;
    let n = 0;
    if (nums.length === 3 && nums[0] < 10 && nums[1] >= 20 && nums[2] < 10) {
      n = nums[0] * 100 + nums[1] + nums[2];
    } else if (nums.length === 2 && nums[0] < 10 && nums[1] >= 20) {
      n = nums[0] * 100 + nums[1];
    } else {
      n = nums.reduce((a, b) => a + b, 0);
    }
    out.push(String(n));
    nums.length = 0;
  };
  for (const raw of parts) {
    if (!(raw in WORD)) {
      flushNums();
      out.push(raw);
      continue;
    }
    const val = WORD[raw];
    if (val === 100) {
      const last = nums.pop() ?? 1;
      nums.push(last * 100);
      continue;
    }
    nums.push(val);
  }
  flushNums();
  return out.join(" ");
}

export function parseQuickLog(input: string): QuickLog | null {
  let raw = wordsToNumber(String(input ?? "").toLowerCase());
  raw = raw
    .replace(/[×x]/g, " x ")
    .replace(/pounds?|lbs?|kilos?|kilograms?|#/g, " ")
    .replace(/reps?/g, " ")
    .replace(/minutes?|mins?/g, " min ")
    .replace(/bodyweight|body weight/g, " bw ")
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return null;

  const min = raw.match(/(\d+(?:\.\d+)?)\s*min/);
  if (min && !/\d+\s*(?:x|for|at)\s*\d/.test(raw)) {
    return { weight: null, reps: null, durationMin: Number(min[1]) };
  }

  const bw = raw.match(/\bbw\b.*?(\d{1,3})\b/) || raw.match(/(\d{1,3}).*?\bbw\b/);
  if (bw) return { weight: 0, reps: Number(bw[1]) };

  const forM = raw.match(/(\d+(?:\.\d+)?)\s+for\s+(\d{1,3})\b/);
  if (forM) return { weight: Number(forM[1]), reps: Number(forM[2]) };

  const atM = raw.match(/(\d+(?:\.\d+)?)\s+at\s+(\d+(?:\.\d+)?)/);
  if (atM) {
    const a = Number(atM[1]);
    const b = Number(atM[2]);
    if (a <= 40 && b >= 45) return { weight: b, reps: a };
    return { weight: a, reps: b };
  }

  const x = raw.match(/(\d+(?:\.\d+)?)\s*x\s*(\d{1,3})\b/);
  if (x) return { weight: Number(x[1]), reps: Number(x[2]) };

  const two = raw.match(/(\d+(?:\.\d+)?)\s+(\d{1,3})\b/);
  if (two) {
    const a = Number(two[1]);
    const b = Number(two[2]);
    if (a <= 40 && b >= 45) return { weight: b, reps: a };
    return { weight: a, reps: b };
  }

  return null;
}
