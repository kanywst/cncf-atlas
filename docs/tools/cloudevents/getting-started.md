# Getting Started

> Verified against `sdk-go` at commit `1e99396`. Commands assume Go is installed; the `v2/go.mod` module declares `go 1.25.0`.

## Prerequisites

- Go 1.25 or newer (the `v2` module sets `go 1.25.0` in `v2/go.mod`).
- A reachable HTTP endpoint to receive events, or the receiver from the second step below.

## Install

```bash
go get github.com/cloudevents/sdk-go/v2
```

## A first working setup

The shortest path that does the core job is to send a CloudEvent over HTTP and receive it. This minimal sender is reduced from `samples/http/sender/main.go`.

Step 1. Create a sender. `WithTimeNow` and `WithUUIDs` fill in the `time` and `id` attributes so the event passes validation. The target endpoint is set as `http://localhost:8080/` in code.

```go
package main

import (
    "context"
    "log"

    cloudevents "github.com/cloudevents/sdk-go/v2"
)

func main() {
    ctx := cloudevents.ContextWithTarget(context.Background(), "http://localhost:8080/")

    p, err := cloudevents.NewHTTP()
    if err != nil {
        log.Fatal(err)
    }
    c, err := cloudevents.NewClient(p, cloudevents.WithTimeNow(), cloudevents.WithUUIDs())
    if err != nil {
        log.Fatal(err)
    }

    e := cloudevents.NewEvent()
    e.SetType("com.example.sent")
    e.SetSource("example/sender")
    _ = e.SetData(cloudevents.ApplicationJSON, map[string]string{"msg": "hello"})

    if res := c.Send(ctx, e); cloudevents.IsUndelivered(res) {
        log.Printf("failed: %v", res)
    }
}
```

Step 2. Run a receiver in a second program to see the event arrive. `StartReceiver` binds the HTTP listener and dispatches each event to the handler.

```go
package main

import (
    "context"
    "log"

    cloudevents "github.com/cloudevents/sdk-go/v2"
)

func main() {
    c, err := cloudevents.NewClientHTTP()
    if err != nil {
        log.Fatal(err)
    }
    log.Fatal(c.StartReceiver(context.Background(), func(e cloudevents.Event) {
        log.Printf("got event: %s", e)
    }))
}
```

Step 3. Start the receiver, then run the sender in another shell.

```bash
go run ./receiver
go run ./sender
```

## Verify it works

The receiver logs the event it got, including the `id`, `source`, `type`, and the JSON data. On the sender side, `cloudevents.IsUndelivered(res)` returns false for a delivered event, so no failure line is printed. If the receiver is not running, the sender logs a `failed:` line with the transport error.

## Where to go next

- Other transports: the `v2/protocol/` modules cover Kafka, MQTT, AMQP, NATS, and GCP Pub/Sub; see the matching directories under `samples/`.
- The [CloudEvents Core Specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md) for the full attribute and binding rules.
- The [CloudEvents Primer](https://github.com/cloudevents/spec/blob/main/cloudevents/primer.md) for the design rationale.
- The [sdk-go package reference](https://pkg.go.dev/github.com/cloudevents/sdk-go/v2) for the full API.
