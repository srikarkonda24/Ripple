// TypeScript/JavaScript ResolverAdapter implementation for Stage 4 edge-target resolution.
/// <reference path="../../../ripple-core/interfaces/ResolverAdapter.ts" />

import { resolveExportEntry, resolveModuleSpecifier } from "./symbolRules";

/** Resolves cross-file import and symbol bindings for TypeScript and JavaScript repositories. */
export class TypeScriptResolverAdapter implements ResolverAdapter {
  readonly language = "typescript";

  resolveImport(input: ResolveImportInput): ResolveImportOutput {
    return resolveModuleSpecifier(input.fromFilePath, input.specifier, input.context);
  }

  resolveSymbol(input: ResolveSymbolInput): ResolveSymbolOutput {
    const moduleResolution = resolveModuleSpecifier(
      input.fromFilePath,
      input.binding.specifier,
      input.context
    );
    if (moduleResolution.kind !== "resolved" || !moduleResolution.filePath) {
      return moduleResolution;
    }

    if (input.binding.kind === "side-effect" || input.binding.kind === "namespace") {
      return moduleResolution;
    }

    const exportKeyName =
      input.requestedName === "default"
        ? "default"
        : `named:${input.requestedName.replace(/^named:/, "")}`;

    return resolveExportEntry(moduleResolution.filePath, exportKeyName, input.context);
  }
}

/** Creates the default TypeScript resolver adapter instance used by Stage 4. */
export function createTypeScriptResolverAdapter(): TypeScriptResolverAdapter {
  return new TypeScriptResolverAdapter();
}
