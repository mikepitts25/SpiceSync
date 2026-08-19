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

  it('avoids known literal-English calques in Spanish conversation copy', () => {
    const spanishCopy = JSON.stringify(getPoolByLanguage('es'));

    for (const calque of [
      ' vs. ',
      'como parejas',
      'falta el toque',
      'no es solo sobre',
      'pueden durar con atención',
      'El después es',
      'el logrador',
      'causa social eres más apasionado',
      'experiencias de vida que nos humillan',
      'ser tu animador/a',
      'el pensamiento detrás',
      'tiempo enfocado',
      'toque casual',
      'más toque regular',
      '¿Cuál lenguaje',
      'hablar mejor tu lenguaje',
      '¿Cómo sería si ambos',
      'entender cómo crea más de ello',
      'antes eras incómodo',
      'no-por-ahora',
    ]) {
      expect(spanishCopy).not.toContain(calque);
    }
  });
});
