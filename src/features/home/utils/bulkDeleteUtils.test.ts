import { describe, expect, it } from "vitest";

import { Company, CompanySchedule, QuestionMemo } from "../types";
import {
  createCompanyBulkDeletePreview,
  createQuestionMemoBulkDeletePreview,
  partitionSettledDeleteIds,
  restoreFailedCompanyDeletes,
  restoreFailedQuestionMemoDeletes,
} from "./bulkDeleteUtils";

const createCompany = (id: string): Company => ({
  archived: false,
  companyName: `企業${id}`,
  createdAt: `2026-06-0${id === "a" ? "1" : "2"}T00:00:00.000Z`,
  favorite: false,
  id,
  loginId: "",
  password: "",
  questionAnswers: [],
  status: "未エントリー",
  tags: [],
  type: "internship",
  updatedAt: `2026-06-0${id === "a" ? "1" : "2"}T00:00:00.000Z`,
});

const createSchedule = (id: string, companyId: string): CompanySchedule => ({
  companyId,
  createdAt: "2026-06-01T00:00:00.000Z",
  id,
  isAllDay: true,
  startDate: "2026-06-10",
  title: `予定${id}`,
  type: "面接",
  updatedAt: "2026-06-01T00:00:00.000Z",
});

const createQuestionMemo = (
  id: string,
  companyId: string | null,
): QuestionMemo => ({
  answer: "回答",
  companyId,
  createdAt: "2026-06-01T00:00:00.000Z",
  id,
  labelIds: [],
  question: `質問${id}`,
  updatedAt: "2026-06-01T00:00:00.000Z",
});

describe("bulkDeleteUtils", () => {
  it("企業削除のプレビューで日程を除去し、質問を未所属にする", () => {
    const companies = [createCompany("a"), createCompany("b")];
    const schedules = [
      createSchedule("schedule-a", "a"),
      createSchedule("schedule-b", "b"),
    ];
    const questionMemos = [
      createQuestionMemo("question-a", "a"),
      createQuestionMemo("question-b", "b"),
    ];

    const preview = createCompanyBulkDeletePreview(
      companies,
      schedules,
      questionMemos,
      ["a"],
    );

    expect(preview.companies.map((company) => company.id)).toEqual(["b"]);
    expect(preview.schedules.map((schedule) => schedule.id)).toEqual([
      "schedule-b",
    ]);
    expect(
      preview.questionMemos.find((memo) => memo.id === "question-a")
        ?.companyId,
    ).toBeNull();
    expect(
      preview.questionMemos.find((memo) => memo.id === "question-b")
        ?.companyId,
    ).toBe("b");
  });

  it("一部失敗時は失敗企業の本体・日程・質問関連だけを復元する", () => {
    const companies = [createCompany("a"), createCompany("b")];
    const schedules = [
      createSchedule("schedule-a", "a"),
      createSchedule("schedule-b", "b"),
    ];
    const questionMemos = [
      createQuestionMemo("question-a", "a"),
      createQuestionMemo("question-b", "b"),
    ];
    const preview = createCompanyBulkDeletePreview(
      companies,
      schedules,
      questionMemos,
      ["a", "b"],
    );

    const restored = restoreFailedCompanyDeletes(
      preview.companies,
      preview.schedules,
      preview.questionMemos,
      preview.snapshot,
      ["a"],
    );

    expect(restored.companies.map((company) => company.id)).toEqual(["a"]);
    expect(restored.schedules.map((schedule) => schedule.id)).toEqual([
      "schedule-a",
    ]);
    expect(
      restored.questionMemos.find((memo) => memo.id === "question-a")
        ?.companyId,
    ).toBe("a");
    expect(
      restored.questionMemos.find((memo) => memo.id === "question-b")
        ?.companyId,
    ).toBeNull();
  });

  it("質問メモの一部失敗時は失敗したメモだけを復元する", () => {
    const questionMemos = [
      createQuestionMemo("question-a", "a"),
      createQuestionMemo("question-b", "b"),
    ];
    const preview = createQuestionMemoBulkDeletePreview(questionMemos, [
      "question-a",
      "question-b",
    ]);

    const restored = restoreFailedQuestionMemoDeletes(
      preview.questionMemos,
      preview.deletedQuestionMemos,
      ["question-b"],
    );

    expect(restored.map((memo) => memo.id)).toEqual(["question-b"]);
  });

  it("削除結果と端末資格情報の消去結果をID単位で分類できる", () => {
    const deletionResult = partitionSettledDeleteIds(
      ["a", "b"],
      [
        { status: "fulfilled", value: undefined },
        { status: "rejected", reason: new Error("failed") },
      ],
    );
    const credentialResult = partitionSettledDeleteIds(
      deletionResult.succeededIds,
      [{ status: "rejected", reason: new Error("credential failed") }],
    );

    expect(deletionResult).toEqual({
      succeededIds: ["a"],
      failedIds: ["b"],
    });
    expect(credentialResult).toEqual({
      succeededIds: [],
      failedIds: ["a"],
    });
  });
});
