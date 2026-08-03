import type { AppLocale } from "@/lib/ui-preferences";

type Translation = {
  th: string;
  en: string;
};

export const UI_TERMINOLOGY = [
  { key: "project", th: "โครงการ", en: "Project" },
  { key: "meeting", th: "การประชุม", en: "Meeting" },
  { key: "meetings", th: "รายการการประชุม", en: "Meetings" },
  { key: "meetingWorkspace", th: "พื้นที่จัดการประชุม", en: "Meeting workspace" },
  { key: "registrants", th: "ผู้ลงทะเบียน", en: "Registrants" },
  { key: "participantGroup", th: "กลุ่มผู้เข้าร่วม", en: "Participant group" },
  { key: "organization", th: "หน่วยงาน/สังกัด", en: "Organization / affiliation" },
  { key: "actions", th: "จัดการ", en: "Actions" },
  { key: "save", th: "บันทึก", en: "Save" },
  { key: "edit", th: "แก้ไข", en: "Edit" },
  { key: "delete", th: "ลบ", en: "Delete" },
  { key: "cancel", th: "ยกเลิก", en: "Cancel" },
  { key: "close", th: "ปิด", en: "Close" },
] as const;

const translations: Translation[] = [
  { th: "กลับ Dashboard", en: "Back to Dashboard" },
  { th: "พื้นที่จัดการประชุม", en: "Meeting workspace" },
  { th: "รายการการประชุม", en: "Meetings" },
  { th: "แสดงเฉพาะโครงการที่บัญชีนี้ได้รับสิทธิ์", en: "Only projects assigned to this account are shown" },
  { th: "ทุกโครงการ", en: "All projects" },
  { th: "Live Search รหัส หัวข้อ โครงการ หรือสถานที่...", en: "Live Search code, title, project, or location..." },
  { th: "สร้างการประชุม", en: "Create meeting" },
  { th: "สร้างการประชุมใหม่", en: "Create new meeting" },
  { th: "จัดการ", en: "Actions" },
  { th: "รหัส", en: "Code" },
  { th: "สร้างเมื่อ", en: "Created" },
  { th: "ผู้ลงทะเบียน", en: "Registrants" },
  { th: "การประชุม", en: "Meeting" },
  { th: "โครงการ", en: "Project" },
  { th: "ผู้จัด", en: "Organizer" },
  { th: "สถานที่", en: "Location" },
  { th: "รีเฟรช", en: "Refresh" },
  { th: "กำลังโหลดรายการการประชุม...", en: "Loading meetings..." },
  { th: "กำลังอัปเดตข้อมูล...", en: "Updating data..." },
  { th: "โหลดรายการการประชุมไม่สำเร็จ", en: "Unable to load meetings" },
  { th: "ลองใหม่", en: "Try again" },
  { th: "กำลังโหลดพื้นที่จัดการประชุม...", en: "Loading meeting workspace..." },
  { th: "สร้างซ้ำ", en: "Duplicate" },
  { th: "ลบ", en: "Delete" },
  { th: "แก้ไข", en: "Edit" },
  { th: "ไฟล์ประกอบ", en: "Attachments" },
  { th: "เปิดรายชื่อผู้ลงทะเบียน", en: "Open registrants" },
  { th: "สร้างการประชุมซ้ำ", en: "Duplicate meeting" },
  { th: "ยืนยันการสร้างการประชุม", en: "Confirm meeting creation" },
  { th: "ยืนยันการแก้ไขการประชุม", en: "Confirm meeting changes" },
  { th: "ยืนยันการลบการประชุม", en: "Confirm meeting deletion" },
  { th: "ยืนยันการเก็บถาวร", en: "Confirm archive" },
  { th: "สร้างการประชุม", en: "Create meeting" },
  { th: "บันทึกการแก้ไข", en: "Save changes" },
  { th: "เก็บถาวร", en: "Archive" },
  { th: "กรุณากรอกข้อมูลบังคับและเลือกกลุ่มสำหรับ QR ช่องที่ 1", en: "Complete all required fields and select a group for QR Channel 1." },
  { th: "QR Channel 1 และ QR Channel 2 ต้องเลือกกลุ่มผู้เข้าร่วมคนละกลุ่ม", en: "QR Channel 1 and QR Channel 2 must use different participant groups." },
  { th: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม", en: "End time must be later than start time." },
  { th: "บันทึกไม่สำเร็จ", en: "Unable to save" },
  { th: "ลบไม่สำเร็จ", en: "Unable to delete" },
  { th: "โครงการ *", en: "Project *" },
  { th: "หัวข้อการประชุม *", en: "Meeting title *" },
  { th: "หัวข้อการประชุม", en: "Meeting title" },
  { th: "วันที่ *", en: "Date *" },
  { th: "วันที่", en: "Date" },
  { th: "เวลาเริ่ม *", en: "Start time *" },
  { th: "เวลาเริ่ม", en: "Start time" },
  { th: "เวลาสิ้นสุด *", en: "End time *" },
  { th: "เวลาสิ้นสุด", en: "End time" },
  { th: "สถานที่ *", en: "Location *" },
  { th: "เลือกโครงการ", en: "Select project" },
  { th: "เลือกวันที่ประชุม", en: "Select meeting date" },
  { th: "เวลาลงทะเบียน (นาที)", en: "Registration window (minutes)" },
  { th: "กำหนดช่วงเวลาก่อน", en: "Set a valid time range first" },
  { th: "วาระ/รายละเอียด", en: "Agenda / details" },
  { th: "อนุญาตลงทะเบียนเกินเวลา", en: "Allow late registration" },
  { th: "รหัสการประชุมจะถูกสร้างหลังบันทึกฐานข้อมูลสำเร็จ", en: "The meeting code is generated after the record is saved successfully." },
  { th: "สร้างการประชุมซ้ำภายในโครงการเดิม โดยกำหนดวันที่และเวลาใหม่", en: "Duplicate this meeting in the same project with a new date and time." },
  { th: "มีผู้ลงทะเบียนแล้ว ระบบอนุญาตให้แก้เฉพาะข้อกำหนดเวลาลงทะเบียน", en: "This meeting already has registrants. Only registration timing settings can be changed." },
  { th: "ล็อกตามโครงการของการประชุมต้นฉบับ", en: "Locked to the original meeting project" },
  { th: "การสร้างซ้ำต้องใช้โครงการเดียวกับรายการต้นฉบับ", en: "A duplicated meeting must remain in the original project." },
  { th: "รูปแบบการลงทะเบียน", en: "Registration mode" },
  { th: "ระบุกลุ่ม", en: "Named group" },
  { th: "กรอกข้อมูลเอง", en: "Enter information manually" },
  { th: "กลุ่มผู้เข้าร่วม *", en: "Participant group *" },
  { th: "กลุ่มผู้เข้าร่วม", en: "Participant group" },
  { th: "เลือกกลุ่ม", en: "Select group" },
  { th: "ชื่อหน่วยงาน/สังกัด *", en: "Organization / affiliation name *" },
  { th: "ชื่อหน่วยงาน/สังกัด", en: "Organization / affiliation name" },
  { th: "เลือกกลุ่มผู้เข้าร่วมก่อน", en: "Select a participant group first" },
  { th: "ระบุชื่อหน่วยงาน/สังกัด", en: "Enter organization / affiliation" },
  { th: "ใช้เป็นหน่วยงาน/สังกัดของผู้ลงทะเบียนผ่าน QR Channel นี้", en: "Used as the organization / affiliation for this QR Channel." },
  { th: "ผู้ลงทะเบียนแบบ OPEN จะกรอกชื่อหน่วยงาน/สังกัดด้วยตนเองในหน้าลงทะเบียน", en: "Open-registration participants enter their organization / affiliation on the registration page." },
  { th: "รูปประกอบ QR Code ตาม Channel", en: "QR Channel images" },
  { th: "รองรับ JPG, PNG และ WebP สูงสุด 2 MB ต่อ Channel", en: "JPG, PNG, and WebP up to 2 MB per channel" },
  { th: "รองรับ JPG, PNG และ WebP สูงสุด 2 MB ต่อ Channel รูปจะแสดงร่วมกับ QR Code และหน้าลงทะเบียน", en: "JPG, PNG, and WebP up to 2 MB per channel. Images appear with QR Codes and on registration pages." },
  { th: "รูปจะแสดงร่วมกับ QR Code และหน้าลงทะเบียน", en: "The image appears with the QR Code and on the registration page." },
  { th: "ยังไม่ระบุหน่วยงาน/สังกัด", en: "Organization / affiliation not specified" },
  { th: "ยังไม่มีรูปประกอบ", en: "No image yet" },
  { th: "เลือกรูป", en: "Choose image" },
  { th: "เปลี่ยนรูป", en: "Replace image" },
  { th: "ยกเลิกรูปที่เลือก", en: "Cancel selected image" },
  { th: "ลบรูปเดิม", en: "Delete current image" },
  { th: "รูปประกอบ QR ต้องเป็น JPG, PNG หรือ WebP และมีขนาดไม่เกิน 2 MB", en: "QR images must be JPG, PNG, or WebP and no larger than 2 MB." },
  { th: "ยืนยันการลบรูป", en: "Confirm image deletion" },
  { th: "ลบรูป", en: "Delete image" },
  { th: "QR Code สำหรับลงทะเบียน", en: "Registration QR Codes" },
  { th: "ช่องทางการลงทะเบียน", en: "Registration channels" },
  { th: "เปิดหน้าลงทะเบียน", en: "Open registration page" },
  { th: "Copy QR Code ทั้งหมด", en: "Copy all QR Codes" },
  { th: "คัดลอกรูป QR Code พร้อมรายละเอียดแล้ว", en: "QR Code image with meeting details copied." },
  { th: "Browser ไม่รองรับการคัดลอกรูป จึงดาวน์โหลด PNG แทน", en: "This browser cannot copy images, so a PNG was downloaded instead." },
  { th: "ไม่สามารถสร้างรูป QR Code ได้", en: "Unable to generate QR Code image." },
  { th: "ไม่มีรูปประกอบ", en: "No image" },
  { th: "รูปประกอบ", en: "Illustration" },
  { th: "สแกน QR Code เพื่อลงทะเบียน", en: "Scan the QR Code to register" },
  { th: "ลงทะเบียนแบบ OPEN", en: "Open registration" },
  { th: "กรอกข้อมูลและหน่วยงาน/สังกัดด้วยตนเอง", en: "Enter personal and organization details manually" },
  { th: "ผู้ลงทะเบียนกรอกข้อมูลและหน่วยงาน/สังกัดด้วยตนเอง", en: "Participants enter their personal and organization details manually" },
  { th: "ผู้ลงทะเบียน", en: "Registrants" },
  { th: "กำลังโหลดรายชื่อ...", en: "Loading registrants..." },
  { th: "กำลังบันทึกลำดับรายชื่อสำหรับ PDF...", en: "Saving PDF list order..." },
  { th: "พบผู้ลงทะเบียนทั้งหมด", en: "Total registrants" },
  { th: "คน", en: "people" },
  { th: "จัดลำดับ PDF", en: "PDF order" },
  { th: "ลำดับ", en: "No." },
  { th: "ชื่อ-นามสกุล", en: "Full name" },
  { th: "ตำแหน่ง / หน่วยงาน", en: "Position / organization" },
  { th: "หน่วยงาน/สังกัด", en: "Organization / affiliation" },
  { th: "หน่วยงาน", en: "Organization" },
  { th: "ลงทะเบียนเมื่อ", en: "Registered at" },
  { th: "เลื่อนขึ้น", en: "Move up" },
  { th: "เลื่อนลง", en: "Move down" },
  { th: "ยังไม่มีผู้ลงทะเบียนผ่าน QR Channel", en: "No registrants from QR Channel" },
  { th: "แก้ไขผู้ลงทะเบียน", en: "Edit registrant" },
  { th: "ลบผู้ลงทะเบียน", en: "Delete registrant" },
  { th: "ยืนยันการแก้ไขผู้ลงทะเบียน", en: "Confirm registrant changes" },
  { th: "ยืนยันการลบผู้ลงทะเบียน", en: "Confirm registrant deletion" },
  { th: "กำลังบันทึกข้อมูลผู้ลงทะเบียน...", en: "Saving registrant data..." },
  { th: "แก้ไขเฉพาะข้อมูลที่ใช้แสดงและออกรายงาน โดยไม่เปลี่ยน QR Channel เลขลำดับ หรือเวลาลงทะเบียน", en: "Edit display and report fields without changing the QR Channel, registration number, or registration time." },
  { th: "กำหนดอัตโนมัติตามชื่อหน่วยงาน/สังกัดของ QR Channel", en: "Automatically set from the QR Channel organization / affiliation." },
  { th: "ลายเซ็นเดิม, การประชุม, QR Channel, ลำดับ PDF และเวลาลงทะเบียนจะไม่ถูกแก้ไข", en: "The existing signature, meeting, QR Channel, PDF order, and registration time remain unchanged." },
  { th: "Export PDF", en: "Export PDF" },
  { th: "ไฟล์รวมต่อการประชุมต้องไม่เกิน 20 MB", en: "Total attachments per meeting must not exceed 20 MB." },
  { th: "รูปภาพที่แนบ", en: "Attached images" },
  { th: "เอกสารที่แนบ", en: "Attached documents" },
  { th: "รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 2 MB ต่อไฟล์", en: "JPG, PNG, and WebP up to 2 MB per file" },
  { th: "รองรับ PDF, Word, Excel และ PowerPoint", en: "PDF, Word, Excel, and PowerPoint are supported" },
  { th: "อัปโหลดรูปภาพ", en: "Upload image" },
  { th: "อัปโหลดเอกสาร", en: "Upload document" },
  { th: "เลือกเอกสาร", en: "Choose document" },
  { th: "ยังไม่มีรูปภาพ", en: "No images" },
  { th: "ยังไม่มีเอกสาร", en: "No documents" },
  { th: "เปิดไฟล์", en: "Open file" },
  { th: "ดาวน์โหลดไฟล์", en: "Download file" },
  { th: "ลบไฟล์", en: "Delete file" },
  { th: "ยืนยันการลบไฟล์", en: "Confirm file deletion" },
  { th: "กรุณาเลือกไฟล์ที่ต้องการแนบ", en: "Choose a file to attach." },
  { th: "กำลังประมวลผลไฟล์...", en: "Processing attachments..." },
  { th: "กำลังจัดการบัญชีและสิทธิ์...", en: "Managing accounts and permissions..." },
  { th: "กำหนดโครงการ", en: "Projects" },
  { th: "จัดการโครงการและช่วงสัญญา", en: "Manage projects and contract periods" },
  { th: "Live Search โครงการ...", en: "Live Search projects..." },
  { th: "เพิ่มโครงการ", en: "Add project" },
  { th: "สัญญา", en: "Contract" },
  { th: "ระยะเวลา", en: "Period" },
  { th: "ใช้งาน", en: "Active" },
  { th: "ปิดใช้งาน", en: "Inactive" },
  { th: "แก้ไขโครงการ", en: "Edit project" },
  { th: "ช่องที่มี * จำเป็นต้องกรอก", en: "Fields marked * are required" },
  { th: "รหัสโครงการ *", en: "Project code *" },
  { th: "รหัสโครงการ", en: "Project code" },
  { th: "ชื่อโครงการ *", en: "Project name *" },
  { th: "ชื่อโครงการ", en: "Project name" },
  { th: "เลขที่สัญญา", en: "Contract number" },
  { th: "วันเริ่มสัญญา", en: "Contract start date" },
  { th: "เลือกวันเริ่มสัญญา", en: "Select contract start date" },
  { th: "วันสิ้นสุดสัญญา", en: "Contract end date" },
  { th: "เลือกวันสิ้นสุดสัญญา", en: "Select contract end date" },
  { th: "ผู้จัดการประชุม", en: "Meeting managers" },
  { th: "บัญชี Login และ Project Assignment", en: "Login accounts and project assignments" },
  { th: "Live Search ผู้ใช้หรือโครงการ...", en: "Live Search users or projects..." },
  { th: "เพิ่มผู้จัดการ", en: "Add manager" },
  { th: "ชื่อ", en: "First name" },
  { th: "นามสกุล", en: "Last name" },
  { th: "โครงการที่รับผิดชอบ", en: "Assigned projects" },
  { th: "สถานะ", en: "Status" },
  { th: "เพิ่มผู้จัดการประชุม", en: "Add meeting manager" },
  { th: "แก้ไขผู้จัดการประชุม", en: "Edit meeting manager" },
  { th: "กำหนดโครงการอย่างน้อยหนึ่งรายการสำหรับ Meeting Manager", en: "Assign at least one project to each Meeting Manager." },
  { th: "รหัสผ่าน", en: "Password" },
  { th: "E-mail", en: "Email" },
  { th: "โทรศัพท์", en: "Phone" },
  { th: "บันทึก", en: "Save" },
  { th: "ยืนยันการลบบัญชี", en: "Confirm account deletion" },
  { th: "ยืนยันการเพิ่มผู้จัดการ", en: "Confirm manager creation" },
  { th: "ยืนยันการแก้ไขผู้จัดการ", en: "Confirm manager changes" },
  { th: "กลุ่มและผู้เข้าร่วมประชุม", en: "Participant groups and people" },
  { th: "Master data สำหรับ QR แบบเลือกชื่อ", en: "Master data for named QR registration" },
  { th: "กลุ่มผู้เข้าร่วมเป็นข้อมูลกลาง ใช้ได้กับทุกโครงการและทุกการประชุม", en: "Participant groups are shared across all projects and meetings." },
  { th: "Live Search กลุ่มหรือรายชื่อ...", en: "Live Search groups or people..." },
  { th: "เพิ่มกลุ่ม", en: "Add group" },
  { th: "เพิ่มรายชื่อ", en: "Add person" },
  { th: "รายละเอียด", en: "Description" },
  { th: "รายชื่อ", en: "People" },
  { th: "ยังไม่มีกลุ่มผู้เข้าร่วม", en: "No participant groups" },
  { th: "แก้ไขกลุ่ม", en: "Edit group" },
  { th: "เพิ่มกลุ่มผู้เข้าร่วม", en: "Add participant group" },
  { th: "ชื่อกลุ่ม *", en: "Group name *" },
  { th: "แก้ไขรายชื่อ", en: "Edit person" },
  { th: "ตำแหน่ง *", en: "Position *" },
  { th: "ตำแหน่ง", en: "Position" },
  { th: "ระบบใช้ชื่อกลุ่มเป็นหน่วยงาน/สังกัดอัตโนมัติ", en: "The group name is used automatically as the organization / affiliation." },
  { th: "ติดต่อ", en: "Contact" },
  { th: "ยังไม่มีรายชื่อในกลุ่ม", en: "No people in this group" },
  { th: "พบจำนวนรายการทั้งสิ้น", en: "Total" },
  { th: "รายการ", en: "records" },
  { th: "แสดง", en: "Show" },
  { th: "แถว", en: "rows" },
  { th: "จัดการไฟล์ประกอบ", en: "Manage attachments" },
  { th: "ผู้จัด:", en: "Organizer:" },
  { th: "หน้าแรก", en: "First page" },
  { th: "หน้าก่อนหน้า", en: "Previous page" },
  { th: "หน้าถัดไป", en: "Next page" },
  { th: "หน้าสุดท้าย", en: "Last page" },
  { th: "ยกเลิก", en: "Cancel" },
  { th: "ยืนยัน", en: "Confirm" },
  { th: "ปิด", en: "Close" },
  { th: "กำลังประมวลผล...", en: "Processing..." },
  { th: "เลือกวันที่", en: "Select date" },
  { th: "วว/ดด/ปปปป", en: "DD/MM/YYYY (BE)" },
  { th: "ซ่อนรหัสผ่าน", en: "Hide password" },
  { th: "แสดงรหัสผ่าน", en: "Show password" },
  { th: "กลับรายการการประชุม", en: "Back to meetings" },
  { th: "กำลังประมวลผลการประชุม...", en: "Processing meeting..." },
  { th: "วันและเวลา", en: "Date and time" },
  { th: "เข้าสู่ระบบ", en: "Sign in" },
  { th: "ใช้บัญชีผู้ดูแลหรือผู้จัดการประชุม", en: "Use an administrator or meeting manager account" },
  { th: "กำลังเข้าสู่ระบบ...", en: "Signing in..." },
  { th: "จัดการโครงการ การประชุม QR และหลักฐานการเข้าร่วมในระบบเดียว", en: "Manage projects, meetings, QR registration, and attendance evidence in one system." },
  { th: "ลงทะเบียนผู้เข้าร่วมประชุม", en: "Meeting registration" },
  { th: "เลือกจากรายชื่อ", en: "Choose from list" },
  { th: "ไม่มีชื่อ เพิ่มเอง", en: "Not listed, enter manually" },
  { th: "เลือกชื่อ-นามสกุล", en: "Select full name" },
  { th: "ลายมือชื่อ *", en: "Signature *" },
  { th: "ลายมือชื่อ", en: "Signature" },
  { th: "ล้างลายมือชื่อ", en: "Clear signature" },
  { th: "ช่องเขียนลายมือชื่อ", en: "Signature pad" },
  { th: "เขียนลายมือชื่อด้วยเมาส์ ปากกา หรือปลายนิ้วภายในกรอบ", en: "Sign inside the box using a mouse, pen, or finger." },
  { th: "บันทึก(ต่อ)", en: "Save and continue" },
  { th: "ปิดรับลงทะเบียนแล้ว", en: "Registration is closed" },
  { th: "กรุณาติดต่อผู้จัดการประชุม หากจำเป็นต้องลงทะเบียนเพิ่มเติม", en: "Contact the meeting manager if additional registration is required." },
  { th: "ไม่สามารถลงทะเบียนได้", en: "Unable to register" },
  { th: "กำลังโหลดหน้าลงทะเบียน...", en: "Loading registration..." },
  { th: "กำลังบันทึกการลงทะเบียน...", en: "Saving registration..." },
  { th: "ยืนยันการบันทึก", en: "Confirm registration" },
  { th: "ยืนยันการบันทึกต่อเนื่อง", en: "Confirm save and continue" },
  { th: "ระบบจะบันทึกข้อมูลผู้เข้าร่วมประชุม และปิดหน้าลงทะเบียนหลังยืนยันผลสำเร็จ", en: "The registration will be saved and this page will close after confirmation." },
  { th: "ระบบจะบันทึกข้อมูลชุดนี้ แล้วล้างแบบฟอร์มเพื่อรอลงทะเบียนบุคคลถัดไป", en: "This registration will be saved and the form cleared for the next person." },
  { th: "ยืนยันการล้างลายมือชื่อ", en: "Confirm signature clearing" },
  { th: "ลายมือชื่อที่เขียนอยู่ในช่องจะถูกล้างทั้งหมด", en: "The signature currently in the pad will be cleared." },
  { th: "ต้องการปิดหน้าลงทะเบียน?", en: "Close the registration page?" },
  { th: "ข้อมูลที่ยังไม่ได้บันทึกจะไม่ถูกเก็บไว้", en: "Unsaved information will be discarded." },
  { th: "ปิดหน้า", en: "Close page" },
  { th: "ลงทะเบียนสำเร็จ", en: "Registration successful" },
  { th: "กรุณาเลือกรายชื่อ หรือเลือกเพิ่มข้อมูลด้วยตนเอง", en: "Select a name or choose to enter information manually." },
  { th: "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน", en: "Complete all fields marked with *." },
  { th: "กรุณากรอก E-mail ให้ถูกต้อง", en: "Enter a valid email address." },
  { th: "กรุณาลงลายมือชื่อ", en: "Please provide a signature." },
];

const byThai = new Map(translations.map((item) => [item.th, item]));
const byEnglish = new Map(translations.map((item) => [item.en, item]));

export function findTranslationConflicts() {
  const conflicts: string[] = [];
  const thaiToEnglish = new Map<string, string>();
  const englishToThai = new Map<string, string>();

  for (const item of translations) {
    const existingEnglish = thaiToEnglish.get(item.th);
    if (existingEnglish && existingEnglish !== item.en) {
      conflicts.push(`Thai \"${item.th}\" maps to both \"${existingEnglish}\" and \"${item.en}\"`);
    }

    const existingThai = englishToThai.get(item.en);
    if (existingThai && existingThai !== item.th) {
      conflicts.push(`English \"${item.en}\" maps to both \"${existingThai}\" and \"${item.th}\"`);
    }

    thaiToEnglish.set(item.th, item.en);
    englishToThai.set(item.en, item.th);
  }

  return conflicts;
}

const patterns: Array<{
  pattern: RegExp;
  th: (...matches: string[]) => string;
  en: (...matches: string[]) => string;
}> = [
  {
    pattern: /^พบจำนวนรายการทั้งสิ้น\s+([\d,]+)\s+รายการ$/,
    th: (count) => `พบจำนวนรายการทั้งสิ้น ${count} รายการ`,
    en: (count) => `Total ${count} records`,
  },
  {
    pattern: /^([\d,]+)\s+คน$/,
    th: (count) => `${count} คน`,
    en: (count) => `${count} people`,
  },
  {
    pattern: /^ลำดับที่\s+([\d,]+)$/,
    th: (number) => `ลำดับที่ ${number}`,
    en: (number) => `No. ${number}`,
  },
  {
    pattern: /^หน้า\s+([\d,]+)$/,
    th: (page) => `หน้า ${page}`,
    en: (page) => `Page ${page}`,
  },
  {
    pattern: /^เรียงตาม\s+(.+)$/,
    th: (label) => `เรียงตาม ${label}`,
    en: (label) => `Sort by ${translateUiText(label, "en")}`,
  },
  {
    pattern: /^(.+)\s+รูปแบบ\s+วว\/ดด\/ปปปป$/,
    th: (label) => `${label} รูปแบบ วว/ดด/ปปปป`,
    en: (label) => `${translateUiText(label, "en")} in DD/MM/YYYY (BE) format`,
  },
  {
    pattern: /^ผู้ลงทะเบียน\s+(.+)$/,
    th: (code) => `ผู้ลงทะเบียน ${code}`,
    en: (code) => `Registrants ${code}`,
  },
  {
    pattern: /^เปิดผู้ลงทะเบียน\s+([\d,]+)\s+คน$/,
    th: (count) => `เปิดผู้ลงทะเบียน ${count} คน`,
    en: (count) => `Open ${count} registrants`,
  },
  {
    pattern: /^แก้ไข\s+(.+)$/,
    th: (value) => `แก้ไข ${value}`,
    en: (value) => `Edit ${value}`,
  },
  {
    pattern: /^ไฟล์ประกอบ\s+(.+)$/,
    th: (code) => `ไฟล์ประกอบ ${code}`,
    en: (code) => `Attachments ${code}`,
  },
  {
    pattern: /^ใช้แล้ว\s+(.+)\s+\/\s+20 MB$/,
    th: (size) => `ใช้แล้ว ${size} / 20 MB`,
    en: (size) => `Used ${size} / 20 MB`,
  },
  {
    pattern: /^รูปตัวอย่าง\s+(.+)$/,
    th: (fileName) => `รูปตัวอย่าง ${fileName}`,
    en: (fileName) => `Preview of ${fileName}`,
  },
  {
    pattern: /^เปิดไฟล์\s+(.+)$/,
    th: (fileName) => `เปิดไฟล์ ${fileName}`,
    en: (fileName) => `Open ${fileName}`,
  },
  {
    pattern: /^ดาวน์โหลดไฟล์\s+(.+)$/,
    th: (fileName) => `ดาวน์โหลดไฟล์ ${fileName}`,
    en: (fileName) => `Download ${fileName}`,
  },
  {
    pattern: /^ลบไฟล์\s+(.+)$/,
    th: (fileName) => `ลบไฟล์ ${fileName}`,
    en: (fileName) => `Delete ${fileName}`,
  },
  {
    pattern: /^รูปประกอบ\s+(.+)$/,
    th: (name) => `รูปประกอบ ${name}`,
    en: (name) => `Illustration for ${translateUiText(name, "en")}`,
  },
  {
    pattern: /^QR Code\s+(.+)$/,
    th: (name) => `QR Code ${name}`,
    en: (name) => `QR Code for ${translateUiText(name, "en")}`,
  },
  {
    pattern: /^เพิ่มรายชื่อใน\s+(.+)$/,
    th: (group) => `เพิ่มรายชื่อใน ${group}`,
    en: (group) => `Add person to ${group}`,
  },
  {
    pattern: /^เลื่อน\s+(.+)\s+ขึ้น$/,
    th: (name) => `เลื่อน ${name} ขึ้น`,
    en: (name) => `Move ${name} up`,
  },
  {
    pattern: /^เลื่อน\s+(.+)\s+ลง$/,
    th: (name) => `เลื่อน ${name} ลง`,
    en: (name) => `Move ${name} down`,
  },
  {
    pattern: /^([\d,]+)\s+นาที$/,
    th: (minutes) => `${minutes} นาที`,
    en: (minutes) => `${minutes} minutes`,
  },
  {
    pattern: /^ระยะเวลาประชุม\s+([\d,]+)\s+นาที\s+เลือกได้สูงสุด\s+([\d,]+)\s+นาที$/,
    th: (duration, maximum) => `ระยะเวลาประชุม ${duration} นาที เลือกได้สูงสุด ${maximum} นาที`,
    en: (duration, maximum) => `Meeting duration: ${duration} minutes. Maximum registration window: ${maximum} minutes.`,
  },
];

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export function translateUiText(source: string, locale: AppLocale) {
  const normalized = source.trim();
  if (!normalized) return source;

  const direct = byThai.get(normalized) ?? byEnglish.get(normalized);
  if (direct) return preserveWhitespace(source, direct[locale]);

  for (const item of patterns) {
    const match = normalized.match(item.pattern);
    if (!match) continue;
    const translated = item[locale](...match.slice(1));
    return preserveWhitespace(source, translated);
  }

  return source;
}
