# recon: Operator Framework (operator-sdk)

調査メモ。Operator Framework は複数リポの集合体だが、deep-dive が扱う一次実装は開発者向けフラッグシップの `operator-framework/operator-sdk`。OLM 本体 (v0) は `operator-lifecycle-manager`、新設計 (v1) は `operator-controller` に分かれている。ここでは operator-sdk をピン留めして読む。

## 基本情報

- repo: `operator-framework/operator-sdk` (<https://github.com/operator-framework/operator-sdk>)
- pinned commit: `c7f6cde9810ed74eb7fc3316b50197495c6fe725` (2026-05-26, master)
- 近いタグ: `v1.42.2` (2026-03-19)。HEAD はこのタグより後の master。shallow clone なので `git describe` は names なしで失敗する点に注意
- 言語 / ビルド: Go (go 1.25.7, `go.mod:3`) / `make build` -> `go build ... ./cmd/{operator-sdk,helm-operator}` (`Makefile:92-95`)
- main entrypoint: `cmd/operator-sdk/main.go` -> `cli.Run()` (`internal/cmd/operator-sdk/cli/cli.go:64`)
- ライセンス: Apache-2.0 (リポ同梱 `LICENSE` の "Apache License Version 2.0" を確認。`gh repo view` の licenseInfo も apache-2.0)
- CNCF 成熟度: Incubating (2020-07-09 受理、出典 1,2)
- カテゴリ (指定どおり verbatim): App Definition & GitOps

## 歴史の素材

- Operator パターンは 2016 年に CoreOS が公開。運用知識をソフトに埋め込む設計パターン (出典 2,8)
- Operator Framework 自体は 2018-05 に CoreOS / Red Hat が発表した「Introducing the Operator Framework」が起点 (出典 5)。operator-sdk リポの作成日は 2018-02-07 (`gh repo view createdAt`)
- 2020-07-09 CNCF TOC が Incubating として受理。構成要素は Operator SDK と OLM の 2 本柱 (出典 1,2)
- 2023-04 Java Operator SDK が Operator Framework に合流 (出典 6)。現在 org には `java-operator-sdk` (931 stars) もある
- OLM は v0 が maintenance mode に入り、v1 は `operator-controller` で再設計中 (出典 9,10)

## アーキテクチャの素材

operator-sdk は「自前のスキャフォルディングエンジンを持たない」のが要点。CLI は kubebuilder v4 (`sigs.k8s.io/kubebuilder/v4 v4.6.0`, `go.mod:44`) のプラグインベース CLI をそのまま採用し、その上に OLM 連携と各言語サポートを plugin / extra command として載せる構造。

- `cli.GetPluginsCLIAndRoot()` (`internal/cmd/operator-sdk/cli/cli.go:72-128`) が kubebuilder の `cli.New(...)` を呼び、plugin bundle を 4 系統登録する
  - `gov4Bundle`: kustomize v2 + golang v4 + manifests v2 + scorecard v2 (`cli.go:73-82`)
  - `ansibleBundle`: 外部リポ `operator-framework/ansible-operator-plugins` の ansible v1 (`cli.go:84-93`, `go.mod:16`)
  - `helmBundle`: 自前 `internal/plugins/helm/v1` (`cli.go:95-104`)
  - `deployImageBundle` (alpha) (`cli.go:106-113`)
- つまり Go オペレータの `operator-sdk init` / `create api` は実体が kubebuilder のコマンド。operator-sdk 固有の付加価値は `manifestsv2` / `scorecardv2` プラグインと、extra command 群 (`bundle`, `cleanup`, `generate`, `olm`, `run`, `scorecard`, `pkgmantobundle`) (`cli.go:50-58`)
- グローバル `--verbose` だけは root に後付け (`cli.go:140-148`)。コメントに `TODO(estroz): upstream PR for global --verbose` とあり、kubebuilder 側に未マージの差分を手当てしている

非自明な設計判断: スキャフォルディングを kubebuilder へ完全委譲し、operator-sdk は「OLM へのデプロイ・bundle 化・scorecard 検証」という配布/ライフサイクル層に特化している。Go 用の足場は upstream と共有し、独自実装は OLM glue に絞る。これにより kubebuilder のレイアウト進化に追従できる反面、operator-sdk のリリースは kubebuilder / ansible-operator-plugins のバージョン (それぞれ v4.6.0 / v1.42.2) に強く縛られる。

## 内部実装の素材

代表オペレーションとして `operator-sdk run bundle <bundle-image>` を end-to-end で追った。これは「bundle イメージを OLM 経由でクラスタにデプロイする」operator-sdk 固有の中核機能。

1. コマンド定義: `internal/cmd/operator-sdk/run/bundle/cmd.go:27-65`
   - `bundle.NewInstall(cfg)` で installer を作り、`PreRunE` で `cfg.Load()`、`Run` で `cfg.Timeout` 付き context を張って `i.Run(ctx)` を呼ぶ (`cmd.go:46-54`)
2. `Install.Run` -> `setup` -> `InstallOperator`: `internal/olm/operator/bundle/install.go:66-70`
3. `setup` (`install.go:73-150`)
   - `operator.LoadBundle(...)` で bundle イメージから labels と CSV を取得 (`install.go:87`)
   - `InstallMode.CheckCompatibility(csv, ns)` で install mode 整合チェック (`install.go:93`)
   - `fbcutil.IsFBC(...)` で index イメージが File-Based Catalog か SQLite かを判定 (`install.go:98`)。FBC なら `generateFBCContent` で declarative config を生成 (`install.go:125-180`)、SQLite は deprecation 警告を出す (`install.go:135`)
   - PackageName / CatalogSourceName / StartingCSV / SupportedInstallModes を OperatorInstaller に詰める (`install.go:141-147`)
4. `OperatorInstaller.InstallOperator` (`internal/olm/operator/registry/operator_installer.go:55-102`) が OLM への実書き込み
   - `CatalogCreator.CreateCatalog(...)` で registry pod と CatalogSource を作る (`operator_installer.go:56`)
   - `ensureOperatorGroup(ctx)` (`operator_installer.go:73`)
   - `createSubscription(...)` を `ApprovalManual` で作成 (`operator_installer.go:79`, `:281-285`)
   - `waitForInstallPlan` -> `approveInstallPlan` (`operator_installer.go:84-89`)
   - `approveInstallPlan` は `ip.Spec.Approved = true` を `RetryOnConflict` でセットして Update する (`operator_installer.go:319-339`)。手動承認 InstallPlan を CLI が代理承認する形
   - 最後に `getInstalledCSV` で CSV 完了待ち (`operator_installer.go:94`)

中核データ構造 (3-5 個)

- `Install` (`internal/olm/operator/bundle/install.go:33-40`): `BundleImage` と、埋め込み `*registry.IndexImageCatalogCreator` / `*registry.OperatorInstaller` を合成。run bundle のオーケストレータ
- `OperatorInstaller` (`internal/olm/operator/registry/operator_installer.go:38-49`): `CatalogSourceName/PackageName/StartingCSV/Channel/InstallMode/CatalogCreator/CatalogUpdater/SupportedInstallModes` を持つ OLM 投入の状態管理
- `IndexImageCatalogCreator` (`internal/olm/operator/registry/index_image.go:93-111`): index イメージへの bundle 注入設定。`FBCContent/IndexImage/BundleImage/BundleAddMode/SecurityContext` など。`CatalogCreator` と `CatalogUpdater` の両 interface を実装 (`index_image.go:113-114`)
- `operator.Configuration` (`internal/olm/operator/config.go:32-42`): `Namespace/RESTConfig/Client (controller-runtime client.Client)/Scheme/Timeout`。全 OLM コマンドが共有する kube クライアントの束
- OLM CRD 型 (外部 `operator-framework/api v0.34.0`, `go.mod:17`): `v1alpha1.ClusterServiceVersion` / `Subscription` / `InstallPlan` / `CatalogSource`、`v1.OperatorGroup`。operator-sdk はこれらを生成・承認するだけで、実際の reconcile は OLM 側が担う

依存の要: `sigs.k8s.io/controller-runtime v0.21.0` (`go.mod:42`)、`operator-framework/operator-registry v1.59.0` (FBC / bundle ライブラリ, `go.mod:20`)、`operator-framework/api v0.34.0` (OLM CRD 型)。

## 採用事例の素材

- operator-sdk リポに `ADOPTERS.md` / `USERS.md` は同梱されていない (clone 内に該当ファイルなし)。組織名の捏造はしない
- 最も確実な採用シグナルは Red Hat による製品化。Operator Framework は Red Hat / CoreOS 発で、OLM は OpenShift に同梱される (出典 5,9)
- 数値シグナル (2026-06-24 / `gh` 実測): stars 7,658、forks 1,775、contributors 326、最新リリース `v1.42.2` (2026-03-19)。org 横断では `operator-lifecycle-manager` 1,859 stars、`java-operator-sdk` 931 stars (出典 3)
- ベンダー個別の adopter 名は本ステージでは citable なものが取れていない。write 段で必要なら OperatorHub / CNCF ケーススタディを追加調査

## 代替・エコシステム

- 統合先 / 兄弟: OLM v0 (`operator-lifecycle-manager`)、OLM v1 (`operator-controller`)、`operator-registry` (FBC / opm)、OperatorHub.io。Java は `java-operator-sdk` (出典 6,9,10)
- 上流基盤: kubebuilder (Go スキャフォルド本体)。operator-sdk は kubebuilder のスーパーセット的位置づけ
- 代替: Kubebuilder 単体 (OLM 連携や Ansible/Helm サポートが不要なら直接使える)、KUDO、Metacontroller、Crossplane (CRD 駆動だが provider/composition 寄りで目的が別)、kopf (Python)、shell-operator や kube-rs などの言語別フレームワーク
- 本質的な差: operator-sdk の独自性は「Go/Ansible/Helm の 3 言語を同一 CLI で扱える」点と「scorecard 検証 + bundle 化 + OLM デプロイ」までを一気通貫で持つ配布レイヤ。純粋な controller 生成だけなら kubebuilder で足りる

## taglines

- EN: Toolkit to build, package, and ship Kubernetes Operators in Go, Ansible, or Helm, wired into OLM for install and upgrades.
- JA: Go / Ansible / Helm で Kubernetes Operator を作り、bundle 化して OLM 経由で配布・更新まで通すツールキット。
</content>
