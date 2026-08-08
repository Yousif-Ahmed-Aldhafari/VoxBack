import type { Language } from '@/types';

export const challengePhrases: Record<Language, string[]> = {
  en: [
    'Hello, how are you?',
    'I love pizza.',
    'Where are you going?',
    'The cat is sleeping.',
    "Let's go!",
    "I can't believe it!",
    'What happened?',
    'Good morning.',
  ],
  ar: [
    'مرحباً، كيف حالك؟',
    'أنا أحب البيتزا.',
    'إلى أين أنت ذاهب؟',
    'القطة نائمة.',
    'هيا بنا!',
    'لا أستطيع أن أصدق ذلك!',
    'ماذا حدث؟',
    'صباح الخير.',
  ],
};

export function getChallengePhrase(language: Language, roundNumber: number) {
  const phrases = challengePhrases[language];
  return phrases[(roundNumber - 1) % phrases.length];
}
