// Unified diff fixtures for PRChange builder golden tests.
export const samplePatchTwoFiles = [
  {
    path: "lib/b.ts",
    patch: `@@ -1,3 +1,4 @@
 context
-old
+new
+added
`,
  },
  {
    path: "./src/a.ts",
    patch: `@@ -10,2 +10,3 @@
 unchanged
+inserted
 context
`,
  },
] as const;

export const samplePatchUnorderedPaths = [
  {
    path: "z-last.ts",
    patch: `@@ -1,1 +1,2 @@
 a
+b
`,
  },
  {
    path: "a-first.ts",
    patch: `@@ -2,1 +2,1 @@
-x
+y
`,
  },
] as const;

export const malformedPatchMissingHunk = `--- a/file.ts
+++ b/file.ts
 no hunk header here
`;

export const malformedPatchBadHunkHeader = `@@ not-a-valid hunk @@
 line
`;
