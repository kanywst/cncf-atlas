# Internals

> Read from the source at commit `24db054`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `webapp/src/main/java/io/github/microcks/web` | Per-protocol mock controllers and invocation processors; the live mock endpoints |
| `webapp/src/main/java/io/github/microcks/service` | Import and test orchestration (`ServiceService`, `MessageService`, `TestService`, `TestRunnerService`) |
| `webapp/src/main/java/io/github/microcks/util` | Artifact importers under `openapi`, `asyncapi`, `postman`, `soapui`, `har`, `graphql`, `grpc` |
| `webapp/src/main/java/io/github/microcks/repository` | Spring Data Mongo repositories (`ResponseRepository`, `ServiceRepository`, `ResourceRepository`) |
| `commons/model/src/main/java/io/github/microcks/domain` | Domain model (`Service`, `Operation`, `Response`, `Message`) |
| `minions/async/src/main/java/io/github/microcks/minion/async/producer` | Quarkus async broker producers |

## Core data structures

The whole system turns on three domain types.

`Service` (`Service.java:27`) is the unit a mock represents: a `name` (`Service.java:31`), a `version` (`Service.java:32`), a `type` (`Service.java:34`), and a `List<Operation>` (`Service.java:38`).

`Operation` (`Operation.java:32`) decides how matching works for one API operation. It holds a `dispatcher` (`Operation.java:48`) naming the dispatch style and `dispatcherRules` (`Operation.java:49`) parameterising it.

`Response` (`Response.java:26`) extends `Message` and is the response actually returned. Its fields are `status` (`Response.java:30`), `mediaType` (`Response.java:31`), `dispatchCriteria` (`Response.java:32`), `callbackName` (`Response.java:33`), and `isFault` (`Response.java:34`). The `dispatchCriteria` string is the key the whole matching scheme is built around.

## A path worth tracing

The interesting code is the symmetric `dispatchCriteria`: one string format is computed at import time and recomputed at request time, so response selection is a single exact-match query rather than a per-request rule evaluation.

At import time, the OpenAPI importer fills in the criteria for each example. `completeDispatchCriteriaAndResourcePaths(...)` (`OpenAPIImporter.java:806`) builds the string from the dispatcher rules and the example's parts and query parameters:

```java
dispatchCriteria = DispatchCriteriaHelper.buildFromParamsMap(rootDispatcherRules, queryParams);
// ...
dispatchCriteria = DispatchCriteriaHelper.buildFromPartsMap(rootDispatcherRules, parts);
```

That string is persisted on `Response.dispatchCriteria`. The same `completeDispatchCriteriaAndResourcePaths` is reachable from the operation-import paths at `OpenAPIImporter.java:656` and `OpenAPIImporter.java:761`.

At request time, `computeDispatchCriteria(...)` (`RestInvocationProcessor.java:327`) rebuilds a string in the same format from the live request. The `switch (dispatcher)` (`RestInvocationProcessor.java:342`) selects the builder per style: URI styles call `DispatchCriteriaHelper.extractFromURIPattern`, while `SCRIPT`/`GROOVY` run user script:

```java
dispatchCriteria = (String) scriptEngine.eval(script, scriptContext);
```

Response lookup is then one query. `getResponse(...)` (`RestInvocationProcessor.java:450`) calls:

```java
List<Response> responses = responseRepository.findNonCallbackByOperationIdAndDispatchCriteria(
      IdBuilder.buildOperationId(ic.service(), ic.operation()), dispatchContext.dispatchCriteria());
```

backed by an exact-match Mongo query (`ResponseRepository.java:42-43`):

```java
@Query("{ 'operationId' : ?0, 'dispatchCriteria' : ?1 , 'callbackName' : { '$exists' : false }}")
List<Response> findNonCallbackByOperationIdAndDispatchCriteria(String operationId, String dispatchCriteria);
```

When that returns nothing, `getResponse` retries treating the criteria as a response name (`RestInvocationProcessor.java:464`), which is how `SCRIPT` and `JSON_BODY` dispatchers (whose script returns a response name) resolve.

## Things that surprised me

- Most matching logic is not at request time. It is precomputed into a string at import and resolved at runtime by string equality, so the hot path is a single indexed Mongo lookup rather than rule evaluation. Criteria keys are sorted, so query-parameter order does not change the result.
- An operation whose `dispatcher` is null falls back to returning any one response via `getOneForOperation(...)` (`RestInvocationProcessor.java:294`).
- OpenTelemetry explain tracing is woven through the hot path (`RestInvocationProcessor.java:159-262`): dispatcher selection, response lookup, fallback use, delay, and proxy are emitted as span events, so a trace explains why a given response was returned.
- `SCRIPT`/`GROOVY`/`JS` dispatchers call `scriptEngine.eval(...)` at request time on user-supplied script (`RestInvocationProcessor.java:360`), so dispatch can be arbitrary user logic, not just declarative rules.
