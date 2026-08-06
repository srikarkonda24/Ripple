// Technical breakdown of graph extraction — replaces AI-vs-Ripple checkbox matrices.

import { EXTRACTION_STEPS } from '@/data/prDemo';

/**
 * Shows how impact is derived from AST/static edges rather than marketing claims.
 */
export function Mechanism() {
  return (
    <section id="mechanism" className="section section-text">
      <div className="section-inner">
        <h2 className="section-heading-title">How it actually works</h2>
        <p className="mechanism-lead">
          Ripple is static analysis first. LLMs are optional for wording the report—not for inventing
          edges. If a dependency path is not in the graph, it does not appear in the comment.
        </p>

        <div className="mechanism-layout">
          <ol className="mechanism-steps">
            {EXTRACTION_STEPS.map((step, index) => (
              <li key={step.title} className="mechanism-step">
                <span className="mechanism-step-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <pre className="mechanism-snippet">{`# simplified edge extraction
for file in snapshot.files:
  ast = parse_typescript(file)
  for imp in ast.imports:
    graph.add_edge(file, resolve(imp), kind="imports")
  for call in ast.call_sites:
    graph.add_edge(file, call.callee, kind="calls")

impact = walk(graph, seeds=diff.changed_symbols)
emit_pr_comment(impact.paths, impact.evidence)`}</pre>
        </div>
      </div>
    </section>
  );
}
