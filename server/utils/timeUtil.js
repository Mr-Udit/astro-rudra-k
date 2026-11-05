export const SLOT_DURATION_MINUTES = 120;

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getDayName = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return DAY_NAMES[d.getUTCDay()];
};

export const timeToMinutes = (time) => {
  // Fast-path validation without regex backtracking
  if (
    typeof time !== "string" ||
    time.length !== 5 ||
    time.charCodeAt(2) !== 58
  ) {
    throw new Error("Invalid time format. Expected HH:mm");
  }

  const h =
    (time.charCodeAt(0) - 48) * 10 +
    (time.charCodeAt(1) - 48);

  const m =
    (time.charCodeAt(3) - 48) * 10 +
    (time.charCodeAt(4) - 48);

  if (
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new Error("Invalid time value");
  }

  return h * 60 + m;
};
