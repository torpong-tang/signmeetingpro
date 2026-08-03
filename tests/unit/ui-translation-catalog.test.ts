import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  findTranslationConflicts,
  UI_TERMINOLOGY,
  translateUiText,
} from "@/lib/ui-translation-catalog";

describe("UI translation catalog", () => {
  it("translates workspace copy in both directions", () => {
    assert.equal(translateUiText("รายการการประชุม", "en"), "Meetings");
    assert.equal(translateUiText("Meetings", "th"), "รายการการประชุม");
  });

  it("uses one unambiguous translation for every catalog entry", () => {
    assert.deepEqual(findTranslationConflicts(), []);
  });

  it("keeps canonical business terminology consistent in both languages", () => {
    for (const term of UI_TERMINOLOGY) {
      assert.equal(translateUiText(term.th, "en"), term.en, term.key);
      assert.equal(translateUiText(term.en, "th"), term.th, term.key);
    }
  });

  it("preserves surrounding whitespace", () => {
    assert.equal(translateUiText("  บันทึก  ", "en"), "  Save  ");
  });

  it("translates dynamic accessibility labels", () => {
    assert.equal(translateUiText("เปิดผู้ลงทะเบียน 12 คน", "en"), "Open 12 registrants");
    assert.equal(translateUiText("แก้ไข MTG-2569-0001", "en"), "Edit MTG-2569-0001");
    assert.equal(translateUiText("หน้า 3", "en"), "Page 3");
    assert.equal(translateUiText("ใช้แล้ว 1.4 KB / 20 MB", "en"), "Used 1.4 KB / 20 MB");
  });

  it("translates attachment and registration channel copy", () => {
    assert.equal(translateUiText("อัปโหลดรูปภาพ", "en"), "Upload image");
    assert.equal(translateUiText("ยังไม่มีเอกสาร", "en"), "No documents");
    assert.equal(translateUiText("Registration channels", "th"), "ช่องทางการลงทะเบียน");
    assert.equal(translateUiText("Illustration", "th"), "รูปประกอบ");
  });

  it("does not translate business data that is absent from the catalog", () => {
    assert.equal(translateUiText("STRUCTURE BUILDER FOR THAILAND", "th"), "STRUCTURE BUILDER FOR THAILAND");
    assert.equal(translateUiText("บริษัท ทดสอบ จำกัด", "en"), "บริษัท ทดสอบ จำกัด");
  });
});
