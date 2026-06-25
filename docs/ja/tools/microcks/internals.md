# 内部実装

> コミット `24db054` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `webapp/src/main/java/io/github/microcks/web` | 各プロトコルのモックコントローラと invocation processor。ライブのモックエンドポイント |
| `webapp/src/main/java/io/github/microcks/service` | import とテストのオーケストレーション (`ServiceService`, `MessageService`, `TestService`, `TestRunnerService`) |
| `webapp/src/main/java/io/github/microcks/util` | `openapi`, `asyncapi`, `postman`, `soapui`, `har`, `graphql`, `grpc` 配下の importer |
| `webapp/src/main/java/io/github/microcks/repository` | Spring Data Mongo repository (`ResponseRepository`, `ServiceRepository`, `ResourceRepository`) |
| `commons/model/src/main/java/io/github/microcks/domain` | ドメインモデル (`Service`, `Operation`, `Response`, `Message`) |
| `minions/async/src/main/java/io/github/microcks/minion/async/producer` | Quarkus の async ブローカー producer |

## 中核データ構造

システム全体は 3 つのドメイン型で回転する。

`Service` (`Service.java:27`) はモックが表す単位で、`name` (`Service.java:31`)、`version` (`Service.java:32`)、`type` (`Service.java:34`)、`List<Operation>` (`Service.java:38`) を持つ。

`Operation` (`Operation.java:32`) は 1 つの API operation でマッチングがどう動くかを決める。dispatch style を表す `dispatcher` (`Operation.java:48`) と、それをパラメータ化する `dispatcherRules` (`Operation.java:49`) を持つ。

`Response` (`Response.java:26`) は `Message` を継承し、実際に返される応答である。フィールドは `status` (`Response.java:30`)、`mediaType` (`Response.java:31`)、`dispatchCriteria` (`Response.java:32`)、`callbackName` (`Response.java:33`)、`isFault` (`Response.java:34`)。`dispatchCriteria` 文字列がマッチング全体を支える鍵である。

## 追う価値のあるパス

面白いのは対称的な `dispatchCriteria` である。1 つの文字列フォーマットを import 時に計算し、リクエスト時に再計算するため、応答選択はリクエスト毎のルール評価ではなく完全一致クエリ 1 回になる。

import 時、OpenAPI importer が各 example の criteria を埋める。`completeDispatchCriteriaAndResourcePaths(...)` (`OpenAPIImporter.java:806`) が dispatcher rules と example の parts / query パラメータから文字列を組む:

```java
dispatchCriteria = DispatchCriteriaHelper.buildFromParamsMap(rootDispatcherRules, queryParams);
// ...
dispatchCriteria = DispatchCriteriaHelper.buildFromPartsMap(rootDispatcherRules, parts);
```

この文字列が `Response.dispatchCriteria` に保存される。同じ `completeDispatchCriteriaAndResourcePaths` は operation の import パス (`OpenAPIImporter.java:656`, `OpenAPIImporter.java:761`) から到達できる。

リクエスト時、`computeDispatchCriteria(...)` (`RestInvocationProcessor.java:327`) が生きたリクエストから同じ形式の文字列を組み直す。`switch (dispatcher)` (`RestInvocationProcessor.java:342`) がスタイルごとに builder を選ぶ。URI 系は `DispatchCriteriaHelper.extractFromURIPattern` を呼び、`SCRIPT`/`GROOVY` はユーザスクリプトを実行する:

```java
dispatchCriteria = (String) scriptEngine.eval(script, scriptContext);
```

応答 lookup はクエリ 1 回。`getResponse(...)` (`RestInvocationProcessor.java:450`) は次を呼ぶ:

```java
List<Response> responses = responseRepository.findNonCallbackByOperationIdAndDispatchCriteria(
      IdBuilder.buildOperationId(ic.service(), ic.operation()), dispatchContext.dispatchCriteria());
```

これは MongoDB の完全一致クエリで支えられる (`ResponseRepository.java:42-43`):

```java
@Query("{ 'operationId' : ?0, 'dispatchCriteria' : ?1 , 'callbackName' : { '$exists' : false }}")
List<Response> findNonCallbackByOperationIdAndDispatchCriteria(String operationId, String dispatchCriteria);
```

これが何も返さないと、`getResponse` は criteria を response 名とみなして再検索する (`RestInvocationProcessor.java:464`)。`SCRIPT` や `JSON_BODY` の dispatcher (スクリプトが response 名を返す) はこの経路で解決する。

## 読んで驚いた点

- マッチングロジックの大半はリクエスト時にはない。import 時に文字列へ事前計算され、実行時は文字列等価で解決される。だからホットパスはルール評価ではなくインデックス済みの Mongo lookup 1 回である。criteria のキーはソート済みなので、クエリパラメータの順序は結果を変えない。
- `dispatcher` が null の operation は `getOneForOperation(...)` (`RestInvocationProcessor.java:294`) で何か 1 つの応答を返すフォールバックになる。
- OpenTelemetry の explain tracing がホットパス全体に織り込まれている (`RestInvocationProcessor.java:159-262`)。dispatcher 選択、response lookup、fallback 利用、delay、proxy が span event として出るため、トレースがなぜその応答を返したかを説明する。
- `SCRIPT`/`GROOVY`/`JS` dispatcher はリクエスト時にユーザ提供スクリプトを `scriptEngine.eval(...)` で実行する (`RestInvocationProcessor.java:360`)。dispatch は宣言的ルールに限らず任意のユーザロジックになりうる。
