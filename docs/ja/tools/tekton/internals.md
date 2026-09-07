# 内部実装

> コミット `9dec5e4b` のソースを読んで書いた。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/apis/pipeline/v1/` | `v1` API の型 (`Task`, `TaskRun`, `Pipeline`, `PipelineRun`) と検証・デフォルト値・変換 |
| `pkg/apis/config/` | ConfigMap から読むクラスタ全体のフィーチャーフラグと既定値 |
| `pkg/reconciler/taskrun/` | `TaskRun` の制御ループ。解決から Pod 作成、status まで |
| `pkg/reconciler/pipelinerun/` | `PipelineRun` の制御ループ、DAG の評価、子オブジェクトの作成 |
| `pkg/reconciler/pipeline/dag/` | 依存グラフの構築、循環検出、実行候補の選択 |
| `pkg/pod/` | `TaskSpec` から Pod を作る。コンテナ・ボリューム・entrypoint 書き換え・status 抽出 |
| `pkg/entrypoint/` | すべての step コンテナに注入されるバイナリ |
| `pkg/termination/` | Pod の termination message の書き込みとサイズ検査 |
| `pkg/resolution/resolver/` | リモート解決のバックエンド (`git`, `bundle`, `cluster`, `hub`, `http`) |
| `cmd/` | 8 つのバイナリ。`controller`, `webhook`, `resolvers`, `entrypoint` など |

vendor を除いたテスト以外の Go は 1,001 ファイル、およそ 116,000 行。

## 中核のデータ構造

`Step` (`pkg/apis/pipeline/v1/container_types.go:24`) はコンテナの spec に Tekton 独自のフィールドを足したもの。`Script` (`:115`) はコマンドの代わりに実行可能ファイルを書いてくれるフィールド、ほかに `Timeout` (`:120`)、`OnError` (`:135`)、`Results` (`:150`)。`Task` は順序付きの `[]Step` であり、実行パス全体がやっているのは、この並びを「順番に走るコンテナ」へ変えることに尽きる。順序そのものはデータとしてどこにも保存されない。Tekton が entrypoint バイナリに渡す引数の中に符号化されている。それが次節の主題になる。

`RunResult` (`pkg/result/result.go:49`) が step の返す値。entrypoint が集めるものはすべてこの型で、`StartedAt` や `ExitCode` といった Tekton 自身の管理用エントリも含まれる。それらがひとつの文字列に直列化されて Pod の termination message に書かれる (`pkg/entrypoint/entrypointer.go:203-207`)。

`Node` と `Graph` (`pkg/reconciler/pipeline/dag/dag.go:41`, `:51`) がパイプラインの依存構造を保持する。見た目どおり素朴で、ノードはキーと `Prev` / `Next` のスライス、グラフはパイプラインタスク名からノードへの map。キャッシュせず reconcile のたびに組み直すので、`PipelineRun` の reconcile は現在の status だけの関数になる。

## 追う価値のあるパス

Kubernetes は Pod 内のすべてのコンテナを同時に起動する。Tekton の step は順番に走らなければならない。これがコードベースの中心にある衝突で、解決策は、すべての step コンテナの entrypoint を乗っ取り、ファイルで数珠つなぎにすることだった。

書き換えを行うのは `orderContainers` (`pkg/pod/entrypoint.go:127`)。関数自身の doc コメントが意図を書いている。step は "modified so that they are executed in order by overriding the entrypoint binary" だと。

```text
pod/entrypoint.go:127  orderContainers(steps)
  step i > 0   -> -wait_file /tekton/run/<i-1>/out        (:144)
  すべての step -> -post_file /tekton/run/<i>/out          (:148)
  step 0       -> -wait_file /tekton/downward/ready       (:139)
                  -wait_file_content
  すべての step -> Command = ["/tekton/bin/entrypoint"]    (:206)
                  元の command は -entrypoint と -- の後ろへ  (:198-204)
