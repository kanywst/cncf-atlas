# Internals

> Read from the source at commit `604bdcb`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `shared/src/akri/configuration.rs` | Configuration CRD types (`ConfigurationSpec`, `BrokerSpec`) |
| `shared/src/akri/instance.rs` | Instance CRD type (`InstanceSpec`) and its fields |
| `agent/src/main.rs` | Agent entry point and startup tasks |
| `agent/src/discovery_handler_manager/discovery_handler_registry.rs` | DH registry, device hashing, Instance generation |
| `agent/src/device_manager/cdi.rs` | Container Device Interface (CDI) schema and conversions |
| `agent/src/util/discovery_configuration_controller.rs` | Configuration reconcile loop on the Agent |
| `controller/src/main.rs` | Controller entry point and watchers |
| `controller/src/util/instance_action.rs` | `InstanceAction` enum and broker management logic |
| `discovery-utils/proto/discovery.proto` | gRPC Registration and DiscoveryHandler services |

## Core data structures

The system turns on a small set of types.

- `ConfigurationSpec` at `shared/src/akri/configuration.rs:114` is the user declaration of what to discover.
- `InstanceSpec` at `shared/src/akri/instance.rs:54` is one discovered device plus its usage slots; the `device_usage` map is at `shared/src/akri/instance.rs:90`.
- `DiscoveredDevice` is an enum with `LocalDevice(Device, String)` and `SharedDevice(Device)` variants at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:52`. The `String` on the local variant is the node name. This enum is the input to the Instance name hash.
- `DHRequestImpl` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:172` is the one discovery request per Configuration; it aggregates results from multiple DH endpoints through a vector of `watch::Receiver` channels.
- The CDI `Device` at `agent/src/device_manager/cdi.rs:11` and `ContainerEdit` at `agent/src/device_manager/cdi.rs:21` represent how a device is injected into a container.

## A path worth tracing

Follow how a discovered device becomes an Instance with a stable name.

When the Agent receives devices from a DH, `get_instances` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:186` maps each one through `device_to_instance` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:213`. That function builds the `InstanceSpec` and sets the Instance metadata name from the configuration key joined with a per device hash at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:239`:

```rust
            metadata: ObjectMeta {
                name: Some(format!("{}-{}", self.key, dev.device_hash())),
                ..Default::default()
            },
```

The CDI fully qualified name is built the same way at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:246` as `format!("{}/{}={}", AKRI_PREFIX, self.key, dev.device_hash())`. So both the Instance name and the CDI name depend on `device_hash`.

## Things that surprised me

The whole shared versus local behavior lives in `device_hash` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:63`:

```rust
    fn device_hash(&self) -> String {
        let (id_to_digest, shared, node_name) = match self {
            DiscoveredDevice::LocalDevice(d, n) => (d.id.to_owned(), false, n.as_str()),
            DiscoveredDevice::SharedDevice(d) => (d.id.to_owned(), true, ""),
        };
        let mut id_to_digest = id_to_digest.to_string();
        // For local devices, include node hostname in id_to_digest so instances have unique names
        if !shared {
            id_to_digest = format!("{id_to_digest}{node_name}");
        }
```

A shared device (an IP camera visible to several nodes) digests only its `id` with a 3 byte Blake2b hash, so whichever node discovers it resolves to the same Instance name, which is what makes "one device, one Instance, shared across nodes" work. A local device (a USB peripheral) appends the node name to the id before hashing at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:70`, so the same id on two nodes becomes two distinct Instances. The single `shared` boolean flips the whole ownership model.

The second non obvious choice is that device injection was rebuilt on the CDI schema. The module header records the exact spec version at `agent/src/device_manager/cdi.rs:1`. The conversion from a discovered device into a CDI device is `impl From<DiscoveredDevice> for cdi::Device` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:94`: a device's `properties` become `container_edits.env` entries at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:102`, while `device_specs` and `mounts` map to CDI `device_nodes` and `mounts` at `agent/src/discovery_handler_manager/discovery_handler_registry.rs:107`.

Third, the Agent's reconcile loop is self healing on a timer. A successful reconcile requeues after `SUCCESS_REQUEUE`, defined as 600 seconds at `agent/src/util/discovery_configuration_controller.rs:38`, while `error_policy` at `agent/src/util/discovery_configuration_controller.rs:176` doubles a per Configuration backoff that starts at 500 ms (`agent/src/util/discovery_configuration_controller.rs:181`). Reconcile also reacts to discovery state changes pushed through a channel, set up in `start_controller` at `agent/src/util/discovery_configuration_controller.rs:54`, so it does not depend on the timer alone.
