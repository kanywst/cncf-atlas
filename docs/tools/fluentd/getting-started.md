# Getting Started

> Verified against the v1.19 series. Commands assume a Unix shell with Ruby installed.

## Prerequisites

- Ruby 3.2 or later (`fluentd.gemspec:28`, README Prerequisites)

## Install

```bash
gem install fluentd
```

## A first working setup

The README Quick Start gets you from install to a confirmed event in four commands ([source 1](https://github.com/fluent/fluentd)).

1. Generate a sample configuration directory.

```bash
fluentd -s conf
```

1. Start Fluentd with that configuration in the background.

```bash
fluentd -c conf/fluent.conf &
```

1. Send a test event. `fluent-cat` ships with the gem and forwards a JSON record under the tag you give it.

```bash
echo '{"json":"message"}' | fluent-cat debug.test
```

The generated `conf/fluent.conf` includes a `<match debug.**>` block using the `stdout` output, so the event prints to the terminal where Fluentd is running.

## Verify it works

Look at the Fluentd output. A successful round trip prints a line tagged `debug.test` with your record, similar to:

```text
2026-06-23 12:00:00.000000000 +0000 debug.test: {"json":"message"}
```

If the event appears, input, routing, and output are all working.

## Where to go next

For production concerns such as high availability, buffer tuning, secure forward with TLS, and Kubernetes deployment via `fluent-operator` or Helm, see the official documentation and the `fluent` GitHub organization ([source 1](https://github.com/fluent/fluentd)).
