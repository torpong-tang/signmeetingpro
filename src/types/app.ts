export type UserSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MEETING_MANAGER";
  avatarPath: string | null;
};

export type ProjectRecord = {
  id: string;
  code: string;
  name: string;
  contractNumber: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { meetings: number; members: number };
};

export type ParticipantRecord = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
};

export type GroupRecord = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  participants: ParticipantRecord[];
  _count: { participants: number };
};

export type MeetingChannel = {
  id: string;
  channelNo: number;
  mode: "GROUP" | "OPEN";
  groupId: string | null;
  aliasName: string;
  hasImage: boolean;
  token: string;
  group: { id: string; name: string } | null;
};

export type MeetingRecord = {
  id: string;
  meetingCode: string;
  projectId: string;
  title: string;
  agenda: string | null;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  registerLimitMinutes: number;
  allowLateRegistration: boolean;
  createdAt: string;
  project: { id: string; code: string; name: string };
  organizer: { id: string; firstName: string; lastName: string; email: string };
  channels: MeetingChannel[];
  _count: { attendances: number; media: number };
};

export type MeetingMediaRecord = {
  id: string;
  meetingId: string;
  kind: "PICTURE" | "DOCUMENT";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  createdAt: string;
};

export type AttendanceRecord = {
  id: string;
  meetingId: string;
  personNo: number;
  displayOrder: number;
  firstNameSnapshot: string;
  lastNameSnapshot: string;
  positionSnapshot: string;
  departmentSnapshot: string | null;
  phoneSnapshot: string | null;
  emailSnapshot: string | null;
  signaturePath: string | null;
  registeredAt: string;
  channel: {
    id: string;
    channelNo: number;
    aliasName: string;
  };
};

export type DashboardStats = {
  projects: { count: number; latestAt: string | null };
  meetings: { count: number; latestAt: string | null };
  attendance: { count: number; latestAt: string | null };
  pictures: { count: number; bytes: number; latestAt: string | null };
  documents: { count: number; bytes: number; latestAt: string | null };
};

export type BootstrapData = {
  user: UserSummary;
  projects: ProjectRecord[];
  meetings: MeetingRecord[];
  groups: GroupRecord[];
  dashboard: DashboardStats;
};

export type ManagerRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "ADMIN" | "MEETING_MANAGER";
  active: boolean;
  createdAt: string;
  projects: Array<{ projectId: string; project: { code: string; name: string } }>;
};
