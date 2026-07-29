"use client";

import { useEffect, useMemo, useState } from "react";
import { apiMutation } from "@/hooks/use-bootstrap";
import { appPath } from "@/lib/app-path";
import type { MeetingRecord } from "@/types/app";
import type { AttendanceResponse } from "./attendance-dialog-types";
import { orderedChannelAttendances } from "./attendance-dialog-utils";

export function useMeetingAttendance(meeting: MeetingRecord | null) {
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!meeting) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setData(null);
      setLoading(true);
      setError("");
      fetch(appPath(`/api/meetings/${meeting.id}/attendance`), {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(
              result.error || "โหลดรายชื่อผู้ลงทะเบียนไม่สำเร็จ",
            );
          }
          setData(result);
        })
        .catch((caught) => {
          if (
            caught instanceof DOMException &&
            caught.name === "AbortError"
          ) {
            return;
          }
          setError(
            caught instanceof Error
              ? caught.message
              : "โหลดรายชื่อผู้ลงทะเบียนไม่สำเร็จ",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [meeting]);

  const channels = useMemo(
    () =>
      [...(data?.meeting.channels || [])].sort(
        (left, right) => right.channelNo - left.channelNo,
      ),
    [data],
  );

  function exportPortraitPdf() {
    if (!meeting) return;
    window.open(
      appPath(`/api/meetings/${meeting.id}/attendance/pdf`),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function moveAttendance(
    channelId: string,
    attendanceId: string,
    direction: -1 | 1,
  ) {
    if (!meeting || !data) return;
    const channelAttendances = orderedChannelAttendances(
      data.attendances,
      channelId,
    );
    const currentIndex = channelAttendances.findIndex(
      (attendance) => attendance.id === attendanceId,
    );
    const nextIndex = currentIndex + direction;
    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= channelAttendances.length
    ) {
      return;
    }

    const reordered = [...channelAttendances];
    [reordered[currentIndex], reordered[nextIndex]] = [
      reordered[nextIndex],
      reordered[currentIndex],
    ];

    setReordering(true);
    setError("");
    try {
      const result = (await apiMutation(
        `/api/meetings/${meeting.id}/attendance`,
        "PATCH",
        {
          channelId,
          orderedAttendanceIds: reordered.map(
            (attendance) => attendance.id,
          ),
        },
      )) as AttendanceResponse;
      setData(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "บันทึกลำดับรายชื่อไม่สำเร็จ",
      );
    } finally {
      setReordering(false);
    }
  }

  return {
    data,
    loading,
    reordering,
    error,
    channels,
    exportPortraitPdf,
    moveAttendance,
  };
}
