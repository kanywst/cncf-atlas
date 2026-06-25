# Getting Started

> Verified against `pack` v0.40.7. Commands assume a running Docker daemon, because `pack build` produces the image in the local Docker daemon.

## Prerequisites

- Docker running locally.
- The `pack` CLI installed (below).

## Install

```bash
brew install buildpacks/tap/pack
```

## A first working setup

The shortest path to a runnable image is to build an app directory with a Paketo builder, then run it.

1. From your application source directory, build an image with a Paketo builder.

   ```bash
   pack build my-app --builder paketobuildpacks/builder-jammy-base
   ```

2. Run the resulting image.

   ```bash
   docker run -d -p 8080:8080 -e PORT=8080 my-app
   ```

To follow the official tutorial against a sample app instead, build the bundled Java sample with the sample builder.

```bash
pack build sample-app --path samples/apps/java-maven --builder cnbs/sample-builder:resolute
```

## Verify it works

- `pack builder suggest` lists candidate builders.
- `pack config default-builder <builder>` sets a default so you can omit `--builder`.
- After `docker run`, confirm the container is serving on the mapped port (`http://localhost:8080`).

## Where to go next

- Paketo builder reference and production builders: [paketo.io/docs/howto/builders](https://paketo.io/docs/howto/builders/).
- Official app-developer tutorials and concepts: [buildpacks.io docs](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/).

## Sources

1. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
2. [Basic App tutorial (buildpacks.io docs)](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/)
