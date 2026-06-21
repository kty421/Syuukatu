import { QuestionLabel, QuestionMemo } from '../../domain/entities/question';

export type QuestionMemoDto = QuestionMemo;
export type QuestionLabelDto = QuestionLabel;

export const toQuestionMemoDomain = (dto: QuestionMemoDto): QuestionMemo => ({
  ...dto,
  companyId: dto.companyId ?? null,
  labelIds: dto.labelIds ?? []
});

export const toQuestionLabelDomain = (dto: QuestionLabelDto): QuestionLabel => ({
  ...dto,
  sortOrder: dto.sortOrder ?? 0
});

export const toQuestionMemoRequestDto = (memo: QuestionMemo) => ({
  questionMemo: {
    ...memo,
    companyId: memo.companyId ?? null,
    labelIds: memo.labelIds ?? []
  }
});
