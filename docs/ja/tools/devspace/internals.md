# 内部実装

> コミット `8ff6260` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | cobra の CLI コマンド。多くはパイプラインをラップする (`cmd/dev.go`・`cmd/run_pipeline.go`・`cmd/root.go`) |
| `pkg/devspace/pipeline/` | 実行エンジン: 組み込みシェル (`engine/`) と組み込みコマンド (`engine/pipelinehandler/commands/`) |
| `pkg/devspace/devpod/` | 開発用 Pod のライフサイクルと Pod ごとのサービス起動 |
| `pkg/devspace/services/sync/` | 双方向ファイル同期のクライアント側 (コントローラとストリーム配線) |
| `pkg/devspace/sync/` | 同期エンジン本体: watch tree・upstream・downstream |
| `pkg/devspace/services/podreplace/` | 対象ワークロードを dev pod に差し替え |
| `pkg/devspace/services/inject/` | `devspacehelper` バイナリをコンテナへ注入 |
| `pkg/devspace/build/builder/` | 差し替え可能なイメージビルダ: docker・buildkit・kaniko・custom |
| `pkg/devspace/config/versions/` | config スキーマ世代とメモリ内アップグレード |
| `helper/` | コンテナ内で動く `devspacehelper` バイナリ (sync server・SSH・restart) |

Go module path は、リポジトリが `devspace-sh/devspace` であるにもかかわらず `github.com/loft-sh/devspace` である (`go.mod:1`)。CNCF 寄贈後も import 互換のために module path を維持している。

## 中核データ構造

同期エンジンは `Sync` 構造体を軸に回る (`pkg/devspace/sync/sync.go:68`)。ローカルの watch tree (`tree notify.Tree`)、`upstream`、`downstream` を持つ (`sync.go:77`)。`NewSync` (`sync.go:90`) は ignore パーサを組み、注目すべきことに、同期ログへの書き込みが無限同期ループを引き起こさないよう、sync log 自体を watch 対象から除外する (`sync.go:112` のコメント)。ローカル watch は `github.com/loft-sh/notify` (`sync.go:17`) が提供する。これは `rjeczalik/notify` の Loft Labs フォークで、エンジンが依存する再帰 watch tree を加えている。

2 方向は別々の型で、別々のトランスポートを持つ。

- `upstream` (ローカル → コンテナ)、`pkg/devspace/sync/upstream.go`。`newUpstream` (`upstream.go:71`) は reader と writer を受け取り、これは `exec` ストリームの stdout と stdin である。`mainLoop` (`upstream.go:201`) は FS イベントを集め、デバウンスし、変更ファイルを `archive/tar` (`upstream.go:4`) + `compress/gzip` (`upstream.go:6`) のペイロードにして writer へ流す。アップロード適用後には restart ファイルをタッチ (`restart.TouchPath`、`upstream.go:298`) したりコンテナを再起動 (`upstream.go:331`、`RestartContainer` は `:716`) したりできる。
- `downstream` (コンテナ → ローカル)、`pkg/devspace/sync/downstream.go`。`newDownstream` (`downstream.go:39`) はヘルパーと gRPC で会話する。`mainLoop` (`downstream.go:158`) は `d.client.ChangesCount` (`downstream.go:178`) をポーリングし、変更が十分溜まったら `collectChanges` (`downstream.go:192`) と `applyChanges` (`downstream.go:198`) を呼ぶ。`collectChanges` は `d.client.Changes` からストリームを受ける (`downstream.go:107`)。gRPC の契約は `helper/remote/remote.proto` にあり、生成物 `remote.pb.go` と `remote_grpc.pb.go` を伴う。

つまりプロトコルは非対称である。上りは生の圧縮 tar ストリーム、下りは gRPC だ。両者は 1 本の `kubectl exec` の stdin/stdout に乗り、方向ごとに 1 本ずつ張る。

## 追う価値のあるパス

`devspace dev` を、組み込みの `start_dev` コマンドから動作中の同期まで追う。

```text
start_dev (パイプライン組み込み)      pipelinehandler/handler.go:55
  -> StartDev                       commands/start_dev.go:27
       DevPodManager().StartMultiple  start_dev.go:74
  -> devPod.Start                   devpod/devpod.go:74
       -> startWithRetry            devpod.go:123
       -> start                     devpod.go:221   (必要なら Pod 置換)
       -> startServices             devpod.go:501   (tomb: sync + port-forward)
            sync.StartSync          devpod.go:515
  -> controller.startSync           services/sync/controller.go:270
       inject.InjectDevSpaceHelper  controller.go:403  -> /tmp/devspacehelper
       sync.NewSync                 controller.go:462
       exec: sync upstream          controller.go:468
       exec: sync downstream        controller.go:513
       InitUpstream / InitDownstream controller.go:507 / :535
  -> Sync.Start -> mainLoop         sync/sync.go:166 / :209
       startUpstream (notify.Tree)  sync.go:232
       startDownstream              sync.go:268
       initialSync                  sync.go:277
```

コントローラが 2 つのトランスポートをセットアップする場所である。exec の引数リストを `[/tmp/devspacehelper sync upstream ...]` (`controller.go:468`) と `[/tmp/devspacehelper sync downstream ...]` (`controller.go:513`) として作り、exec ストリームが reader/writer に見えるよう各方向に `io.Pipe` を組み、`syncClient.InitUpstream(...)` (`controller.go:507`) と `syncClient.InitDownstream(...)` (`controller.go:535`) に渡す。`controller.go:403` の注入がそもそもヘルパーを利用可能にする。`InjectDevSpaceHelper` (`pkg/devspace/services/inject/inject.go:49`) が `devspacehelper` をコンテナパス定数 `/tmp/devspacehelper` (`inject.go:43`) に配置する。

## 読んで驚いた点

**シェルがバイナリの中にある。** DevSpace は `/bin/sh` を呼ばない。`mvdan.cc/sh/v3` を import し (`engine.go:9`)、そのインタプリタ上でパイプラインを走らせる。だから同じ POSIX スクリプトと同じ組み込みコマンドが、シェル未インストールの Windows でも動く。組み込みコマンドはインタプリタの exec ハンドラを横取りして実装される。`execHandler.ExecHandler` (`handler.go:121`) は基本シェルハンドラに委譲する前に `handlePipelineCommands` で一致を確認する。

**上りと下りは別プロトコル。** 同期は対称だと思うのが自然だが、そうではない。上り側は `tar`/`gzip` ストリームを送り (`upstream.go:4`、`:6`)、下り側は注入したヘルパーに対して gRPC を走らせる (`downstream.go:107`、`:178`)。両者は方向ごとに 1 本の `kubectl exec` チャネルに多重化される。だから DevSpace はクラスタ内で待ち受けるものを何も必要としない。

**watch レイヤはプロジェクト自身が持つフォーク。** 上流の `rjeczalik/notify` に依存する代わりに、DevSpace は `github.com/loft-sh/notify` を import し (`sync.go:17`)、ファイル同期の性能が乗る再帰 watch の挙動を掌握している。

**12 世代の config がツリーに同居する。** `pkg/devspace/config/versions/` は `v1beta1` から `v1beta11` に加えて `latest` を持ち、`latest` は `v2beta1` である (`pkg/devspace/config/versions/latest/schema.go:16`)。古い `devspace.yaml` はメモリ内で latest スキーマにアップグレードされるので、長寿命の CLI が何年も前に書かれた config を、ディスク上で書き換えずに読み続けられる。
