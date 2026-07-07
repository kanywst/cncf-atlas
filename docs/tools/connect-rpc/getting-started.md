# Getting Started

> Based on the README example at commit `765b3c6`, with `v1.20.0` the nearest tag. Commands assume a Unix-like shell and a Go 1.25 toolchain (`src/go.mod:3`).

## Prerequisites

- Go 1.25 or newer.
- The `buf` CLI for code generation.
- The `protoc-gen-go` and `protoc-gen-connect-go` plugins for generating messages and Connect stubs.

## Install

Add the library, then install the code-generation tools:

```bash
go get connectrpc.com/connect
go install github.com/bufbuild/buf/cmd/buf@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
```

## A first working setup

The shortest path that runs is a Go server and a Go client for one service. Point the generated import path at your own Go module path.

Step 1, define the service in a `.proto` file, then generate code with `buf generate`. Your `buf.gen.yaml` lists `protoc-gen-go` and `protoc-gen-connect-go` side by side, which produces the message types and a `*.connect.go` file with `NewXxxServiceHandler` and `NewXxxServiceClient`.

```bash
buf generate
```

Step 2, mount the generated handler on an `http.ServeMux` and serve it. The README example listens on `localhost:8080`:

```go
mux := http.NewServeMux()
path, handler := greetv1connect.NewGreetServiceHandler(&greetServer{})
mux.Handle(path, handler)
http.ListenAndServe("localhost:8080", mux)
```

If gRPC clients must reach this server over cleartext HTTP/2 (h2c), enable it on the server's `http.Protocols` with `SetUnencryptedHTTP2(true)`.

Step 3, build a client against that address and call the method directly:

```go
client := greetv1connect.NewGreetServiceClient(
    http.DefaultClient, "http://localhost:8080/")
res, err := client.Greet(context.Background(),
    connect.NewRequest(&greetv1.GreetRequest{Name: "World"}))
```

## Verify it works

Because a unary Connect call is plain HTTP, you can check the server with `curl` and no generated client at all. Against the public demo service:

```bash
curl \
    --header "Content-Type: application/json" \
    --data '{"sentence": "I feel happy."}' \
    https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
```

A JSON response body means the handler, codec, and protocol negotiation are wired correctly. Point the same request at your own `localhost:8080` service to confirm it locally.

## Where to go next

The official Go getting-started guide covers streaming, interceptors, and error handling in depth (<https://connectrpc.com/docs/go/getting-started/>). For production concerns such as TLS, compression, and observability with `otelconnect`, follow the Connect documentation rather than the plaintext defaults used here.
