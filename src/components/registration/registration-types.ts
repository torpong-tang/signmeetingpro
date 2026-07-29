export type RegistrationParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
};

export type RegistrationContext = {
  channel: {
    id: string;
    channelNo: number;
    mode: "GROUP" | "OPEN";
    organizationName: string;
    hasImage: boolean;
    group: null | {
      id: string;
      name: string;
      participants: RegistrationParticipant[];
    };
  };
  meeting: {
    meetingCode: string;
    title: string;
    agenda: string | null;
    meetingDate: string;
    startTime: string;
    endTime: string;
    location: string;
    project: { code: string; name: string };
  };
  isOpen: boolean;
  deadline: string;
};

export type SubmitMode = "close" | "continue";

export type ConfirmIntent =
  | "save-close"
  | "save-continue"
  | "clear-signature"
  | "close-page";

export type RegistrationFormState = {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  signatureDataUrl: string;
};

export type RegistrationSuccess = {
  personNo: number;
  meetingCode: string;
  mode: SubmitMode;
};

export const EMPTY_REGISTRATION_FORM: RegistrationFormState = {
  firstName: "",
  lastName: "",
  position: "",
  department: "",
  phone: "",
  email: "",
  signatureDataUrl: "",
};
