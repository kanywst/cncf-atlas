# Getting Started

> Based on the official quick start. Commands assume Docker and a terminal with internet access.

## Prerequisites

- Docker, or a local Envoy binary from the official packages.
- A free local port for the proxy (10000) and one for the admin interface (9901).

## Install

The official distribution is a container image ([run Envoy quick start](https://www.envoyproxy.io/docs/envoy/latest/start/quick-start/run-envoy)):

```bash
docker pull envoyproxy/envoy:v1.38-latest
```

## A first working setup

This uses the demo configuration shipped in the repository at `configs/envoy-demo.yaml`: a listener on port 10000 that proxies to an upstream over TLS, plus an admin interface on 9901.

1. Save the configuration as `envoy-demo.yaml`:

   ```yaml
   admin:
     address:
       socket_address: { address: 0.0.0.0, port_value: 9901 }
   static_resources:
     listeners:
     - name: listener_0
       address:
         socket_address: { address: 0.0.0.0, port_value: 10000 }
       filter_chains:
       - filters:
         - name: envoy.filters.network.http_connection_manager
           typed_config:
             "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
             stat_prefix: ingress_http
             http_filters:
             - name: envoy.filters.http.router
               typed_config:
                 "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
             route_config:
               name: local_route
               virtual_hosts:
               - name: local_service
                 domains: ["*"]
                 routes:
                 - match: { prefix: "/" }
                   route:
                     host_rewrite_literal: www.envoyproxy.io
                     cluster: service_envoyproxy_io
     clusters:
     - name: service_envoyproxy_io
       type: LOGICAL_DNS
       dns_lookup_family: V4_ONLY
       lb_policy: ROUND_ROBIN
       load_assignment:
         cluster_name: service_envoyproxy_io
         endpoints:
         - lb_endpoints:
           - endpoint:
               address:
                 socket_address: { address: www.envoyproxy.io, port_value: 443 }
       transport_socket:
         name: envoy.transport_sockets.tls
         typed_config:
           "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
           sni: www.envoyproxy.io
   ```

2. Run Envoy with that config mounted into the container:

   ```bash
   docker run --rm -it \
     -v "$(pwd)/envoy-demo.yaml:/etc/envoy/envoy.yaml" \
     -p 10000:10000 -p 9901:9901 \
     envoyproxy/envoy:v1.38-latest
   ```

3. Send a request through the proxy:

   ```bash
   curl -s http://localhost:10000/ -o /dev/null -w "%{http_code}\n"
   ```

   A successful proxy returns an HTTP status from the upstream (a `200`).

## Verify it works

Check the admin interface. The server info and stats endpoints confirm the process is live:

```bash
curl -s http://localhost:9901/server_info | head
curl -s http://localhost:9901/stats | grep ingress_http
```

The `server_info` output reports `state: LIVE` when Envoy has finished initialization.

## Where to go next

For production concerns (xDS dynamic configuration from a control plane, TLS termination, observability, and hot restart) see the [official Envoy documentation](https://www.envoyproxy.io/). To run Envoy as a mesh data plane rather than a standalone proxy, a control plane such as Istio configures it over xDS ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/)).
