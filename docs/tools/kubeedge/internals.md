# Internals

> Read from the source at commit `864f45eb1`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `staging/src/github.com/kubeedge/beehive` | The message framework: module registration, the bus, restart policies. |
| `cloud/pkg` | cloudcore modules: cloudhub, edgecontroller, devicecontroller, synccontroller, dynamiccontroller. |
| `edge/pkg` | edgecore modules: edged, edgehub, metamanager, devicetwin, eventbus. |
| `edge/pkg/metamanager/dao` | The edge-local SQLite store accessed through gorm. |
| `keadm/cmd/keadm` | The installer CLI: `init`, `join`, `gettoken`. |

## Core data structures

`model.Message` is the unit on the bus. It is a `MessageHeader`, a `MessageRoute`, and an opaque `Content interface{}` (`staging/src/github.com/kubeedge/beehive/pkg/core/model/message.go:47-86`). The header's `ResourceVersion` field carries the Kubernetes object resource version and, per its comment, is what KubeEdge leverages for reliable transmission (`message.go:77-80`). The route's `Operation` vocabulary is insert/delete/query/update/patch/response/error and similar (`message.go:14-23`), and the resource type vocabulary covers pod, node, configmap, secret, serviceaccounttoken, lease, and certificatesigningrequest (`message.go:25-43`).

`core.Module` is the interface every module satisfies, with `RestartPolicy` returning a `*ModuleRestartPolicy` (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:47-61`). `ModuleRestartPolicy` carries the restart type (Always or OnFailure), a retry count, an interval, and an `IntervalTimeGrowthRate` for backoff (`module.go:27-44`).

The edge store has two gorm models. `Meta` is a flat key/value row: `Key` (primary key, size 256), `Type` (size 32), and `Value` (text) (`edge/pkg/metamanager/dao/models/meta.go:20-29`). `MetaV2` records a full Kubernetes API object with its group/version/resource, namespace, name, and `ResourceVersion`, which is what lets the edge serve list/watch through MetaServer (`edge/pkg/metamanager/dao/models/meta.go:32-44`).

## A path worth tracing

Follow a message arriving from the cloud on the edge. `routeToEdge` blocks on `chClient.Receive()`, and on error pushes to `reconnectChan` and returns so the connection is rebuilt (`edge/pkg/edgehub/process.go:42-61`).

```go
message, err := eh.chClient.Receive()
if err != nil {
    klog.Errorf("websocket read error: %v", err)
    eh.reconnectChan <- struct{}{}
    return
}
```

`dispatch` forwards to `ProcessHandler` (`edge/pkg/edgehub/process.go:38-40`), which iterates the registered handlers and runs the first that filters true:

```go
for _, handle := range handlers {
    if handle.Filter(&message) {
        if err := handle.Process(&message, client); err != nil {
            return fmt.Errorf("failed to handle message, ...: %+v", err)
        }
        return nil
    }
}
return fmt.Errorf("... no handler found ...")
```

That loop is in `edge/pkg/edgehub/messagehandler/handler.go:61-74`. The handler slice is built in order meta, twin, bus, task by `RegisterHandlers` (`handler.go:51-58`), so registration order decides priority. Each handler is a `SimpleHandler` with a `FilterFunc` and `ProcessFunc` (`handler.go:34-46`).

## Things that surprised me

The cloud link is not a request/response API; it is a single duplex stream with a heartbeat. `keepalive` builds a keepalive message and sends a ping every `Config.Heartbeat` seconds, and any send failure tears the connection down through `reconnectChan` (`edge/pkg/edgehub/process.go:106-128`).

Beehive's restart logic is per-module and uses geometric backoff. `localModuleKeeper` reads the module's policy, returns immediately when the policy is nil, and otherwise loops restarting the module, stopping once `restartCount` passes `policy.Retries` (`staging/src/github.com/kubeedge/beehive/pkg/core/core.go:96-145`). The interval grows through `calculateIntervalTime`, which multiplies by the growth rate but ignores a rate of 1 or less and caps at a limit that defaults to 30 seconds (`core.go:157-173`).

A disabled module is recorded, not silently dropped. `Register` puts a module whose `Enable()` is false into `disabledModules` and logs a warning, keeping the registry honest about what was asked for versus what runs (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:76-95`).
