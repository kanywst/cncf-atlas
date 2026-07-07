# Getting Started

> Verified against the source at commit `0d888c2` (near tag `v0.21.2`). Commands assume Docker with BuildKit and a local clone of the repository.

## Prerequisites

- Docker with BuildKit (the default in modern Docker), so `docker build` can run a custom frontend.
- Network access to pull the Dalec frontend image from `ghcr.io`.
- `git` to clone the repository for the bundled example.

There is nothing to install for Dalec itself. The frontend is a container image, and `docker build` pulls it automatically from the `# syntax=` line at the top of the spec (`docs/examples/hello.inline.yml:1`). Pin that reference to a released tag in real use instead of `latest`.

## Install

Clone the repository to get the example spec:

```bash
git clone https://github.com/project-dalec/dalec.git
cd dalec
```

The example's first line is the frontend reference that makes it a Dalec build:

```yaml
# syntax=ghcr.io/project-dalec/dalec/frontend:latest
```

## A first working setup

`docs/examples/hello.inline.yml` is the smallest real spec: an inline C source, a `gcc` build, an installed binary, and tests that run it. The target after `--target` selects both the distro and the output kind.

1. Build the RPM for Azure Linux 3 and write it to a local directory. The `azlinux3/rpm` target produces the package; `--output` exports it to `_output`.

```bash
docker build -f docs/examples/hello.inline.yml --target=azlinux3/rpm --output=_output .
```

1. Build the minimal container instead, with the package installed. The `azlinux3` target (no `/rpm` suffix) produces the image and tags it `hello-inline:dev`.

```bash
docker build -f docs/examples/hello.inline.yml --target=azlinux3 -t hello-inline:dev .
```

1. Run the resulting image to confirm the installed binary works.

```bash
docker run --rm hello-inline:dev
```

## Verify it works

After the first command, the RPM appears under `_output/`:

```bash
ls _output
```

After the second and third commands, the container runs the installed binary and prints its output. The spec also declares tests that Dalec runs during the build (`Tests []*TestSpec`, `spec.go:103`), so a green `docker build` means the package built, installed, and passed its declared checks in one pass.

## Where to go next

For signing, SBOM and provenance attestation, source generators (gomod, cargohome, pip), DEB targets (Debian, Ubuntu), and Windows targets, follow the official documentation at <https://project-dalec.github.io/dalec/>. The `docs/examples/` directory in the repository holds further specs (Git and HTTP sources, patches, multi-artifact builds) to copy from.
