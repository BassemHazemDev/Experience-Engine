export type ExperienceErrorCode =
  | "INVALID_REQUEST"
  | "UNKNOWN_CULTURE"
  | "UNKNOWN_THEME"
  | "UNKNOWN_MOTION"
  | "INVALID_DEFINITION"
  | "INHERITANCE_CYCLE"
  | "INHERITANCE_DEPTH_EXCEEDED"
  | "RESOURCE_LOAD_FAILED"
  | "TRANSITION_FAILED"
  | "TRANSITION_STALE";

export class ExperienceEngineError extends Error {
  readonly code: ExperienceErrorCode;
  readonly cause?: unknown;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: ExperienceErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      details?: Readonly<Record<string, unknown>>;
    },
  ) {
    super(message);
    this.name = "ExperienceEngineError";
    this.code = code;
    this.cause = options?.cause;
    this.details = options?.details;
  }
}
