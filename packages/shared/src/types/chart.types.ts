export const PlayStyle = {
  SP: 'SP',
  DP: 'DP',
} as const satisfies Record<string, string>;

export type PlayStyle = typeof PlayStyle[keyof typeof PlayStyle];


export const Difficulty = {
  BEGINNER: 'BEGINNER',
  NORMAL: 'NORMAL',
  HYPER: 'HYPER',
  ANOTHER: 'ANOTHER',
  LEGGENDARIA: 'LEGGENDARIA',
} as const satisfies Record<string, string>;

export type Difficulty = typeof Difficulty[keyof typeof Difficulty];


export interface ChartBase {
  playStyle: PlayStyle;
  difficulty: Difficulty;
  level: number;
}