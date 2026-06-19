// Defines the canonical Ripple graph and memory model shared across all packages.
type ID = string;

interface Project {
  id: ID;
  name: string;
  rootPath: string;
  createdAt: number;
}

interface FileNode {
  id: ID;
  projectId: ID;
  path: string;
  folderPath: string;
  language: string;
  contentHash: string;
  symbols: ID[];
}

type SymbolType = "function" | "class" | "component" | "module";

interface CodeSymbol {
  id: ID;
  projectId: ID;
  name: string;
  type: SymbolType;
  filePath: string;
  startLine?: number;
  endLine?: number;
  calls: ID[];
  referencedBy: ID[];
  languageKind?: string;
  metadata?: Record<string, unknown>;
}

type EdgeType =
  | "DEPENDS_ON"
  | "IMPLEMENTS"
  | "CALLS"
  | "CONTAINS"
  | "IMPORTS"
  | "EXPORTS"
  | "RE_EXPORTS"
  | "REFERENCES"
  | "REPLACES"
  | "MODIFIES"
  | "AFFECTS";

interface Edge {
  id: ID;
  projectId: ID;
  fromId: ID;
  toId: ID;
  type: EdgeType;
  context?: string;
  createdAt: number;
}

type EventType = "COMMIT" | "FILE_CHANGE" | "SESSION" | "SYSTEM";

interface BaseEvent {
  id: ID;
  projectId: ID;
  type: EventType;
  timestamp: number;
  source: "github" | "cursor" | "claude" | "system";
}

interface CommitEvent extends BaseEvent {
  type: "COMMIT";
  commitHash: string;
  filesChanged: string[];
}

interface FileChangeEvent extends BaseEvent {
  type: "FILE_CHANGE";
  filePath: string;
  diffSummary?: string;
}

interface SessionEvent extends BaseEvent {
  type: "SESSION";
  sessionSource: "cursor" | "claude";
  summary?: string;
}

type RippleEvent =
  | CommitEvent
  | FileChangeEvent
  | SessionEvent
  | BaseEvent;

interface Decision {
  id: ID;
  projectId: ID;
  title: string;
  reasoning: string;
  alternativesConsidered: string[];
  rejectedWhy: string;
  confidence: "low" | "medium" | "high";
  relatedSymbols: ID[];
  relatedEvents: ID[];
  createdAt: number;
}

interface Assumption {
  id: ID;
  projectId: ID;
  statement: string;
  risk: "low" | "medium" | "high";
  dependsOn: ID[];
  createdAt: number;
}

interface OpenQuestion {
  id: ID;
  projectId: ID;
  question: string;
  context?: string;
  blocking: boolean;
  relatedSymbols: ID[];
  createdAt: number;
}

interface ProjectState {
  project: Project;
  files: FileNode[];
  symbols: CodeSymbol[];
  edges: Edge[];
  events: RippleEvent[];
  decisions?: Decision[];
  assumptions?: Assumption[];
  openQuestions?: OpenQuestion[];
}
