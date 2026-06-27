# recon: Akri

調査メモ。Akri = A Kubernetes Resource Interface (ギリシャ語で「エッジ」の意味もかけてある)。エッジの leaf device (IP カメラ / USB / OPC UA サーバ等) を Kubernetes の device plugin framework に乗せて、リソースとして広告し broker workload をスケジュールさせる。出典は sources.md の番号と対応。

## 基本情報

- repo: `project-akri/akri` (<https://github.com/project-akri/akri>) (S1)
- pinned commit: `604bdcb6a575073f32d72f63147b048242ae8032` (2026-06-11) / 近いタグ: `v0.13.8` (`git describe` = `v0.13.8-52-g604bdcb`)。`v0.13.8` のタグ日は 2024-11-10、release 公開は 2024-11-20 (全リリースが pre-release 扱い、1.0 未満)。
- ワークスペース版数: `0.13.26` (`Cargo.toml` の `[workspace.package].version`、開発中の次版)
- 言語 / ビルド: Rust (edition 2024, rustc 1.88 要求) / Cargo workspace + `Makefile` + Helm chart (`deployment/helm`)。ターゲット Kubernetes は v1.33 以上、Linux amd64/arm64v8/arm32v7 (S6)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認。CNCF 入りの際に MIT から変更) (S2)
- CNCF 成熟度: Sandbox (2021-09-14 受理) (S2)(S3)
- カテゴリ (CATEGORY_ORDER から): Orchestration & Scheduling

## 歴史の素材

- 出自は Microsoft DeisLabs。2020-12 に公開議論、初期リポは `github.com/deislabs/akri`、初期ライセンスは姉妹プロジェクト Krustlet に倣って MIT (S4)。
- 解決したかった課題: Kubernetes ノードになれないほど小さい (compute 不足) デバイスをクラスタに取り込む。エッジ固有の「デバイス発見」「ネットワーク IoT の断続的接続」「複数ノードでのデバイス共有」を device plugin framework の拡張で扱う (S4)(S1)。
- 2021-09-14 に CNCF Sandbox 受理。onboarding で MIT から Apache-2.0 へ変更、`GOVERNANCE.md` 追加で open governance 採用、Slack を Kubernetes Slack `#akri` に移行 (S2)(S3)。
- リポを中立組織 `project-akri` へ移設。`v0.7.0` がこの移設後の最初のリリース (破壊的変更なし、移行明示のため minor を bump) (S4)。
- v0.4.0 で Discovery Handler を Agent イメージ埋め込みから独立 DaemonSet 配備へ分離 (S6)。

## アーキテクチャの素材

5 つの構成要素: 2 つの CRD (Configuration / Instance)、Discovery Handler 群、Agent (device plugin 実装、DaemonSet)、Controller (S1)。

- Configuration CRD = 「何を探すか」のユーザ宣言。`discoveryHandler` (使う DH 名 + details)、`capacity` (同一デバイスを使えるノード数)、`brokerSpec` (PodSpec か JobSpec)、`instanceServiceSpec` / `configurationServiceSpec`、`brokerProperties`。定義: `shared/src/akri/configuration.rs:114` (`ConfigurationSpec`)、`group = "akri.sh", version = "v0"` は同 `:106-112`。broker は Pod か Job の二択 enum `shared/src/akri/configuration.rs:90` (`BrokerSpec`)。
- Instance CRD = 発見された 1 デバイス。`shared/src/akri/instance.rs:54` (`InstanceSpec`)。`cdi_name` (`:59`)、`shared` (`:76`)、`nodes` (`:81`)、`device_usage` スロット map (`:90`)。`shortname = "akrii"` (`:27`)。
- Agent エントリ `agent/src/main.rs:23`。起動タスク: registration server (`:49` `run_registration_server`)、`InMemoryManager` (`:58`)、`DevicePluginManager` (`:61`)、`start_dpm` (`:69`)、slot reclaimer (`:75` `start_reclaimer`)、Configuration controller (`:89` `start_controller`)。DH registry は `:42` `new_registry` で生成。
- Controller エントリ `controller/src/main.rs:21`。`handle_existing_instances` (`:42`)、`do_instance_watch` (`:48`)、`NodeWatcher` (`:56`)、`BrokerPodWatcher` (`:63`) を spawn。Instance の Add/Remove/Update に応じて broker Pod/Job と Service を作る。Action 定義: `controller/src/util/instance_action.rs:46` (`InstanceAction`)。
- DH 通信は gRPC、proto は `discovery-utils/proto/discovery.proto`。`Registration` service (DH が Agent に登録、UDS or NETWORK エンドポイント、`shared` フラグ) と `DiscoveryHandler` service (`rpc Discover` が `stream DiscoverResponse` を返す server streaming)。`Device` メッセージは `id` + `properties` + `mounts` + `device_specs`。

