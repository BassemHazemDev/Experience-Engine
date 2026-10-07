export type Direction = "ltr" | "rtl";
export type ExperienceId = string;
export type CultureId = string;
export type ThemeId = string;
export type MotionId = string;

export interface ResourceReference {
  readonly kind: "translation" | "font" | "asset" | "code";
  readonly id: string;
  readonly version?: string;
  readonly load?: () => Promise<unknown>;
}

export interface CultureDefinition {
  readonly locale: string;
  readonly direction: Direction;
  readonly typography?: Readonly<Record<string, unknown>>;
  readonly formatting?: Readonly<Record<string, unknown>>;
  readonly resources?: readonly ResourceReference[];
  readonly extends?: CultureId;
}

export interface ThemeDefinition {
  readonly tokens: Readonly<Record<string, string | number>>;
  readonly density?: string;
  readonly components?: Readonly<Record<string, unknown>>;
  readonly resources?: readonly ResourceReference[];
  readonly extends?: ThemeId;
}

export interface MotionDefinition {
  readonly defaultStrategy?: "instant" | "css" | "view-transition" | "js";
  readonly durationMs?: number;
  readonly easing?: string;
}

export interface ExperienceRequest<
  C extends CultureId = CultureId,
  T extends ThemeId = ThemeId,
  M extends MotionId = MotionId,
> {
  readonly culture: C;
  readonly theme: T;
  readonly motion?: M;
}

export interface ExperienceDelta {
  readonly cultureChanged: boolean;
  readonly themeChanged: boolean;
  readonly motionChanged: boolean;
  readonly changedKeys: readonly string[];
}

export interface ResolvedExperience {
  readonly id: ExperienceId;
  readonly request: Required<ExperienceRequest>;
  readonly locale: string;
  readonly direction: Direction;
  readonly tokens: Readonly<Record<string, string | number>>;
  readonly formatting: Readonly<Record<string, unknown>>;
  readonly typography: Readonly<Record<string, unknown>>;
  readonly resources: readonly ResourceReference[];
  readonly motion: MotionDefinition;
  readonly components?: Readonly<Record<string, unknown>>;
  readonly delta?: ExperienceDelta;
}
