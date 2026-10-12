// Every diagram on the site renders through this one queue.
//
// vitepress-plugin-mermaid's own component re-renders on every attribute change to
// <html> and calls mermaid.render() concurrently with ids that repeat across pages
// (they come from the markdown token index). Mermaid keeps one global config and one
// scratch element per id, so overlapping renders intermittently fail with "Syntax
// error in text" on diagrams that parse fine. Rendering one at a time, each under a
// fresh id, removes both races.

let chain: Promise<unknown> = Promise.resolve()
let counter = 0

export function renderMermaid(code: string, config: Record<string, unknown>): Promise<string> {
  const run = async () => {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ ...config, startOnLoad: false })
    const { svg } = await mermaid.render(`atlas-mmd-${++counter}`, code)
    return svg
  }
  const job = chain.then(run, run)
  chain = job.catch(() => undefined)
  return job
}
