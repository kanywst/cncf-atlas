# 内部実装

> コミット `20576a24` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | エントリポイント。manager を起動しコントローラを登録 |
| `api/` | CRD 型。`v1` が storage version。`v1alpha1/2/3` と `unversioned` の config 型、`zz_generated.conversion.go` |
| `controllers/` | `imagelist` / `imagejob` / `imagecollector` / `configmap` / `util` の reconciler |
| `pkg/cri/` | CRI クライアント。`client.go` の interface、`v1` と `v1alpha2` の実装、`newClientWithFallback` のバージョンフォールバック |
| `pkg/remover/` | 削除ロジック本体。`remover.go` と `helpers.go` |
| `pkg/collector/` | ノード上のイメージ収集 |
| `pkg/scanners/trivy/`, `pkg/scanners/template/` | Trivy スキャナと汎用 `ImageProvider` interface |
| `pkg/utils/` | `GetRunningImages` / `GetNonRunningImages` / `IsExcluded` / security context ヘルパ |

## 中核データ構造

`unversioned.Image` は、Eraser が CRI のイメージを落とし込む正規形である。`ImageID`、`Names []string`、`Digests []string` を持つ (`api/v1/imagejob_types.go:23-27`)。1 つの物理イメージを、その ID・任意のタグ・任意のダイジェストのどれからでも引けるようにする。

running と nonRunning の集合はいずれも `map[string]string` で、key はイメージの識別子のどれか (ID・名前・ダイジェスト)、value は imageID である (`pkg/utils/utils.go:129`、`pkg/utils/utils.go:149`)。各イメージは全識別子で一度に登録されるので、タグでも digest でも ID でも引けて、同じ imageID に解決する。この多重 key の map が「実行中イメージは決して削除しない」保証の全基盤である。

`ImageListSpec` は削除対象を素朴な `Images []string` で持ち (`api/v1/imagelist_types.go:20-23`)、`*` エントリは非実行イメージ全部の prune を意味する。`ImageJobStatus` は 1 回の掃討を `Failed`、`Succeeded`、`Desired`、`Skipped`、`Phase`、そして Job の遅延削除用 `DeleteAfter` タイムスタンプで追う (`api/v1/imagejob_types.go:41-64`)。

## 追う価値のあるパス

読むに値するのは、ワーカーがイメージを削除して安全と判断する箇所である。それは `removeImages` (`pkg/remover/helpers.go:11`) で起き、2 つの map を作ってから対象リストを歩く。

まずランタイムから真実を取る。ノード上の全イメージを `ListImages`、全実行中コンテナを `ListContainers` で得る (`pkg/remover/helpers.go:17`、`pkg/remover/helpers.go:45`)。`GetRunningImages` はコンテナを歩き、各コンテナの imageID について、その imageID と、そのすべての Names と Digests を running map に登録する (`pkg/utils/utils.go:129-146`)。つまり、あるコンテナが使う imageID に紐づく名前や digest はすべて running 扱いになる。

`GetNonRunningImages` はノード上の全イメージを取り、running map に無い imageID だけを、やはり 3 面の key で登録する (`pkg/utils/utils.go:149-169`)。

```text
removeImages
  ListImages / ListContainers          -> ノードの真実
  GetRunningImages                       -> 使用中イメージの map[id|name|digest]
  GetNonRunningImages                    -> 残りの map[id|name|digest]
  各対象について:
    nonRunning にヒットかつ除外外       -> DeleteImage
    running にヒット                     -> skip、"image is running" ログ
    どちらにもヒットしない               -> "image is not on node" ログ
```

削除ループは各対象を引き、どの map にヒットしたかで動く (`pkg/remover/helpers.go:66-96`)。nonRunning map で見つかった対象は、除外リストに無ければ削除する (`pkg/remover/helpers.go:72-88`)。running map で見つかった対象は「image is running」ログを出して明示 skip する (`pkg/remover/helpers.go:90-94`)。どちらにも無ければ、単にノードに無い。`*` の対象は `prune` フラグを立て、ループ後に非実行かつ除外外のイメージをすべて削除する (`pkg/remover/helpers.go:67-68`、`pkg/remover/helpers.go:99-126`)。

## 読んで驚いた点

running か否かの判定は名前単位ではなく imageID 単位である。あるイメージが 1 つのタグで使われていれば、同じ imageID に解決する他のタグや digest もすべて running 扱いになり削除されない。それらは running map に一緒に登録されたからである (`pkg/utils/utils.go:133-146`)。誤削除に対する安全性は、この多重 key map の作られ方だけに宿る。

ワーカーは DaemonSet ではなく Job からの単発 Pod である。各 Pod は完了すると、PodTemplate と ConfigMap もろとも owner 参照と `deleteAfter` の遅延で GC され、ノードに常駐するものは残らない。常駐エージェントを避ける代償として、コントローラがより込み入った Job 寿命ロジックを担う (`controllers/imagelist/imagelist_controller.go:179-255`)。

CRI クライアントは `v1` と `v1alpha2` の両パスを持ち、ランタイムが応答する方を選ぶため、各 `Version` 呼び出しを順に試す (`pkg/cri/client.go:47-67`)。このフォールバックが、Eraser が古い containerd や CRI-O ランタイムにも接続できる理由である。

設定は CRD ではない。CRD は `ImageList` と `ImageJob` の 2 つだけで、調整可能な項目はすべて `api/unversioned/config` 配下の ConfigMap ベースの `EraserConfig` から読み、リソースの表面を意図的に小さく保つ。
