# 内部実装

> コミット `9a3f1c4` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/limactl` | CLI (cobra)。`main()` は `cmd/limactl/main.go:33`。 |
| `pkg/instance` | インスタンスのライフサイクル: `Create` / `Prepare` / `Start` / `StartWithPaths`。 |
| `pkg/hostagent` | VM・SSH・マウント・ポートフォワード・DNS を駆動するホスト側デーモン。 |
| `pkg/driver` + `pkg/driver/{qemu,vz,wsl2,krunkit}` | VM バックエンドの抽象と内蔵ドライバ。 |
| `pkg/driver/external` | out-of-tree ドライバ向けの gRPC 契約。 |
| `pkg/guestagent` + `cmd/lima-guestagent` | `GuestService` を提供する VM 内エージェント。 |
| `pkg/cidata` | cloud-init ISO9660 の生成。 |
| `pkg/limatype` | 中核データ型 (`Instance`, `LimaYAML`)。 |
| `pkg/registry` | ドライバの登録と解決。 |

## 中核データ構造

- **`limatype.Instance`** (`pkg/limatype/lima_instance.go:26`) は実行時状態を保持する: `Name` / `Status` / `Dir` / `VMType` / `Arch` / `CPUs` / `Memory` / `Disk` / `SSHLocalPort` / `HostAgentPID` / `DriverPID` / `Config *LimaYAML`。`Status` は文字列エイリアス (`pkg/limatype/lima_instance.go:15`) で、`Running` / `Stopped` / `Broken` などの値をとる。
- **`limatype.LimaYAML`** (`pkg/limatype/lima_yaml.go:16`) はユーザが書くテンプレートの全スキーマ: `VMType` / `Images` / `Mounts` / `MountType` / `PortForwards` / `Provision` / `Containerd` / `Networks` / `Rosetta` / `Plain` など。多くのフィールドはポインタで、jsonschema が nullable を表現できるようにしている。`base` でテンプレート継承が可能。
- **`driver.Driver`** インターフェース (`pkg/driver/driver.go:81`) は `Lifecycle` / `GUI` / `SnapshotManager` / `GuestAgent` を合成し、`Info` / `Configure` / `FillConfig` / `SSHAddress` / `AdditionalSetupForSSH` を加える。`Info` (`pkg/driver/driver.go:110`) は `Features` にケイパビリティフラグを持つ。
- **ドライバレジストリ** (`pkg/registry/registry.go:41`) は `internalDrivers` と `ExternalDrivers` の 2 つのマップを保持する。`Get` (`pkg/registry/registry.go:73`) が名前を解決し (外部ドライバ優先)、`Register` (`pkg/registry/registry.go:197`) が内蔵ドライバを登録する。例えば QEMU ドライバは `init()` 内で `registry.Register(...)` を呼ぶ (`pkg/driver/qemu/register.go:15`)。

## 追う価値のあるパス

面白いのは CLI がバックグラウンドの hostagent へ処理を引き渡す部分だ。`StartWithPaths` (`pkg/instance/start.go:168`) は VM をインプロセスで動かさず、`hostagent` サブコマンド付きで `limactl` を再実行し、デタッチした子プロセスを起動する。

```go
"hostagent",
// ... 引数を組み立て ...
haCmd = exec.CommandContext(ctx, limactl, args...)
haCmd.SysProcAttr = executil.BackgroundSysProcAttr
haCmd.Stdout = haStdoutW
haCmd.Stderr = haStderrW
// ...
} else if err := haCmd.Start(); err != nil {
```

引数文字列は `pkg/instance/start.go:218`、コマンドは `pkg/instance/start.go:234`、`haCmd.Start()` は `pkg/instance/start.go:249` で設定される。親は子の stdout の JSON 進捗イベントを監視する。子は `hostagentAction` (`cmd/limactl/hostagent.go:43`) を実行し、`hostagent.New` (`cmd/limactl/hostagent.go:109`) でエージェントを構築し、`ha.Run` (`cmd/limactl/hostagent.go:136`) を呼ぶ。`Run` は `a.driver.Start(ctx)` (`pkg/hostagent/hostagent.go:424`) で VM を起動し、`startRoutinesAndWait` (`pkg/hostagent/hostagent.go:498`) に入る。

## 読んで驚いた点

- **外部ドライバは本格的な gRPC サービス。** `pkg/driver/external/driver.proto:7` の `service Driver` は 30 以上の RPC を定義し、`Start` は `stream StartResponse` を返し、`CreateSnapshot` / `Stop` なども含む。ドライバ選択は `CreateConfiguredDriver` (`pkg/driverutil/instance.go:25`) を通り、これが `registry.Get` を呼ぶ。ライフサイクルのフックは外部バイナリへ直接シェルアウトする: `handlePreConfiguredDriverAction` は `pkg/driverutil/vm.go:56` で `exec.CommandContext(ctx, extDriverPath, "--pre-driver-action")` を実行する。これにより krunkit のようなバックエンドを out-of-tree で配布しつつ本体に差し込める。
- **すべてが別実行ファイルに分割されている。** ドライバ以外にも `cmd` には `*.lima` ラッパ (`nerdctl.lima` / `docker.lima` / `kubectl.lima` / `podman.lima` / `apptainer.lima`)、ドライバ別の `lima-driver-*` バイナリ、`limactl-mcp` がある。プラグインとドライバは意図的に別プロセスだ。
- **`go.mod` のサプライチェーンメタデータ。** モジュールファイルは冒頭に `// gomodjail:confined` (`go.mod:1`) と `//gosocialcheck:trusted` (`go.mod:7`) を持ち、個々の依存に `// gomodjail:unconfined` マーカーが付く。これらの注釈はサンドボックス分類のための依存メタデータで、供給網のハードニング策だ。

## 出典

1. Lima ソース (コミット [`9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16)), 参照 2026-06-24。
