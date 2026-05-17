export const CONVERSATION_CARD_QUESTION_LINES = 4;
export const CONVERSATION_CARD_MIN_FONT_SCALE = 0.72;

type QuestionTextStyle = {
  fontSize: number;
  lineHeight: number;
};

export function getConversationCardQuestionTextStyle(
  question: string
): QuestionTextStyle {
  const length = question.trim().length;

  if (length >= 112) {
    return { fontSize: 16, lineHeight: 22 };
  }

  if (length >= 92) {
    return { fontSize: 18, lineHeight: 24 };
  }

  if (length >= 72) {
    return { fontSize: 19, lineHeight: 25 };
  }

  return { fontSize: 22, lineHeight: 29 };
}