## 内部実装の素材

### 中核データ構造 (3-5)

1. `ConfigurationSpec` — ユーザ向けの宣言。`shared/src/akri/configuration.rs:114`。
2. `InstanceSpec` — 発見デバイスの実体 + 使用状況スロット。`shared/src/akri/instance.rs:54`。
3. `DiscoveredDevice` enum — `LocalDevice(Device, node_name)` / `SharedDevice(Device)`。`agent/src/discovery_handler_manager/discovery_handler_registry.rs:52`。Instance 名のハッシュ生成の入力。
4. `DHRequestImpl` — Configuration 1 つにつき 1 つの discovery request。複数 DH エンドポイントの結果を `watch::Receiver` で集約。`agent/src/discovery_handler_manager/discovery_handler_registry.rs:172`。
5. CDI (Container Device Interface) `Device` / `ContainerEdit` — デバイス注入の表現。`agent/src/device_manager/cdi.rs:11` (`Device`)、`:21` (`ContainerEdit`)。

### 代表的な中核操作: 発見から Instance 生成、broker 配備まで (end-to-end)

1. DH が起動し registration socket 経由で Agent に登録 (`Registration.RegisterDiscoveryHandler`、proto `discovery.proto`)。Agent 側受け口は `agent/src/main.rs:48` の `run_registration_server`。
2. ユーザが Configuration を apply。Agent の Configuration controller が reconcile。`agent/src/util/discovery_configuration_controller.rs:80` (`reconcile`)。finalizer 付与は同 `:99-105`。
3. 初回 reconcile は request 未存在なので `new_request` を発行し空 vec を返す。`discovery_configuration_controller.rs:134-146` (None 分岐、`vec![]` は `:146`)。`new_request` の trait 定義は `discovery_handler_registry.rs:151`。
4. request は登録済み DH に gRPC `Discover` を投げる。`discovery_handler_registry.rs:309` (`query`) が `DiscoverRequest` を組み立て (`:314`)、`discovery_handler.query(...)` を呼ぶ。`discovery_properties` は ConfigMap/Secret から解決 (`solve_discovery_properties` `:322`)。
5. DH からの device list は `watch_devices` (`discovery_handler_registry.rs:249`) が監視し、`get_device_cdi_fqdn` で dedup (`:285`)、CDI `Kind` を `send_replace` (`:288`) して device manager / device plugin に流す。
6. 次の reconcile では `get_request` が hit し、`get_instances` (`discovery_handler_registry.rs:186`) が各エンドポイントの最新 device を `device_to_instance` (`:213`) で Instance に変換。Instance 名は `format!("{}-{}", key, device_hash())` (`:239`)、`cdi_name` は `format!("{}/{}={}", AKRI_PREFIX, key, hash)` (`:246`)。
7. Agent の config controller reconcile が、発見 Instance に自ノード名と owner_reference を載せ (`discovery_configuration_controller.rs:127-128`)、消えたデバイスの Instance を削除 (`:149-162`)、現存分を server-side apply (`:164-170`)。
8. Akri Controller が Instance イベントを watch し (`controller/src/main.rs:48`)、`InstanceAction` に応じて broker Pod (各ノードに capacity まで) か Job を配備し、Instance/Configuration service を作る。挙動表は `controller/src/util/instance_action.rs:32-43` の doc コメント、enum は `:46`。
9. reconcile 成功で 600 秒後に requeue (`discovery_configuration_controller.rs:38` `SUCCESS_REQUEUE`)、失敗は指数バックオフ (初期 500ms を倍々、`error_policy` `:176-191`)。

