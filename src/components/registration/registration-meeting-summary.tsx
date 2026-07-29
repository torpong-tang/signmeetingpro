import { BrandLogo } from "@/components/shared/brand-logo";
import { appPath } from "@/lib/app-path";
import { formatThaiDate } from "@/lib/format";
import type { RegistrationContext } from "@/components/registration/registration-types";

export function RegistrationHeader() {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <BrandLogo priority className="h-14 w-52 sm:h-16 sm:w-72" />
      <p className="text-sm text-slate-400">
        ลงทะเบียนผู้เข้าร่วมประชุม
      </p>
    </div>
  );
}

export function RegistrationMeetingSummary({
  context,
  token,
}: {
  context: RegistrationContext;
  token: string;
}) {
  return (
    <section className="glass-card mb-4 rounded-lg border-emerald-400/35 p-4">
      {context.channel.hasImage && (
        <div className="mb-4 grid min-h-36 w-full place-items-center rounded-lg border border-cyan-400/25 bg-[#061325] p-3 sm:min-h-40">
          <div className="relative h-28 w-full max-w-xl sm:h-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appPath(`/api/public/register/${token}/image`)}
              alt={`รูปประกอบ ${context.channel.organizationName}`}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        </div>
      )}
      <p className="text-sm font-bold text-emerald-300">
        {context.meeting.meetingCode} · {context.meeting.project.code}
      </p>
      <h2 className="mt-1 text-xl font-bold">{context.meeting.title}</h2>
      <p className="text-slate-300">{context.meeting.project.name}</p>
      <p className="mt-2 text-sm text-slate-400">
        {formatThaiDate(context.meeting.meetingDate)} ·{" "}
        {context.meeting.startTime}-{context.meeting.endTime} ·{" "}
        {context.meeting.location}
      </p>
      {context.channel.mode === "GROUP" && (
        <p className="mt-2 font-bold text-cyan-300">
          หน่วยงาน/สังกัด: {context.channel.organizationName}
        </p>
      )}
    </section>
  );
}
