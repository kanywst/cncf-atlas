# 内部実装

> コミット `7c27007` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `libcni` | ランタイム側ライブラリ: 設定パース、プラグインチェーン実行、結果キャッシュ (`libcni/api.go`, `libcni/conf.go`) |
| `pkg/skel` | プラグイン側の骨組み: `CNI_COMMAND` をコールバックにディスパッチ (`pkg/skel/skel.go`) |
| `pkg/invoke` | トランスポート: env 構築、バイナリ exec、stdout パース (`pkg/invoke/args.go`, `pkg/invoke/raw_exec.go`, `pkg/invoke/exec.go`) |
| `pkg/types` | config・result インターフェース・error 型 (`pkg/types/types.go`) |
| `pkg/types/100` | 現行 1.x の result 構造体とバージョンコンバータ (`pkg/types/100/types.go`) |
| `cnitool` | `libcni` を駆動する参照 CLI (`cnitool/main.go`) |

## 中核データ構造

`PluginConf` (`NetConf` のエイリアス) はプラグイン 1 個分の設定で、`CNIVersion` / `Name` / `Type` / `Capabilities` / `IPAM` / `DNS` とパース済みの `PrevResult` を持つ (`pkg/types/types.go:64-78`)。GC 操作のときだけ供給される `ValidAttachments` も持つ。

`NetworkConfigList` は conflist 全体で、`Name` / `CNIVersion` / `Plugins []*PluginConfig` チェーン、そして `DisableCheck` / `DisableGC` フラグを持つ (`libcni/api.go:79-87`)。

`RuntimeConf` は 1 回の呼び出しに渡すランタイム側の入力で、`ContainerID` / `NetNS` / `IfName` / `Args` / `CapabilityArgs` を持つ (`libcni/api.go:54-68`)。コメントには、libcni がプラグインの宣言済み capability に一致する `CapabilityArgs` のキーだけを渡すと記されている。

`Result` は構造体ではなくインターフェースで、`Version` / `GetAsVersion` / `Print` / `PrintTo` を持つ (`pkg/types/types.go:128-142`)。現行の具象形は `types/100.Result` で、`Interfaces` / `IPs` / `Routes` / `DNS` を持つ (`pkg/types/100/types.go:90-96`)。`Interface` は `Name` / `Mac` / `Mtu` / `Sandbox` / `SocketPath` / `PciID` を (`pkg/types/100/types.go:270`)、`IPConfig` は `Interface` インデックス / `Address` / `Gateway` を持つ (`pkg/types/100/types.go:298`)。

`types.Error` は数値の `Code` / `Msg` / `Details` を持つ。well-known コードは定数で定義され、`ErrIncompatibleCNIVersion` (1)、`ErrTryAgainLater` (11)、`ErrInternal` (999) などがある (`pkg/types/types.go:233-247`)。

## 追う価値のあるパス

プラグインの stdout から型付き Go 値へ戻る結果を追う。`ExecPluginWithResult` はプラグインを実行し、生バイトを `fixupResultVersion` と `create.Create` に渡す (`pkg/invoke/exec.go:121-137`)。

```go
stdoutBytes, err := exec.ExecPlugin(ctx, pluginPath, netconf, args.AsEnv())
if err != nil {
    return nil, err
}

resultVersion, fixedBytes, err := fixupResultVersion(netconf, stdoutBytes)
if err != nil {
    return nil, err
}

return create.Create(resultVersion, fixedBytes)
```

興味深い分岐は `fixupResultVersion` だ (`pkg/invoke/exec.go:39-78`)。config のバージョンをデコードしてから、結果の `cniVersion` を手作業で調べる。そのフィールドが存在し空でなければそのまま使う。欠落または空なら、仕様が定める 0.1.0 ではなく config のバージョンを割り当てる。issue #895 を引用している。nil の result マップ (プラグインが `null` を出力) は、パニック回避のため先に空マップへ置き換える。

失敗は逆方向に流れる。プラグインは `types.Error` JSON を stdout に出して非ゼロ終了することでエラーを通知し、`pluginErr` がそれを Go の error にアンマーシャルする。stdout が空なら stderr のテキストにフォールバックする (`pkg/invoke/raw_exec.go:72-84`)。

## 読んで驚いた点

"text file busy" のリトライ。`RawExec.ExecPlugin` はバイナリを最大 6 回実行し、エラーに "text file busy" が含まれるたびに 1 秒スリープする (`pkg/invoke/raw_exec.go:44-57`)。プラグインバイナリが書き込まれた直後でまだ実行可能になっていない競合を防ぐためだ。

結果キャッシュは整合性の話を変える。CHECK / DEL / GC は ADD が返した結果を必要とするので、libcni は仕様 0.4.0 以上で `cachedInfo` を `/var/lib/cni/results/` に永続化し、`getCachedResult` は旧形式のディスクフォーマットへのフォールバックさえ持つ (`libcni/api.go:225-236`, `libcni/api.go:366`)。teardown では生きたネットワークではなくディスク上のキャッシュが真実の源になる。

GC は二段のワークアラウンドだ。ライブラリはまず、キャッシュにあるが供給された valid-attachments 集合に無い attachment を削除し、次に仕様 1.1.0 以上なら各プラグインに GC コマンドを送る (`libcni/api.go:770-842`)。以前の仕様の変数名ミスに耐えるため、`cni.dev/valid-attachments` と `cni.dev/attachments` の両方に同じ値を注入する。issue #1101 で印が付いている (`libcni/api.go:824-826`)。
