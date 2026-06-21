# Architecture

## Big picture

{One paragraph plus, if useful, a diagram described in text or a Mermaid block. What are the top-level components and what does each own?}

## Components

### {Component A}

{Responsibility, where it runs, what it talks to. Reference the package/directory: `path/in/repo`.}

### {Component B}

{...}

## How a request flows

{Trace one representative operation end to end: e.g. a reconcile loop, an admission request, a query. Step through the components it touches, with `file:line` anchors at the key hops.}

## Key design decisions

{The trade-offs the maintainers made and why: consistency model, push vs pull, sync vs async, extension points. Tie each to a design doc or proposal where possible.}

## Extension points

{Plugins, webhooks, CRDs, interfaces meant for third parties to implement.}
