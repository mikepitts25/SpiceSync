import {
  CONVERSATION_CARD_QUESTION_LINES,
  getConversationCardQuestionTextStyle,
} from '../lib/conversationCardText';
import {
  getPoolByLanguage,
  type ConversationStarter,
} from '../lib/conversationStarters';

const screenshotPrompt =
  "If you had to describe me to someone who's never met me, what's the first thing you'd say?";

function allLocalizedStarters(): ConversationStarter[] {
  return [...getPoolByLanguage('en'), ...getPoolByLanguage('es')];
}

describe('conversation card text fitting', () => {
  it('starts the screenshot-length prompt at a smaller size so it can fit without clipping', () => {
    const style = getConversationCardQuestionTextStyle(screenshotPrompt);

    expect(style.fontSize).toBeLessThan(22);
    expect(style.lineHeight).toBeLessThan(29);
  });

  it('keeps every localized conversation prompt within the supported shrink-to-fit range', () => {
    for (const starter of allLocalizedStarters()) {
      const style = getConversationCardQuestionTextStyle(starter.question);

      expect(style.fontSize).toBeGreaterThanOrEqual(16);

      if (starter.question.length >= 72) {
        const lineBudget = style.lineHeight * CONVERSATION_CARD_QUESTION_LINES;
        expect(lineBudget).toBeLessThanOrEqual(104);
      }
    }
  });
});
