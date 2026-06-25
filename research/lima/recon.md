# recon: Lima

調査メモ。自分用の密度。出典は URL を添える。検証は pin したコミットに対して行う。

## 基本情報

- repo: `lima-vm/lima` (<https://github.com/lima-vm/lima>)
- pinned commit: `9a3f1c443389c673eb619f7b1922b1a4d8e4fd16` (main, commit date 2026-06-23) / 近いタグ: `v2.1.3` (2026-06-19 release)。HEAD はこのタグの後の main コミット。`git tag --points-at HEAD` は空。
- 言語 / ビルド: Go (`go 1.25.7`, module `github.com/lima-vm/lima/v2`) / `make` もしくは `go build`。`make limactl` で `limactl` と `lima` を生成、`make native` でプラグイン・guestagent・ドライバまで。
- ライセンス: Apache-2.0。`LICENSE` は Apache 2.0 全文、各 `.go` に `// SPDX-License-Identifier: Apache-2.0` ヘッダ (例 `cmd/limactl/main.go:2`)。`gh api` の `license.spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Incubating。Sandbox 受理 2022-09-14、Incubating 昇格 2025-10-14 (TOC 投票)、告知ブログ 2025-11-11。
- カテゴリ (tools.ts CATEGORY_ORDER): Runtime (指定どおり)。
- main entrypoint: `cmd/limactl/main.go:33` の `main()`。cobra アプリ (`newApp().Execute()`)。`lima` は `limactl shell` のラッパ。
- 規模: `pkg` + `cmd` で Go 約 50,289 行 (`wc -l`)、Go ファイル 351 本。
- 作者: Akihiro Suda (containerd / nerdctl メンテナ)。

## 歴史の素材

- 起源: macOS ユーザーに containerd / nerdctl を届けるための VM ランチャとして 2021 年に開始。リポジトリ作成日 2021-05-14 (`gh api repos/lima-vm/lima` の `created_at`)。"WSL2 for macOS" と説明される。自動ファイル共有とポートフォワードが売り。出典: CNCF blog, README。
- スコープ拡大: containerd 中心から、Docker / Podman / Kubernetes、汎用 Linux VM へ。ホストは macOS / Linux / NetBSD / Windows。出典: CNCF blog, README。
- CNCF: 2022-09-14 Sandbox 受理 → 2025-10-14 Incubating 昇格 → 2025-11-11 告知。出典: CNCF project page, CNCF blog。
- v2.0 (2025-11-06 出荷, blog 2025-12-11) で AI ワークフローへフォーカス拡張。AI コーディングエージェントを VM 内に隔離してホストのファイル/コマンドから守る用途。v2.1 (blog 2026-03-25) で macOS ゲスト対応とエージェント安全性強化。出典: CNCF blog 群。
- 最新リリース: `v2.1.3` (2026-06-19, `gh api .../releases/latest`)。

## アーキテクチャの素材

トップレベルのコンポーネント (所有領域):

- `cmd/limactl` — CLI 本体 (cobra)。`start` / `stop` / `shell` / `list` / `edit` / `snapshot` 等。`main.go:33`。
- `pkg/instance` — インスタンスのライフサイクル。`Create` (`create.go:24`), `Prepare` (`start.go:50`), `Start`/`StartWithPaths` (`start.go:286` / `:168`)。
- `pkg/hostagent` — ホスト側デーモン。`limactl hostagent <name>` という子プロセスとして常駐し、ドライバ経由で VM を起動、SSH・マウント・ポートフォワード・DNS を管理。`hostagent.go:128` `New`, `:389` `Run`。
- `pkg/driver` + `pkg/driver/{qemu,vz,wsl2,krunkit}` + `pkg/driver/external` — VM バックエンド抽象。`Driver` interface `pkg/driver/driver.go:81`。内蔵ドライバと外部 gRPC プラグインの両方。
- `pkg/guestagent` + `cmd/lima-guestagent` — ゲスト VM 内で動く agent。gRPC `GuestService` を vsock/virtio 上で提供 (`pkg/guestagent/api/guestservice.proto:8`)。ポートイベント・inotify・時刻同期を host に通知。
- `pkg/cidata` — cloud-init の ISO9660 (`user-data`) を生成してゲストをプロビジョニング。`cidata.go:361` `GenerateCloudConfig`, `:386` `GenerateISO9660`。
- `pkg/limatype` — 中核データ型 (`Instance`, `LimaYAML`)。
- `pkg/store` / `pkg/networks` / `pkg/portfwd` — 状態の永続化とネットワーク。

代表操作のエンドツーエンド: `limactl start <name>` (path:line は pin コミット基準)

1. `cmd/limactl/start.go:570` `startAction` → `loadOrCreateInstance` (`:215`) でテンプレートからインスタンス生成/読込。
2. ネットワーク調停 `reconcile.Reconcile(ctx, inst.Name)` (`start.go:600` 付近)。
3. `instance.Start` (`start.go:626`) → `pkg/instance/start.go:286` `Start` → `:168` `StartWithPaths`。
4. `StartWithPaths` がバックグラウンドで子プロセス `limactl hostagent` を起動: 引数 `"hostagent"` を組み立て (`start.go:218` 付近)、`haCmd = exec.CommandContext(...)` (`:234` 付近)、`haCmd.Start()` (`:249` 付近)。PID ファイル出現を `waitHostAgentStart` (`:290`) で待ち、stdout のイベントを `watchHostAgentEvents` で監視。
5. 子プロセス側: `cmd/limactl/hostagent.go:43` `hostagentAction` → `hostagent.New` (`:109`) → `ha.Run` (`:136`)。
6. `pkg/hostagent/hostagent.go:128` `New` 内で `driverutil.CreateConfiguredDriver` でドライバ確定、`cidata.GenerateISO9660` (`hostagent.go:188`) で cloud-init ISO を生成。disk 作成等は `pkg/instance/start.go:50` `Prepare` 側 (`driver.Create` / `driver.CreateDisk`)。
7. `pkg/hostagent/hostagent.go:389` `Run` → `a.driver.Start(ctx)` で VM 起動 (`:424`) → `AdditionalSetupForSSH` → `startRoutinesAndWait` (`:498`) → `startHostAgentRoutines` (`:543`)。
8. `startHostAgentRoutines`: essential requirements (SSH 疎通) を `waitForRequirements` で待つ → `setupMounts` → `watchGuestAgentEvents` (`:697`, ポートフォワード反映) と `startTimeSync` を goroutine 起動 → optional/final requirements。

設計判断:

- push でなく「設定をデータとして注入」: ゲストへの設定配布は cloud-init ISO9660 経由 (`pkg/cidata`)。agent push ではなく VM 起動時のメタデータ投入。
- host/guest 通信は gRPC over vsock/virtio: `GuestService` (`guestservice.proto:8`、`GetEvents` は stream)。SSH は shell/コマンド実行とポートフォワードの土台、イベント通知は vsock の gRPC を優先。`ForwardGuestAgent` (`pkg/driver/driver.go` の interface) が必要時のみ host がソケットを SSH 転送。
- home ディレクトリは既定 read-only マウント (セキュリティ既定)。出典: 比較記事。

## 内部実装の素材

中核データ構造:

- `limatype.Instance` (`pkg/limatype/lima_instance.go:26`): 実行時の状態。`Name` / `Status` / `Dir` / `VMType` / `Arch` / `CPUs` / `Memory` / `Disk` / `SSHLocalPort` / `HostAgentPID` / `DriverPID` / `Config *LimaYAML` 等。`Status` は `Running`/`Stopped`/`Broken` 等の文字列エイリアス (`:15`)。
- `limatype.LimaYAML` (`pkg/limatype/lima_yaml.go:16`): ユーザが書く YAML テンプレートの全スキーマ。`VMType` / `Images` / `Mounts` / `MountType` / `PortForwards` / `Provision` / `Containerd` / `Networks` / `Rosetta` / `Plain` 等。多くが `*T` で nullable (jsonschema 生成のため)。`base` でテンプレート継承。
- `driver.Driver` interface (`pkg/driver/driver.go:81`) と `driver.Info` (`:110`): `Create` / `CreateDisk` / `Start (chan error)` / `Stop` / `RunGUI` / `SSHAddress` / `ForwardGuestAgent` 等。`Info.Features` に `CanRunGUI` / `DynamicSSHAddress` 等のケイパビリティ。
- `registry` の `internalDrivers` / `ExternalDrivers` マップ (`pkg/registry/registry.go:41-42`)。`Get(name)` (`:73`) が外部ドライバ優先で解決、`Register` (`:197`) で内蔵ドライバ登録 (`pkg/driver/qemu/register.go:15` 等が呼ぶ)。
- `events.Event` (`pkg/hostagent/events`): hostagent が stdout に JSON 出力、親 `limactl start` が読んで進捗表示。

追う価値があったパス / 非自明な点:

- 外部ドライバの gRPC 化が一番の設計的見どころ。`pkg/driver/external/driver.proto:7` の `service Driver` は 30 以上の rpc (`Start` は `stream StartResponse`、`CreateSnapshot` / `ChangeDisplayPassword` / `GuestAgentConn` 等) を定義。外部ドライバは別プロセスとして起動され gRPC で会話する (`pkg/driverutil/instance.go:25` `CreateConfiguredDriver` → `registry.Get`、`pkg/driverutil/vm.go:57` では `extDriverPath --pre-driver-action` を `exec` で起動)。これにより krunkit のような out-of-tree バックエンドを本体と分離して配布できる。
- `cmd` 配下に `*.lima` ラッパ (`nerdctl.lima` / `docker.lima` / `kubectl.lima` / `podman.lima` / `apptainer.lima`) と `lima-driver-{qemu,vz,wsl2,krunkit}`、`limactl-mcp` がいる。プラグインとドライバが実行ファイル分割されている。
- `go.mod` 冒頭に `// gomodjail:confined` と `//gosocialcheck:trusted` のコメント。依存をサンドボックス分類するメタデータを付与 (供給網ハードニング)。

## 採用事例の素材

README `### Adopters` (`README.md:65-71`) に列挙。各々リンク付きで citable。

- Rancher Desktop — VM エンジンに Lima を使用。<https://rancherdesktop.io/>
- Colima — macOS/Linux で Docker/Kubernetes を最小設定で。Lima 上に構築。<https://github.com/abiosoft/colima>
- Finch — AWS のローカルコンテナ開発 CLI。<https://github.com/runfinch/finch>
- Podman Desktop — Lima VM 用プラグインあり。<https://podman-desktop.io/>

採用シグナル (`gh api`, 2026-06-24): GitHub stars 21,323 / forks 908 / contributors 約 215 (contributors API のページ数より)。言語 Go。これら以外の組織名は出典が取れないので書かない。

ユーザーストーリー募集は `lima-vm/lima` Discussion #2390 (CNCF due diligence 用)。

## 代替・エコシステム

エコシステム / 統合: 上記アダプタ群 (Rancher Desktop / Colima / Finch / Podman Desktop) が Lima を VM エンジンとして内蔵。テンプレートで Ubuntu/Debian/Fedora/Alpine 等を配布 (`templates/`)。`limactl-mcp` で MCP も。

代替と本質差 (出典: 比較記事):

- Colima — 「ノブを事前設定した Lima」。Lima 上に薄い CLI を被せ Docker/containerd 向けに opinionated。Lima 自体は YAML で細かく制御でき非 Ubuntu ディストロや再現可能な dev VM 向き。
- Multipass (Canonical) — Ubuntu cloud-image を素早く起動する VM マネージャ。ホストマウントは 9p、Lima の virtiofs の方が I/O 速い。
- Docker Desktop — GUI とバンドル機能が厚い商用寄り。Lima はヘッドレスで軽量、ライセンス制約なし。
- OrbStack — macOS 専用の商用 (有料)。高速・UI 洗練。Lima は OSS でクロスホスト。
- UTM/QEMU/VirtualBox — 汎用 VM。Lima は開発者向けに自動マウント+ポートフォワード+テンプレートを付けた点が差。

## インストールと最小構成

- 導入: `brew install lima` (`README.md:26`)。Linux はバイナリ配布、`make` でもビルド可。
- 最小起動: `limactl start` (既定テンプレート) → `limactl shell default` でゲストに入る。`lima` は `limactl shell default` のラッパ。
- コンテナ: `nerdctl.lima` / `docker.lima` ラッパでホストから直接コンテナ操作。
- 設定: `~/.lima/<name>/lima.yaml` が `LimaYAML`。`limactl edit` で編集、`limactl start --vm-type=vz` 等でドライバ指定。
