# Getting Started

> Verified against the `latest-snapshot` Docker image and the `main` source tree at commit `3443acd9`. Commands assume a Unix shell.

## Prerequisites

- Docker, to run the prebuilt image (the fastest path).
- For a source build instead: JDK 21, Maven (the bundled `./mvnw` wrapper works), and Git.

## Install

Run the server with the prebuilt image. This starts the registry with in-memory persistence on port 8080 (source 2):

```bash
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot
```

The REST API is then served at `http://localhost:8080/apis`.

To also run the web UI, start its image on a second port (source 2):

```bash
docker run -it -p 8888:8080 apicurio/apicurio-registry-ui:latest-snapshot
```

The UI is then served at `http://localhost:8888`.

## A first working setup

These steps register an Avro schema and read it back. They assume the server from the Install step is running on port 8080.

1. Create an artifact in the `default` group with a small Avro schema as its first version.

    ```bash
    curl -i -X POST \
      http://localhost:8080/apis/registry/v3/groups/default/artifacts \
      -H 'Content-Type: application/json' \
      -d '{
        "artifactId": "user-value",
        "artifactType": "AVRO",
        "firstVersion": {
          "content": {
            "content": "{\"type\":\"record\",\"name\":\"User\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"}]}",
            "contentType": "application/json"
          }
        }
      }'
    ```

    A successful call returns `HTTP/1.1 200 OK` with a JSON body describing the created artifact and its first version.

2. Read the latest version content back.

    ```bash
    curl -s \
      http://localhost:8080/apis/registry/v3/groups/default/artifacts/user-value/versions/branch=latest/content
    ```

    This prints the Avro schema you stored.

## Verify it works

List the artifacts in the `default` group and confirm `user-value` appears:

```bash
curl -s http://localhost:8080/apis/registry/v3/groups/default/artifacts
```

The JSON response includes an `artifacts` array with an entry whose `artifactId` is `user-value`. You can also open `http://localhost:8080/apis` in a browser to see the API landing page.

## Building from source

To run the server from source instead of Docker, build the fast tier and start Quarkus dev mode (source 2):

```bash
./mvnw clean install -Dfast -DskipTests
cd app
../mvnw quarkus:dev
```

This starts Quarkus with the in-memory registry and the REST API on `http://localhost:8080/apis`.

## Where to go next

In-memory persistence is for trials only. For production, choose a storage backend with `APICURIO_STORAGE_KIND` (`sql`, `kafkasql`, or `gitops`) and consult the official documentation for high availability, authentication, and the Kubernetes operator: <https://github.com/Apicurio/apicurio-registry>.