### 非自明な設計判断

`DiscoveredDevice::device_hash` (`discovery_handler_registry.rs:63`) が共有/ローカルでハッシュ入力を変える。共有デバイス (IP カメラ等、複数ノードから見える) は `id` のみを Blake2b (3 byte) でダイジェスト化するので、どのノードで発見されても同じ Instance 名に解決され「1 デバイス = 1 Instance を複数ノードで共有」が成立。ローカルデバイス (USB 等) は `id` にノード名を連結してからハッシュ (`:70-72`) し、同一 id でもノードごとに別 Instance になる。これにより `shared` フラグだけでマルチノード共有とノード固有所有を切り替える。スロット占有は `InstanceSpec.device_usage` (`instance.rs:90`) の map (slot から node、空文字は未割当) で表現し、`capacity` 個まで。

もう一つ: デバイス注入を旧来の device plugin の `Allocate` レスポンス直書きから CDI (Container Device Interface) v0.6.0 スキーマ (`agent/src/device_manager/cdi.rs:1-2` が spec URL を明記) に寄せている。`Device.properties` は `container_edits.env` へ、`device_specs`/`mounts` は CDI の `device_nodes`/`mounts` へ変換 (`discovery_handler_registry.rs:94-112` の `From<DiscoveredDevice> for cdi::Device`)。

## 採用事例の素材

- リポに `ADOPTERS.md` は存在するが「Adopters List」セクションは空 (組織が 1 件も列挙されていない、テンプレと requirements のみ。pinned commit で確認済み)。よって公開された名前付き採用組織を本調査では確証できなかった。誇張しない。
- GitHub シグナル (2026-06-26 時点、`gh api`): stars 1250、forks 165、contributors 46、open issues 88 (S1)。元は Microsoft が CNCF へ寄贈したプロジェクト群 (Helm, Akri, SMI, Virtual Kubelet) の一つ (S3)。
- 公開トーク: Kubernetes Podcast ep.132 (Kate Goldenring) で設計思想が語られている (S5)。

## 代替・エコシステム

- 統合先: Kubernetes device plugin framework の拡張。Helm で配備。ONVIF / udev / OPC UA / debug-echo の Discovery Handler を同梱、gRPC で独自 DH を足せる拡張モデル (S1)(S6)。Prometheus メトリクス (`akri_broker_pod_count` 等) を expose。
- 隣接 / 代替:
  - KubeEdge (CNCF Incubating): mapper + MQTT でデバイス制御、エッジノード自体を K8s ノードでなく EdgeCore にする。Akri は既存 K8s ノードを前提に「発見と広告」に絞る点が本質的な差。両者は補完的にも使える (S7)。
  - OpenYurt / SuperEdge: エッジに K8s 制御面を拡張するフレームワーク。デバイス発見が主目的ではない (S7)。
  - k3s / MicroK8s: 軽量 K8s ディストリ。Akri は「K8s を載せられないほど小さいデバイス」を対象にする点で層が違う (S7)。

## getting-started (最小構成)

前提: K8s v1.33+、`kubectl`、`helm` (S6)。

1. Helm リポ追加。

    ```bash
    helm repo add akri-helm-charts https://project-akri.github.io/akri/
    ```

2. Controller + Agent のみ導入。

    ```bash
    helm install akri akri-helm-charts/akri
    ```

3. udev DH と Configuration を有効化した実例 (USB video)。

    ```bash
    helm install akri akri-helm-charts/akri \
        --set udev.discovery.enabled=true \
        --set udev.configuration.enabled=true \
        --set udev.configuration.discoveryDetails.udevRules[0]='KERNEL=="video[0-9]*"' \
        --set udev.configuration.brokerPod.image.repository=nginx
    ```
