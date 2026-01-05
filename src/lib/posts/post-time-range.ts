import type { PostTimeRange } from "@/lib/api/types";

export const postTimeRangeOptions: { value: PostTimeRange; label: string }[] = [
  { value: "LAST_HOUR", label: "Last hour" },
  { value: "TODAY", label: "Today" },
  { value: "LAST_WEEK", label: "Last week" },
  { value: "LAST_MONTH", label: "Last month" },
  { value: "LAST_YEAR", label: "Last year" },
];
