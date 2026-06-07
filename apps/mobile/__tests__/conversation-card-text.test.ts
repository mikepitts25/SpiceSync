import { getConversationCardQuestionTextStyle } from '../lib/conversationCardText';
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
  it('uses one readable main topic size for conversation prompts', () => {
    const style = getConversationCardQuestionTextStyle(screenshotPrompt);

    expect(style.fontSize).toBe(24);
    expect(style.lineHeight).toBe(31);
  });

  it('keeps every localized conversation prompt on the same main topic scale', () => {
    for (const starter of allLocalizedStarters()) {
      const style = getConversationCardQuestionTextStyle(starter.question);

      expect(style.fontSize).toBe(24);
      expect(style.lineHeight).toBe(31);
    }
  });
});
