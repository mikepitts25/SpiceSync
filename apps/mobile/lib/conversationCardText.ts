export const CONVERSATION_CARD_QUESTION_LINES = 4;
export const CONVERSATION_CARD_MIN_FONT_SCALE = 0.72;

type QuestionTextStyle = {
  fontSize: number;
  lineHeight: number;
};

export function getConversationCardQuestionTextStyle(
  _question: string
): QuestionTextStyle {
  return { fontSize: 24, lineHeight: 31 };
}
