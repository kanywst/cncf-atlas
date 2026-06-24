# 内部実装

> コミット `fe36ad62` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `daemon/` | `cilium-agent` バイナリ。`daemon/cmd/` に cobra root と Hive cell |
| `plugins/cilium-cni/` | kubelet が pod ごとに呼ぶ CNI プラグイン。REST でエージェントと会話 |
| `pkg/endpoint/` | Endpoint の状態機械と再生成ロジック |
| `pkg/identity/`, `pkg/labels/` | ラベル集合を数値の security identity にマッピング |
| `pkg/policy/` | ポリシーを per-endpoint の `MapState` (eBPF policy map の内容) に解決 |
| `pkg/ipcache/` | クラスタ全体の IP-to-identity 対応を eBPF ipcache map に同期 |
| `pkg/datapath/` | datapath 抽象。`pkg/datapath/loader/` が eBPF object をコンパイル・ロード |
| `pkg/maps/` | 個々の eBPF map (lxcmap, policymap, ctmap) の Go ラッパ |
| `operator/` | クラスタスコープの Deployment: IPAM、identity GC、CRD 管理 |
| `bpf/` | C の datapath。clang/LLVM が eBPF バイトコードにコンパイル |

## 中核データ構造

- Endpoint (`pkg/endpoint/endpoint.go:126`)。pod 1 個 = Endpoint 1 個。ノード内一意の `ID uint16`、datapath ビルド用の `loader` / `orchestrator` と `compilationLock` への参照、ポリシーリポジトリ、lxcmap への参照、`RWMutex` を持つ。状態機械 (waiting-for-identity, regenerating, ready) を内包し、再生成を直列化する。
- Identity (`pkg/identity/identity.go:27`)。`ID NumericIdentity`、`Labels`、高速検索用 `LabelArray`、参照カウントを持つ。ラベル集合 1 つに数値 identity を 1 つ割り当てるのが Cilium のポリシーモデルの根幹だ。`IdentityMap` は `map[NumericIdentity]labels.LabelArray` の別名 (`pkg/identity/identity.go:62`)。
- IPCache (`pkg/ipcache/ipcache.go:117`)。IP/CIDR と identity の双方向対応をクラスタ全体で保持し eBPF ipcache map に同期する。これによりカーネルがパケット処理時に送信元・宛先 IP を identity に解決できる。
- mapState / MapState (`pkg/policy/mapstate.go:98`)。identity + port + protocol + traffic direction を鍵にした解決済みポリシー。これがそのまま eBPF policy map の内容になる。
- templateCfg (`pkg/datapath/loader/template.go:45`)。ELF テンプレート用のラッパ。実 endpoint 設定のうち条件分岐部分は通し、静的データはダミー値に差し替える。

## 追う価値のあるパス

テンプレートと差し替えの datapath が読む価値のある部分だ。`fetchOrCompile` は endpoint 設定に対応する object を探し、その設定のハッシュがまだコンパイルされていない場合のみコンパイルする。

```text
fetchOrCompile(ctx, cfg, ...)            pkg/datapath/loader/cache.go:175
  cfg = wrap(cfg)                        endpoint 設定を templateCfg でラップ
  hash = o.baseHash.hashTemplate(cfg)    pkg/datapath/loader/cache.go:179
  -> 異なるハッシュごとに 1 度だけコンパイル、そうでなければキャッシュ ELF のコピーを返す
```

新しいハッシュをコンパイルすると、エージェントは object パスとコンパイル時間とともに `"Compiled new BPF template"` をログ出力する (`pkg/datapath/loader/cache.go:160`)。endpoint 固有値 (ID, MAC, IP, identity) はロード直前に ELF へ差し替えられるため、高価な clang 起動は pod ごとではなく設定の形ごとに 1 度だけ起きる。

## 読んで驚いた点

- テンプレートのダミー値は意図的に 32bit セクションごとに非ゼロにしてある。`templateCfg` のコメントが理由を説明する。ゼロ初期化された static integer はコンパイラに `.bss` 参照を生成させ、後から差し替えできなくなる。そこで値を強制的に非ゼロにして `.data` セクションに残す (`pkg/datapath/loader/template.go:35`)。
- テンプレートは万一そのまま実デバイスに attach されても無害になるよう作られている。identity は最小権限の `world` に解決され (`pkg/datapath/loader/template.go:71`)、IPv4 アドレスは RFC5737 のドキュメント用プレフィックス (非ルータブル) になる (`pkg/datapath/loader/template.go:91`)。
- コンパイルロックには明示的な順序ハザードがある。`regenerateBPF` は `e.compilationLock.RLock()` を取る前に `<-e.orchestrator.DatapathInitialized()` を待つ。read ロックを先に取ると datapath 初期化 (write ロックが必要) をブロックしてデッドロックするためだ (`pkg/endpoint/bpf.go:368`)。
