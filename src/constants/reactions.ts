import type { TranslationKey } from '@/localization';

export type ReactionRule = {
  min: number;
  max: number;
  keys: TranslationKey[];
};

export const reactionRules: ReactionRule[] = [
  { min: 100, max: 100, keys: ['reactionPerfect', 'reactionPerfectShort'] },
  { min: 90, max: 99, keys: ['reactionRidiculous', 'reactionIncredible'] },
  { min: 80, max: 89, keys: ['reactionBackwardsEars', 'reactionVeryClose'] },
  { min: 60, max: 79, keys: ['reactionNotBad', 'reactionNotBadShort'] },
  { min: 40, max: 59, keys: ['reactionPractice', 'reactionGettingThere'] },
  { min: 0, max: 39, keys: ['reactionMystery', 'reactionWhatWasThat'] },
];

export function getReactionKey(score: number) {
  const rounded = Math.round(score);
  const rule = reactionRules.find((item) => rounded >= item.min && rounded <= item.max) ?? reactionRules.at(-1)!;
  return rule.keys[rounded % rule.keys.length];
}
