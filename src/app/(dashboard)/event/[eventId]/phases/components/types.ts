export type PhaseType =
  | "GENERAL"
  | "REGISTRATION"
  | "IDEA_REVIEW"
  | "DEVELOPMENT"
  | "PRESENTATION"
  | "JUDGING"
  | "FINALS"
  | "ELIMINATION";

export type PhaseStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

export type EvaluationMethod = "AI_AUTO" | "JUDGE_MANUAL" | "COMBINED" | "MENTOR_REVIEW" | "PEER_REVIEW";

export type AdvancementMode = "PER_TRACK" | "OVERALL";

export type QualificationMode = "SCORE_BASED" | "ADVANCE_ALL" | "MANUAL";

export interface PhaseCriteria {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  maxScore: number;
  weight: number;
  sortOrder?: number;
}

export interface PhaseResult {
  id: string;
  teamId?: string;
  name?: string;
  nameAr?: string;
  teamName?: string;
  score?: number | null;
  totalScore: number | null;
  status: "PENDING" | "EVALUATED" | "ADVANCED" | "ELIMINATED";
  feedback?: string | null;
}

export interface AutoFilterRule {
  type: string;
  enabled: boolean;
  value?: number;
  minCount?: number;
}

export interface DeliverableFieldConfig {
  type: "repository" | "presentation" | "demo" | "miro" | "onedrive" | "file" | "description";
  enabled: boolean;
  required: boolean;
  label: string;
  allowFile?: boolean;
  allowLink?: boolean;
  providedUrl?: string;
}

export interface DeliverableConfig {
  fields: DeliverableFieldConfig[];
}

export interface Phase {
  id: string;
  name: string;
  nameAr: string;
  description?: string | null;
  descriptionAr?: string | null;
  phaseNumber: number;
  phaseType: PhaseType;
  status: PhaseStatus;
  startDate: string;
  endDate: string;
  isElimination: boolean;
  passThreshold: number | null;
  maxAdvancing: number | null;
  advancePercent: number | null;
  evaluationMethod: EvaluationMethod | null;
  advancementMode: AdvancementMode;
  judgesPerTeam: number;
  qualificationMode: QualificationMode;
  autoFilterRules: { rules: AutoFilterRule[] } | null;
  deliverableConfig: DeliverableConfig | null;
  criteria: PhaseCriteria[];
  results: PhaseResult[];
  assignments: any[];
  scheduleItems: ScheduleItem[];
  totalParticipants: number;
  evaluatedTeams: number;
  advanced: number;
  eliminated: number;
  pendingEvaluation: number;
}

export interface Deliverable {
  teamId: string;
  teamName: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
  repositoryUrl: string | null;
  presentationUrl: string | null;
  demoUrl: string | null;
  miroBoard: string | null;
  oneDriveUrl: string | null;
  submissionFileUrl: string | null;
  hasDeliverable: boolean;
  submittedAt: string | null;
}

export interface AutoFilterTeam {
  teamId: string;
  teamName: string;
  trackName: string | null;
  trackColor: string | null;
  memberCount: number;
  passedRules: string[];
  failedRules: string[];
}

export type ScheduleItemType = "WORKSHOP" | "SESSION" | "DEADLINE" | "CEREMONY" | "BREAK" | "MENTORING" | "PRESENTATION";

export interface ScheduleItem {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  type: ScheduleItemType;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isOnline: boolean;
  isInPerson: boolean;
  onlineLink: string | null;
  location: string | null;
  locationAr: string | null;
  speaker: string | null;
  speakerAr: string | null;
}

export interface EliminationTeam {
  teamId: string;
  teamName: string;
  trackId: string | null;
  avgScore: number;
  rank?: number;
}
