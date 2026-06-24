# 内部実装

> コミット `e96fd14b8` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/containerd` | デーモンのエントリポイント。組み込みプラグインを選ぶ |
| `cmd/containerd-shim-runc-v2` | コンテナごとに exec される runc shim バイナリ |
| `core/runtime/v2` | タスク・shim のライフサイクル: TaskManager、ShimManager、bundle、binary |
| `core/containers` | コンテナメタデータの型とストア |
| `core/content`, `core/snapshots`, `core/diff` | ブロブストア、レイヤ snapshot、レイヤの diff/apply |
| `core/metadata` | bolt による永続化 |
| `core/remotes` | レジストリの pull/push |
| `plugins/services/*` | core 上の gRPC サービスプラグイン |
| `plugins/cri` | Kubernetes CRI 実装 |
| `client/` | Go クライアント SDK |

## 中核データ構造

`runtime.CreateOpts` (`core/runtime/runtime.go:36`) はタスク作成の入力一式。OCI の `Spec`、`Rootfs []mount.Mount`、`IO`、`io.containerd.NAME.VERSION` 形式の `Runtime` 文字列、`SandboxID`、checkpoint 系フィールドを持つ。

`containers.Container` (`core/containers/containers.go:30`) は稼働タスクではなく永続化された「定義」である。`ID` は namespace 内で一意・不変、`Runtime RuntimeInfo` は必須・不変、`Spec` は必須だが mutable である。

`Bundle` (`core/runtime/v2/bundle.go:122`) はディスク上の OCI bundle ディレクトリを `ID` / `Path` / `Namespace` として抽象化し、`Delete()` (`core/runtime/v2/bundle.go:132`) が atomic に掃除する。

`ShimManager` (`core/runtime/v2/shim_manager.go:177`) は shim のライフサイクルを保持する。namespace 別の shim 集合 (`shims *runtime.NSMap[ShimInstance]`)、containerd と ttrpc のアドレス、runtime 名 -> fs パスをキャッシュする `runtimePaths sync.Map`、イベント exchange を持つ。

`shim` (`core/runtime/v2/shim.go:408`) は 1 つの shim プロセスへのハンドル。`bundle *Bundle`、`client any` (ttrpc クライアント)、`address`、`version` を持つ。

`plugin.Registration` (`vendor/github.com/containerd/plugin/plugin.go:61`) はデーモン全体の組み立て単位。`Type`、`ID`、`Requires []Type`、`InitFn` を持つ。

## 追う価値のあるパス

タスク作成が最重要パスである。gRPC タスクサービスは `plugins/services/tasks/local.go:171` で create 呼び出しを受け、`plugins/services/tasks/local.go:239` で読み込んだコンテナから `runtime.CreateOpts` を組み、重複タスクを弾いてから v2 ランタイムを呼ぶ。

```go
c, err := rtime.Create(ctx, r.ContainerID, opts)
```

これが `plugins/services/tasks/local.go:277`。`(*TaskManager).Create` (`core/runtime/v2/task_manager.go:159`) に入り、bundle を書き (`core/runtime/v2/task_manager.go:160`)、rootfs マウントを活性化し (`core/runtime/v2/task_manager.go:189`)、shim を起動する (`core/runtime/v2/task_manager.go:213`)。shim manager は `core/runtime/v2/shim_manager.go:311` と `core/runtime/v2/shim_manager.go:316` で runtime パス解決とバイナリハンドル構築をし、`(*binary).Start` (`core/runtime/v2/binary.go:66`) が `Action: "start"` (`core/runtime/v2/binary.go:80`) で shim を exec し、印字されたアドレスへ ttrpc で接続し (`core/runtime/v2/binary.go:138`)、`bootstrap.json` を永続化する (`core/runtime/v2/binary.go:144`)。最後に TaskManager が shim をラップし (`core/runtime/v2/task_manager.go:220`)、create RPC を送る (`core/runtime/v2/task_manager.go:232`)。

```text
local.Create (local.go:171)
  -> TaskManager.Create (task_manager.go:159)
       NewBundle (task_manager.go:160)
       mounts.Activate (task_manager.go:189)
       ShimManager.Start (task_manager.go:213 -> shim_manager.go:299)
         binary.Start (binary.go:66) shim を exec、ttrpc 接続、bootstrap.json
       shimTask.Create を ttrpc 越しに (task_manager.go:232)
```

## 読んで驚いた点

デーモンはコンテナを自プロセス内で動かさない。shim は長命な別プロセスで、デーモンは稼働中コンテナを落とさずに再起動・アップグレードできる。再接続時は `restoreBootstrapParams` (`core/runtime/v2/shim_manager.go:343`) で `bootstrap.json` を読み、shim 状態を再構築する。shim が死ぬと、on-close コールバックの `cleanupAfterDeadShim` (`core/runtime/v2/shim_manager.go:326` で登録) が後始末をし task-exit イベントを発行する。つまり exit の収集はデーモンでなく shim の仕事である。

バージョンの downgrade 再試行もある。create RPC が not-implemented を返すと、TaskManager はタスク API バージョンを下げて再試行する (`core/runtime/v2/task_manager.go:232` から `IsNotImplemented` 分岐)。これにより新しいデーモンでも古い shim を駆動できる。
