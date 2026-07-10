# 内部実装

> コミット `2487a24` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/scheduler/` | extender・webhook・metrics ルートを登録する HTTP サーバ (`main.go:145-147`) |
| `cmd/device-plugin/nvidia/` | NVIDIA device-plugin のエントリポイント |
| `cmd/vGPUmonitor/` | Pod ごとの GPU 使用量モニタ |
| `pkg/scheduler/` | Filter・Bind・Score と mutating webhook のロジック |
| `pkg/device/` | ベンダ非依存の型と、ベンダごとの実装 (`nvidia`、`ascend`、`cambricon`、`hygon`、`metax`、`mthreads`、`iluvatar` など) |
| `pkg/device-plugin/nvidiadevice/nvinternal/` | device-plugin の実装: `plugin/`、`rm/`、`cdi/`、`mig/`、`imex/` |
| `libvgpu` (サブモジュール) | HAMi-core、別リポジトリの C/CUDA コンテナ内隔離ライブラリ |

## 中核データ構造

`Devices` インターフェース (`pkg/device/devices.go:36`) は、全ベンダが実装する契約だ。スケジューラと webhook が、ベンダを知らずに呼ぶ操作を束ねる。`MutateAdmission`・`Fit`・`PatchAnnotations`・`ScoreNode`・`GetNodeDevices`・`GenerateResourceRequests`、そしてノードロック系のメソッドである。新しいアクセラレータ対応はこのインターフェースを実装することであり、スケジューラ側は他に何も変わらない。

`DeviceUsage` (`pkg/device/devices.go:80`) は「今の 1 枚の物理 GPU」に対するスケジューラの視点だ。time-slicing の枚数と使用枚数、総メモリと使用メモリ、総コアと使用コア、NUMA ノード、型、health、MIG 使用量を保持する。あらゆる `Fit` の判定は、この構造体のフィールド比較である。

`ContainerDeviceRequest` (`pkg/device/devices.go:143`) は 1 コンテナの要求だ。デバイス数、メモリ (MB)、メモリのパーセント、コアのパーセントを持つ。`MemPercentagereq` が 101 なら「パーセント指定なし」の番兵値で、`Fit` はこれを見て絶対メモリ値へフォールバックする。割当結果は webhook・スケジューラ・device plugin の間でアノテーションとして受け渡され、区切り記号でエンコードされるので、1 つの文字列が複数コンテナにまたがる複数デバイスを表せる。

## 追う価値のあるパス

`Fit` の GPU 選択ループが配置の中核だ。`NvidiaGPUDevices.Fit` (`pkg/device/nvidia/device.go:749`) はノードのデバイスを走査し、要求を満たす最初の組み合わせを返して、残りが落ちた理由を集計する。

```text
Fit(devices, request, pod, nodeInfo, allocated)   pkg/device/nvidia/device.go:749
  for i := len(devices)-1; i >= 0; i--            末尾からデバイスを走査
    dev := devices[i]
    if !dev.Health            -> reason[CardNotHealth]++
    checkType 不一致          -> reason[...]++
    NUMA / UUID 制約
    Count <= Used             -> time-slice 枠なし
    Coresreq > 100 補正
    memory: Memreq、無ければ Totalmem * MemPercentagereq / 100
    quota / 空きメモリ / 空きコアのチェック
    排他と共有 (cores == 100 競合)
  選ばれたデバイス、または理由の集計を返す
```

注目点は 2 つ。ループはスライスの末尾から回る (`for i := len(devices) - 1; i >= 0; i--`) ので、デバイスリストの spread/binpack ソートと組み合わさって末尾から埋める。そしてメモリは、指定があれば絶対値 `Memreq`、無ければパーセントから `Totalmem * MemPercentagereq / 100` で算出する。だから 101 の番兵値が効く。「0 パーセント要求」と「パーセント指定そのものが無い」をコードが区別する手段だ。

`Fit` の結果は `Scheduler.Filter` (`pkg/scheduler/scheduler.go:741`) を通って上がり、ノードをスコア順にソートして選んだデバイスを Pod のアノテーションに書く。続いて `Scheduler.Bind` (`pkg/scheduler/scheduler.go:670`) が割当を `allocating` とマークし Kubernetes の bind API を呼ぶ。ノード側では `Allocate` (`pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go:593`) がそのアノテーションを読み返し、環境変数とマウントに変える。

## 読んで驚いた点

実行時の強制は Go の中に一切ない。device plugin の `Allocate` は `CUDA_DEVICE_MEMORY_LIMIT_<i>` と `CUDA_DEVICE_SM_LIMIT` を注入し `libvgpu.so` をマウントするだけだ (`server.go:661-711`)。実際のメモリ上限と演算絞りは、コンテナ内に preload された C ライブラリが強制する。「仮想 GPU」の全体が、環境変数一式と `LD_PRELOAD` の横取りであり、カーネルやドライバの改変はない。

隔離は環境変数で無効化できる。コンテナが `CUDA_DISABLE_CONTROL` を持つと、plugin は `ld.so.preload` マウントをスキップするので、HAMi-core は読み込まれず、コンテナはカード全体を見る (`server.go:695`)。意図的な脱出口であり、隔離境界がその変数をワークロードが設定しないことに依存することを意味する。

extender は入力サイズを守っている。リクエスト body は 1MB 上限の `io.LimitReader` で読まれる (`pkg/scheduler/routes/route.go:33`、`route.go:50`)。不正または過大な extender 呼び出しが、スケジューラプロセスのメモリを枯渇させられない。見落としやすく、めったに文書化されない小さな防御的判断だ。
