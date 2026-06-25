# Internals

> Read from the source at commit `3d8a562`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `c7n/cli.py` | argparse CLI and entry point `main` |
| `c7n/commands.py` | subcommand implementations; `run` loops policies (`c7n/commands.py:290`) |
| `c7n/policy.py` | `Policy` class and the `execution` mode registry |
| `c7n/query.py` | `QueryResourceManager`, `TypeInfo`, `ResourceQuery`, the `QueryMeta` metaclass |
| `c7n/manager.py` | `ResourceManager` base and `filter_resources` |
| `c7n/registry.py` | `PluginRegistry`, the string-to-class map |
| `c7n/filters/` | filter base classes and generic filters such as `value` |
| `c7n/actions/` | action base classes |
| `c7n/schema.py` | runtime JSON Schema generation and policy validation |
| `c7n/resources/` | the AWS resource implementations (around 120 files) |
| `tools/c7n_*` | provider packages (Azure, GCP, OCI, Tencent, Kubernetes) and helpers |

## Core data structures

`Policy` (`c7n/policy.py:1168`) wraps one YAML block and holds its resource manager, conditions, and execution context. `execution_mode` reads `mode.type`, defaulting to `pull` when absent:

```python
def execution_mode(self):
    return self.data.get('mode', {'type': 'pull'})['type']
```

That is `c7n/policy.py:1229-1230`.

`PluginRegistry` (`c7n/registry.py:5`) is the spine of the plugin model. Its `register` works both as a function call and as a class decorator, and in both paths it sets `klass.type = name` so the class knows its own DSL key (`c7n/registry.py:48-68`).

`QueryResourceManager` (`c7n/query.py:452`) and `TypeInfo` (`c7n/query.py:796`) form the per-resource metamodel. A `TypeInfo` declares `service`, `enum_spec`, `id`, `filter_name`, `arn_type`, `config_type`, and similar fields. EC2 is a compact example (`c7n/resources/ec2.py:125-157`):

```python
class resource_type(query.TypeInfo):
    service = 'ec2'
    arn_type = 'instance'
    enum_spec = ('describe_instances', 'Reservations[]', None)
    id = 'InstanceId'
    filter_name = 'InstanceIds'
```

`source_mapping` on the same class switches between the `describe` source and the AWS Config source (`c7n/resources/ec2.py:154-157`).

The filter contract is `Filter.process(resources, event)` (`c7n/filters/core.py:198`, `c7n/filters/core.py:206`). A `FilterRegistry` pre-registers the boolean and value combinators every resource gets for free (`c7n/filters/core.py:124-132`):

```python
self.register('value', ValueFilter)
self.register('or', Or)
self.register('and', And)
self.register('not', Not)
self.register('event', EventFilter)
self.register('reduce', ReduceFilter)
self.register('list-item', ListItemFilter)
```

## A path worth tracing

`PullMode.run` is the core loop (`c7n/policy.py:307`). It checks `is_runnable`, fetches resources, writes them to disk, honours dry run, then runs actions:

```text
PullMode.run (c7n/policy.py:307)
  -> resource_manager.resources()            c7n/policy.py:330
  -> ctx.output.write_file('resources.json') c7n/policy.py:351
  -> if dryrun: return                       c7n/policy.py:357
  -> for a in actions: a.process(resources)  c7n/policy.py:364
```

`QueryResourceManager.resources` adds caching, augmentation, and a circuit breaker (`c7n/query.py:526`). It returns the cache when warm, otherwise fetches through `self.source.resources(query)`, augments with tags, saves to cache, filters, and then calls `check_resource_limit`. The fetch ends at `ResourceQuery._invoke_client_enum`, which pages with boto3 and extracts the array with jmespath (`c7n/query.py:49-64`):

```python
if client.can_paginate(enum_op):
    p = client.get_paginator(enum_op)
    results = p.paginate(**params)
    data = results.build_full_result()
if path:
    path = jmespath_compile(path)
    data = path.search(data)
```

Filtering is sequential and short-circuits. `filter_resources` iterates the filters and stops as soon as the set is empty (`c7n/manager.py:102-113`).

## Things that surprised me

The DSL and its validation schema are not static. The `QueryMeta` metaclass (`c7n/query.py:179`) runs when a resource class with a `resource_type` is defined. It auto-creates a per-resource `FilterRegistry` and `ActionRegistry` (`c7n/query.py:185-190`), and it inspects the type: if `service == 'ec2'` it wires EC2 tag filters and actions, and if `universal_taggable` is set it registers universal tag support (`c7n/query.py:198-207`). So a resource gets tag handling by declaration, not by hand.

The validation schema is then assembled from those registries at runtime by `schema.generate()` (`c7n/schema.py:359`) and enforced by `jsonschema.Draft7Validator` in `schema.validate()` (`c7n/schema.py:56`, `c7n/schema.py:22`). The result: adding a plugin extends both what policies can express and what the validator accepts, with no separate schema file to keep in sync.

One more detail in the run path: even outside dry run, `Policy.__call__` routes a dry run through `PullMode` explicitly rather than the declared mode (`c7n/policy.py:1374-1388`), so you can preview a serverless policy without provisioning a Lambda.
