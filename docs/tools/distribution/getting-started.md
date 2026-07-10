# Getting Started

> Verified against the `registry:3` image, the release line for `v3.1.1`. Commands assume Docker on the host.

## Prerequisites

- Docker installed and running. A registry is an instance of the `registry` image and runs inside Docker (deploying docs).
- A free local port; the examples use `5000`.

The default configuration shipped in the image is meant for development: it logs at `debug` level and enables OpenTelemetry export. For anything beyond a local test you need TLS and an access-control mechanism in front of it (deploying docs).

## Install

There is nothing to build. Run the official image:

```bash
docker run -d -p 5000:5000 --restart=always --name registry registry:3
```

The registry now listens on `localhost:5000`. This configuration is for testing only; a production registry must be protected by TLS (deploying docs).

## A first working setup

Push an image to the local registry and pull it back, which exercises the blob upload and blob GET paths end to end.

1. Pull a small public image to have something to push.

```bash
docker pull ubuntu:16.04
```

1. Tag it for the local registry. When the first part of a tag is a host and port, Docker treats it as a registry location on push.

```bash
docker tag ubuntu:16.04 localhost:5000/my-ubuntu
```

1. Push it. This runs the POST/PATCH/PUT blob upload session and finalizes each blob with a digest check.

```bash
docker push localhost:5000/my-ubuntu
```

1. Remove the local copies, then pull from your registry to prove it served the image back.

```bash
docker image remove ubuntu:16.04
docker image remove localhost:5000/my-ubuntu
docker pull localhost:5000/my-ubuntu
```

## Verify it works

The registry exposes the OCI Distribution API under `/v2/`. A base check returns `200`:

```bash
curl -s http://localhost:5000/v2/
```

To confirm the push landed, list the repository's tags through the API:

```bash
curl -s http://localhost:5000/v2/my-ubuntu/tags/list
```

A JSON body naming `my-ubuntu` and its tag means the blobs were stored, linked, and are being served back.

## Where to go next

For storage drivers (S3, GCS, Azure Blob), TLS, authentication, and running behind a load balancer, follow the configuration and deployment guides in the official documentation at <https://distribution.github.io/distribution/>. Production registries are usually run as a component of a larger product such as Harbor rather than bare, since Distribution itself does not include RBAC, scanning, or a UI.
