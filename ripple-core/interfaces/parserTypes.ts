// Defines input and output types for language-specific parser adapters.
/// <reference path="../schema.ts" />

/** Language-neutral opaque module surface tag that adapters extend internally. */
interface AdapterModuleSurface {
  language: string;
}

/** Everything a parser adapter needs to parse one file in a repository. */
interface ParseFileInput {
  projectId: ID;
  file: FileNode;
  source: string;
  repoPath: string;
  repoFilePaths: ReadonlySet<string>;
}

/** Canonical graph primitives plus adapter module surface from one file parse. */
interface ParseFileOutput {
  symbols: CodeSymbol[];
  edges: Edge[];
  moduleSurface: AdapterModuleSurface;
}