```

各 step は、前の step が終了時に書くファイルを待ち、自分が終わったら自分のファイルを書く。ファイルは `/tekton/run` (`RunDir`、`pkg/pod/entrypoint.go:51`) の下に置かれる。Pod 内の全コンテナが共有する `emptyDir` だ。

最初の step だけが特別で、`/tekton/downward/ready` を待つ。しかも `-wait_file_content` (`:140`) が付くので、ファイルが存在するだけでなく中身があることを待つ。このファイルは Pod のアノテーション `tekton.dev/ready` を Downward API で射影したもの (`:57`, `:96-108`)。コントローラが `UpdateReady` (`:321`) で Pod に patch を当てて初めて先へ進む。キャンセルも同じ経路で、アノテーション `tekton.dev/cancel` が `/tekton/downward/cancel` に射影される (`:63-65`, `:88-93`)。

コマンドを書き換えるということは、Tekton の管理下に無いイメージの中に entrypoint バイナリが存在しなければならないということでもある。その配布方法は自己複製だ。`entrypointInitContainer` (`pkg/pod/pod.go:630`) が作る init コンテナのコマンドは `["/ko-app/entrypoint", "init", "/ko-app/entrypoint", "/tekton/bin/entrypoint", <step 名...>]`。バイナリが自分自身を `/tekton/bin` にマウントされた `emptyDir` (`pkg/pod/entrypoint.go:79-82`) へコピーし、それを全 step コンテナがマウントする。ユーザーの step が `command` を指定していない場合、書き換えたあとに元へ戻すためイメージ本来の `ENTRYPOINT` を知る必要があるので、レジストリからイメージ設定を読みに行く (`pkg/pod/entrypoint_lookup.go`)。

step コンテナの内側では `Entrypointer.Go` (`pkg/entrypoint/entrypointer.go:201`) が実際の手順を回す。

```text
entrypoint/entrypointer.go:201  Go()
  :215  各 -wait_file を待つ
        失敗しても post file は書く。後続 step も同様に止まれるように  (:221)
  :267  /tekton/downward/cancel を監視する goroutine                  (:517)
  :272  allowExec(): when 式がこの step を走らせるか決める
  :278  Runner.Run(command...)   <- ユーザーの実コマンド
  :288  結果で分岐: キャンセル / タイムアウト / onError=continue / 正常
  :328  /tekton/results から result を読む
  :204  defer: すべてを termination message に書く
```

2 点だけ立ち止まる価値がある。失敗時にも post file を書くこと (`:221`) が、連鎖をタイムアウトまで待たせずに一気に畳ませている。そして `when` 式で飛ばされた step は post file を書いて 0 で終了するので (`:279-284`)、連鎖から見るとスキップされた step と「速く成功した step」は区別できない。

## 意外だったこと

**result のサイズ上限は Tekton の都合ではなく Kubernetes の上限。** result は Pod の termination message で返り、`MaxContainerTerminationMessageLength` は `1024 * 4` (`pkg/termination/write.go:33-35`)、検査は `:103`。タスクが返すすべて、Tekton 自身の内部エントリも含めて 4KB。逃げ道は完全に別の仕組みで、result をディスクから読んで自分のログに出力する sidecar を使う。組み立ては `createResultsSidecar` (`pkg/pod/pod.go:663`)、実行は `cmd/sidecarlogresults`。既定方式の名前が `ResultExtractionMethodTerminationMessage` (`pkg/entrypoint/entrypointer.go:55`) になっているのは、方式がひとつではないから。

**メンテナ自身がこの仕組みを暫定と考えている。** Downward API のボリューム定義の隣にコメントが残っている。`TODO(#1605): Signal sidecar readiness by injecting entrypoint, remove dependency on Downward API` (`pkg/pod/entrypoint.go:94-95`)。Pod のアノテーションをファイルに射影して協調する、というのはホワイトボードに最初に描く設計ではないし、コードもそう言っている。

**パイプラインはパイプラインを含めるので、循環検出が 2 か所ある。** `createChildPipelineRuns` (`pkg/reconciler/pipelinerun/pipelinerun.go:1134`) は、パイプラインのタスクが別のパイプラインを参照していると子の `PipelineRun` を作る。この参照グラフはタスクの DAG とは別物なので、`detectPipelineRefCycle` (`:1282`) という専用の検査を持つ。1 つのパイプライン内のタスクについては `findCyclesInDependencies` (`pkg/reconciler/pipeline/dag/dag.go:135`) が別に見る。

**`v1` API に「PipelineResource」という名前のものは生き残っていない。** 文字列自体は `pipelinerun_types.go` の status の名残りフィールドにまだ現れる。README がいまも宣伝している概念 (`README.md:22-28`) は 2023 年に削除された。[歴史](./history) で扱っている。
