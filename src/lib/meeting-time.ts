export const REGISTRATION_LIMIT_OPTIONS = [
  5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720,
] as const;

export function timeToMinutes(value: string) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function meetingDurationMinutes(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return 0;
  return end - start;
}

export function allowedRegistrationLimits(
  startTime: string,
  endTime: string,
  currentValue?: number,
) {
  const duration = meetingDurationMinutes(startTime, endTime);
  if (!duration) return [];

  const options = REGISTRATION_LIMIT_OPTIONS.filter((value) => value <= duration);
  if (
    currentValue &&
    currentValue >= 5 &&
    currentValue <= duration &&
    !options.includes(currentValue as (typeof REGISTRATION_LIMIT_OPTIONS)[number])
  ) {
    return [...options, currentValue].sort((left, right) => left - right);
  }
  return [...options];
}

export function clampRegistrationLimit(
  value: number,
  startTime: string,
  endTime: string,
) {
  const options = allowedRegistrationLimits(startTime, endTime);
  if (!options.length) return value;
  return options.filter((option) => option <= value).at(-1) ?? options[0];
}
