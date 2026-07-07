# Getting Started

> Verified against the `cdk8s` engine at commit `558f788` (npm `cdk8s`, latest release `v2.70.80`). Commands assume Node.js 18 or newer and npm on a Unix-like shell.

## Prerequisites

- Node.js 18+ and npm.
- A terminal. No Kubernetes cluster is needed to synthesize; you only need one when you apply the output.

## Install

The official shortest path is the command line tool, which scaffolds a project and pulls in the `cdk8s` engine for you.

```bash
npm install -g cdk8s-cli
```

## A first working setup

This produces a manifest from TypeScript and writes it to disk.

1. Create and enter a project directory.

    ```bash
    mkdir hello-cdk8s && cd hello-cdk8s
    ```

2. Scaffold a TypeScript app. This generates `main.ts`, installs dependencies, and writes a `cdk8s.yaml` config whose `output` directory must match the `App` `outdir`.

    ```bash
    cdk8s init typescript-app
    ```

3. Replace the body of `main.ts` so the chart defines one resource. The `App`, `Chart`, and `ApiObject` classes come from `cdk8s`.

    ```typescript
    import { App, Chart, ApiObject } from 'cdk8s';
    import { Construct } from 'constructs';

    class MyChart extends Chart {
      constructor(scope: Construct, id: string) {
        super(scope, id);

        new ApiObject(this, 'configmap', {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          data: { hello: 'world' },
        });
      }
    }

    const app = new App();
    new MyChart(app, 'hello');
    app.synth();
    ```

4. Synthesize. The CLI compiles the code and runs the app, writing one file per chart into `dist/`.

    ```bash
    cdk8s synth
    ```

## Verify it works

List the output and inspect the generated manifest.

```bash
ls dist/
cat dist/hello.k8s.yaml
```

You should see a `hello.k8s.yaml` file whose content begins with the resource header, with `apiVersion`, `kind`, and `metadata` ordered first (the key ordering is enforced at `src/api-object.ts:215`):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hello-configmap-c87d4c10
data:
  hello: world
```

The exact name suffix is an 8 character hash derived from the construct address (`src/names.ts:202`), so it will differ in your output.

## Where to go next

- Apply the synthesized manifest yourself: `kubectl apply -f dist/`. CDK8s never talks to a cluster.
- For typed workload classes (Pod, Deployment, Service) instead of raw `ApiObject`, add the `cdk8s-plus` library.
- To generate typed constructs from CRDs or the Kubernetes API, use `cdk8s import` from the CLI.
- See the official documentation at [cdk8s.io](https://cdk8s.io) for production topics such as multi chart apps, resolvers, and importing Helm charts.
