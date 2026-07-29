import type { MeetingChannelForm } from "./meeting-channels-editor";
import type {
  GroupRecord,
  MeetingRecord,
  ProjectRecord,
} from "@/types/app";

export type MeetingForm = {
  projectId: string;
  title: string;
  agenda: string;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  registerLimitMinutes: number;
  allowLateRegistration: boolean;
  channels: [MeetingChannelForm, MeetingChannelForm];
};

export function makeEmptyMeetingForm(
  projects: ProjectRecord[],
  groups: GroupRecord[],
): MeetingForm {
  const activeGroups = groups.filter((group) => group.active);
  return {
    projectId: projects[0]?.id || "",
    title: "",
    agenda: "",
    meetingDate: "",
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    registerLimitMinutes: 20,
    allowLateRegistration: false,
    channels: [
      {
        channelNo: 1,
        mode: "GROUP",
        groupId: activeGroups[0]?.id || "",
        aliasName: activeGroups[0]?.name || "",
      },
      {
        channelNo: 2,
        mode: activeGroups[1] ? "GROUP" : "OPEN",
        groupId: activeGroups[1]?.id || "",
        aliasName: activeGroups[1]?.name || "",
      },
    ],
  };
}
export function meetingRecordToForm(record: MeetingRecord): MeetingForm {
  return {
    projectId: record.projectId,
    title: record.title,
    agenda: record.agenda || "",
    meetingDate: record.meetingDate.slice(0, 10),
    startTime: record.startTime,
    endTime: record.endTime,
    location: record.location,
    registerLimitMinutes: record.registerLimitMinutes,
    allowLateRegistration: record.allowLateRegistration,
    channels: record.channels.map((channel) => ({
      channelNo: channel.channelNo as 1 | 2,
      mode: channel.mode,
      groupId: channel.groupId || "",
      aliasName: channel.aliasName,
    })) as [MeetingChannelForm, MeetingChannelForm],
  };
}
