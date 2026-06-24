# 内部実装

> コミット `68f2617` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/crio/` | プロセスのエントリポイント。`main.go` が CLI アプリと gRPC サーバを組み立てる (`cmd/crio/main.go:1-60`) |
| `server/` | CRI gRPC 実装。1 つの `Server` が両サービスを実装し、ハンドラを RPC ごとに分割 |
| `internal/oci/` | OCI ランタイム抽象。`RuntimeImpl` インターフェースと 3 実装 |
| `internal/lib/` | `ContainerServer` 中核と `sandbox` パッケージ (`Sandbox` 型) |
| `internal/storage/` | containers/storage ラッパ。イメージ pull・レイヤ・rootfs |
| `internal/config/`, `pkg/config/` | `crio.conf` 設定モデルと runtime handler |
| `internal/nri/` | Node Resource Interface プラグイン面 |
| `internal/resourcestore/` | 非同期作成のための予約と cleanup |

## 中核データ構造

`Server` (`server/server.go:69-104`) が CRI サーバ。`*lib.ContainerServer` を embed するため、ランタイム・ストア・ストレージへのアクセスは embed した型を経由する。並列 pull を一本化する `pullOperationsInProgress` と `pullOperationsLock`、作成途中リソース用の `resourceStore`、`nri` プラグインハンドル、`hooksRetriever` を持つ。

`oci.RuntimeImpl` (`internal/oci/oci.go:60-86`) は、すべてのランタイムが満たすべきインターフェース。`CreateContainer`・`StartContainer`・`ExecContainer`・`StopContainer`・`CheckpointContainer` などライフサイクル呼び出しを宣言する。`Runtime` は handler 名を `runtimeImplMap` で実装に解決し (`internal/oci/oci.go:95-98`)、`ValidateRuntimeHandler` が空の handler や空の runtime path を使用前に弾く (`internal/oci/oci.go:108-124`)。

`oci.Container` (`internal/oci/container.go:44`) はコンテナ 1 個。`/var/run` 下でリブートで消える `bundlePath` と、`/var/lib` 下で永続する `dir` を分けて保持する (`internal/oci/container.go:50-53`)。`*specs.Spec`・コンテナ `state` のほか、細粒度のロックを持つ。OCI ランタイム状態遷移用の `opLock`、メタデータ用の `metaLock`、stop 調整用の `stopLock` だ (`internal/oci/container.go:63-74`)。

`libsandbox.Sandbox` (`internal/lib/sandbox/sandbox.go:33`) は Pod 1 個。namespace ハンドル、`infraContainer`、メンバーコンテナの `memorystore.Storer`、IP、ポートマッピングを持ち、`stateMutex` で守る。

## 追う価値のあるパス

`runtime_oci.go` の conmon 起動が、CRI-O が実際にどうコンテナを起動するかの核心だ。`createContainer` は runc 引数ではなく conmon 引数を組み立てる:

```text
args := []string{
    "-b", c.bundlePath,
    "-c", c.ID(),
    "--exit-dir", r.config.ContainerExitsDir,
    "-l", c.logPath,
    ...
    "--persist-dir", c.dir,
    "-r", c.RuntimePathForPlatform(r),
    "--runtime-arg", fmt.Sprintf("%s=%s", rootFlag, r.root),
    ...
}
```

このブロックは `internal/oci/runtime_oci.go:145-160`。`-r` フラグが OCI ランタイムのパス、`--runtime-arg` が runc に渡す root だ。コマンドは runc ではなく conmon である `r.handler.MonitorPath` に対して組み立てられる:

```text
cmd := cmdrunner.Command(r.handler.MonitorPath, args...)
cmd.Dir = c.bundlePath
```

これが `internal/oci/runtime_oci.go:217-218`。CRI-O は conmon を exec し、conmon が runc を exec する。指す bundle ディレクトリには、Pod パスで先に書かれた `config.json` がある (`server/sandbox_run_linux.go:1343`)。

## 読んで驚いた点

`oci.Container` の `bundlePath` と `dir` の分離は、リブートの扱いを型自体に刻んでいる (`internal/oci/container.go:50-53`)。`/var/run` 下のランタイム状態はリブートで消える前提、`/var/lib` 下の永続メタデータは残る前提で、リカバリ処理がどちらのディレクトリを信じるか分かる。

pull の一本化はストレージ層ではなくサーバに置かれている。`pullArguments` は image・sandbox cgroup・認証情報・namespace をキーにし (`server/server.go:106-113`)、`pullOperation` は後から来た goroutine が block する `WaitGroup` を持つ (`server/server.go:115-126`)。同じ認証情報で同じイメージを pull する 2 つの Pod は、1 回のネットワーク取得を待つ。

`oci.Container` のロック粒度は珍しく細かい。3 つの別ロック (`opLock`・`metaLock`・`stopLock`) が OCI 状態遷移・メタデータ読み・stop 調整を分ける (`internal/oci/container.go:63-74`)。メタデータ読みが長い stop を block しない。`stopTimeoutChan` のコメントは、kill ループ開始後はこのチャネルを使ってはいけないと警告する。型自身は強制しない受け渡しの規約だ (`internal/oci/container.go:75-78`)。
