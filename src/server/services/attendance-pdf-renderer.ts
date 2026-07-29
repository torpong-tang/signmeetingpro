import path from "node:path";
import PDFDocument from "pdfkit";
import {
  ATTENDANCE_PDF_COLUMNS,
  formatAttendanceMeetingDate,
  type Attendance,
  type MeetingAttendance,
} from "./attendance-report-model";

const FONT_REGULAR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "fonts",
  "TH-Sarabun-New-Regular.ttf",
);
const FONT_BOLD = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "fonts",
  "TH-Sarabun-New-Bold.ttf",
);

export function renderPortraitAttendancePdf(
  meeting: MeetingAttendance,
  signatures: Array<Buffer | null>,
) {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 34,
    bufferPages: true,
    font: FONT_REGULAR,
    info: {
      Title: `${meeting.meetingCode} Attendance`,
      Subject: meeting.title,
      Creator: "SignMeetingPro",
    },
  });
  doc.registerFont("th", FONT_REGULAR);
  doc.registerFont("th-bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = doc.page.margins.left;
  const contentWidth =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;
  const pageBottom = doc.page.height - 42;
  const tableWidth = ATTENDANCE_PDF_COLUMNS.reduce(
    (sum, column) => sum + column.width,
    0,
  );
  const tableLeft =
    left + Math.max(0, (contentWidth - tableWidth) / 2);

  function drawMeetingHeader() {
    doc
      .font("th-bold")
      .fontSize(16)
      .fillColor("#0f172a")
      .text(meeting.project.name, left, doc.y, {
        width: contentWidth,
        align: "center",
      });
    doc.moveDown(0.15);
    doc
      .font("th-bold")
      .fontSize(13)
      .text(meeting.title, left, doc.y, {
        width: contentWidth,
        align: "center",
      });
    if (meeting.agenda) {
      doc.moveDown(0.1);
      doc.font("th").fontSize(10).text(
        meeting.agenda,
        left,
        doc.y,
        {
          width: contentWidth,
          align: "center",
        },
      );
    }
    doc.moveDown(0.2);
    doc
      .font("th")
      .fontSize(10)
      .text(
        `${formatAttendanceMeetingDate(meeting.meetingDate)} เวลา ${meeting.startTime}-${meeting.endTime} น.`,
        left,
        doc.y,
        { width: contentWidth, align: "center" },
      );
    doc.text(`ณ ${meeting.location}`, left, doc.y, {
      width: contentWidth,
      align: "center",
    });
    doc
      .font("th-bold")
      .fontSize(10)
      .fillColor("#0e7490")
      .text(
        `จำนวนผู้เข้าประชุมทั้งหมด ${meeting.attendances.length} คน`,
        left,
        doc.y + 3,
        { width: contentWidth, align: "center" },
      );
    doc.moveDown(0.7);
  }

  function drawTableRow(
    attendance: Attendance | null,
    signature: Buffer | null,
    displayNumber?: number,
    header = false,
    skipPageCheck = false,
  ) {
    const rowHeight = header ? 30 : 40;
    if (!skipPageCheck && doc.y + rowHeight > pageBottom) {
      doc.addPage();
      drawMeetingHeader();
      drawTableRow(null, null, undefined, true, true);
    }

    const y = doc.y;
    let x = tableLeft;
    const values = attendance
      ? [
          String(displayNumber ?? attendance.personNo),
          `${attendance.firstNameSnapshot} ${attendance.lastNameSnapshot}`,
          `${attendance.positionSnapshot || "-"}\n${attendance.departmentSnapshot || "-"}`,
          `${attendance.phoneSnapshot || "-"}\n(${attendance.emailSnapshot || "-"})`,
          "",
        ]
      : ATTENDANCE_PDF_COLUMNS.map((column) => column.label);

    ATTENDANCE_PDF_COLUMNS.forEach((column, index) => {
      if (header) {
        doc
          .save()
          .rect(x, y, column.width, rowHeight)
          .fill("#0e7490")
          .restore();
      }
      doc
        .rect(x, y, column.width, rowHeight)
        .strokeColor("#94a3b8")
        .lineWidth(0.5)
        .stroke();

      let signatureRendered = false;
      if (!header && column.key === "signature" && signature) {
        try {
          doc.image(signature, x + 8, y + 5, {
            fit: [column.width - 16, rowHeight - 10],
            align: "center",
            valign: "center",
          });
          signatureRendered = true;
        } catch {
          // Damaged legacy signatures must not block the report.
        }
      }
      if (!signatureRendered) {
        const text =
          values[index] ||
          (!header && column.key === "signature" ? "-" : "");
        const fontSize =
          header ? 9 : column.key === "contact" ? 7.5 : 8;
        doc.font(header ? "th-bold" : "th").fontSize(fontSize);
        const textHeight = Math.min(
          doc.heightOfString(text || " ", {
            width: column.width - 8,
          }),
          rowHeight - 8,
        );
        doc
          .fillColor(header ? "#ffffff" : "#0f172a")
          .text(
            text,
            x + 4,
            y + (rowHeight - textHeight) / 2,
            {
              width: column.width - 8,
              height: rowHeight - 8,
              align: column.align,
              ellipsis: true,
            },
          );
      }
      x += column.width;
    });
    doc.x = tableLeft;
    doc.y = y + rowHeight;
  }

  function drawOrganizerRow() {
    const rowHeight = 40;
    if (doc.y + rowHeight > pageBottom) {
      doc.addPage();
      drawMeetingHeader();
      drawTableRow(null, null, undefined, true, true);
    }

    const y = doc.y;
    const organizerName =
      `${meeting.organizer.firstName} ${meeting.organizer.lastName}`.trim();
    const organizerContact =
      `โทรศัพท์: ${meeting.organizer.phone || "-"}   ` +
      `E-mail: ${meeting.organizer.email || "-"}`;
    doc
      .save()
      .rect(tableLeft, y, tableWidth, rowHeight)
      .fill("#e0f2fe")
      .restore();
    doc
      .rect(tableLeft, y, tableWidth, rowHeight)
      .strokeColor("#94a3b8")
      .lineWidth(0.5)
      .stroke();
    doc
      .font("th-bold")
      .fontSize(9)
      .fillColor("#0f172a")
      .text(
        `ผู้จัดการประชุม: ${organizerName}`,
        tableLeft + 8,
        y + 6,
        { width: tableWidth - 16, align: "right" },
      );
    doc
      .font("th")
      .fontSize(8)
      .fillColor("#334155")
      .text(organizerContact, tableLeft + 8, y + 21, {
        width: tableWidth - 16,
        align: "right",
      });
    doc.x = tableLeft;
    doc.y = y + rowHeight;
  }

  drawMeetingHeader();
  drawTableRow(null, null, undefined, true);

  meeting.attendances.forEach((attendance, index) => {
    drawTableRow(attendance, signatures[index], index + 1);
  });

  if (meeting.attendances.length === 0) {
    doc
      .font("th")
      .fontSize(10)
      .fillColor("#64748b")
      .text("ยังไม่มีผู้ลงทะเบียน", tableLeft, doc.y + 10, {
        width: tableWidth,
        align: "center",
      });
  }

  drawOrganizerRow();

  const pageRange = doc.bufferedPageRange();
  for (
    let index = pageRange.start;
    index < pageRange.start + pageRange.count;
    index += 1
  ) {
    doc.switchToPage(index);
    doc.page.margins.bottom = 0;
    doc
      .font("th")
      .fontSize(9)
      .fillColor("#334155")
      .text(
        `หน้า ${index - pageRange.start + 1} / ${pageRange.count}`,
        left,
        doc.page.height - 28,
        { width: contentWidth, align: "right" },
      );
  }

  doc.end();
  return completed;
}
