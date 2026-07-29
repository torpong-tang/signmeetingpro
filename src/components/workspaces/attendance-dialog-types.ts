import type { AttendanceRecord } from "@/types/app";

export type AttendanceChannel = {
  id: string;
  channelNo: number;
  aliasName: string;
  mode: "GROUP" | "OPEN";
};

export type AttendanceResponse = {
  meeting: {
    id: string;
    meetingCode: string;
    title: string;
    channels: AttendanceChannel[];
  };
  attendances: AttendanceRecord[];
};

export type AttendanceSortKey =
  | "order"
  | "name"
  | "position"
  | "channel"
  | "registeredAt";
