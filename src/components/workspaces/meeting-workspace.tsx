"use client";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import type {
  GroupRecord,
  MeetingRecord,
  ProjectRecord,
} from "@/types/app";
import { MeetingAttendanceDialog } from "./meeting-attendance-dialog";
import { MeetingFormDialog } from "./meeting-form-dialog";
import { MeetingListSection } from "./meeting-list-section";
import { MeetingMediaDialog } from "./meeting-media-dialog";
import { useMeetingWorkspace } from "./use-meeting-workspace";

export function MeetingWorkspace({
  meetings,
  projects,
  groups,
  onChanged,
}: {
  meetings: MeetingRecord[];
  projects: ProjectRecord[];
  groups: GroupRecord[];
  onChanged: () => Promise<void>;
}) {
  const workspace = useMeetingWorkspace({
    meetings,
    projects,
    groups,
    onChanged,
  });

  return (
    <>
      {workspace.loading && (
        <LoadingOverlay label="กำลังประมวลผลการประชุม..." />
      )}
      <MeetingListSection
        meetings={meetings}
        projects={projects}
        search={workspace.search}
        projectFilter={workspace.projectFilter}
        error={workspace.error}
        onSearchChange={workspace.setSearch}
        onProjectFilterChange={workspace.setProjectFilter}
        onCreate={workspace.openCreate}
        onAction={workspace.handleListAction}
      />
      <MeetingFormDialog
        open={workspace.formOpen}
        editing={workspace.editing}
        copying={workspace.copying}
        form={workspace.form}
        projects={projects}
        groups={groups}
        qrImageFiles={workspace.qrImageFiles}
        error={workspace.error}
        onOpenChange={workspace.handleFormOpenChange}
        onFormChange={workspace.setForm}
        onTimeChange={workspace.updateTime}
        onFileChange={workspace.changeQrImageFile}
        onDeleteExistingImage={workspace.requestDeleteQrImage}
        onError={workspace.setError}
        onSubmit={workspace.requestSave}
      />
      <MeetingMediaDialog
        meeting={workspace.mediaMeeting}
        onOpenChange={(open) =>
          !open && workspace.setMediaMeeting(null)
        }
        onChanged={onChanged}
      />
      <MeetingAttendanceDialog
        meeting={workspace.attendanceMeeting}
        onOpenChange={(open) =>
          !open && workspace.setAttendanceMeeting(null)
        }
      />
      <ConfirmActionDialog
        state={workspace.confirm}
        onOpenChange={(open) =>
          workspace.setConfirm((current) => ({
            ...current,
            open,
          }))
        }
        onConfirm={workspace.runPending}
      />
    </>
  );
}
