# 内部実装

> コミット `604bdcb` のソースから読む。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 役割 |
| --- | --- |
| `shared/src/akri/configuration.rs` | Configuration CRD 型 (`ConfigurationSpec`、`BrokerSpec`) |
| `shared/src/akri/instance.rs` | Instance CRD 型 (`InstanceSpec`) とそのフィールド |
| `agent/src/main.rs` | Agent エントリポイントと起動タスク |
| `agent/src/discovery_handler_manager/discovery_handler_registry.rs` | DH registry、デバイスハッシュ、Instance 生成 |
| `agent/src/device_manager/cdi.rs` | Container Device Interface (CDI) スキーマと変換 |
| `agent/src/util/discovery_configuration_controller.rs` | Agent 上の Configuration reconcile ループ |
| `controller/src/main.rs` | Controller エントリポイントと watcher |
| `controller/src/util/instance_action.rs` | `InstanceAction` enum と broker 管理ロジック |
| `discovery-utils/proto/discovery.proto` | gRPC Registration / DiscoveryHandler サービス |

## 中核データ構造

システムは少数の型を軸に回る。

- `shared/src/akri/configuration.rs:114` の `ConfigurationSpec` は「何を発見するか」のユーザ宣言。
- `shared/src/akri/instance.rs:54` の `InstanceSpec` は 1 つの発見デバイスとその使用スロット。`device_usage` map は `shared/src/akri/instance.rs:90`。
- `DiscoveredDevice` は `agent/src/discovery_handler_manager/discovery_handler_registry.rs:52` の enum で、`LocalDevice(Device, String)` と `SharedDevice(Device)` の variant を持つ。ローカル variant の `String` はノード名。この enum が Instance 名ハッシュの入力になる。
- `agent/src/discovery_handler_manager/discovery_handler_registry.rs:172` の `DHRequestImpl` は Configuration 1 つにつき 1 つの discovery request で、複数 DH エンドポイントの結果を `watch::Receiver` チャネルのベクタで集約する。
- `agent/src/device_manager/cdi.rs:11` の CDI `Device` と `agent/src/device_manager/cdi.rs:21` の `ContainerEdit` が、デバイスをコンテナに注入する方法を表す。

## 追う価値のあるパス

発見デバイスが安定した名前を持つ Instance になるまでを追う。

Agent が DH からデバイスを受け取ると、`agent/src/discovery_handler_manager/discovery_handler_registry.rs:186` の `get_instances` が各デバイスを `agent/src/discovery_handler_manager/discovery_handler_registry.rs:213` の `device_to_instance` で変換する。この関数は `InstanceSpec` を構築し、Instance の metadata 名を configuration key とデバイスごとのハッシュの連結で `agent/src/discovery_handler_manager/discovery_handler_registry.rs:239` に設定する。

```rust
            metadata: ObjectMeta {
                name: Some(format!("{}-{}", self.key, dev.device_hash())),
                ..Default::default()
            },
```

CDI fully qualified name も同様に `agent/src/discovery_handler_manager/discovery_handler_registry.rs:246` で `format!("{}/{}={}", AKRI_PREFIX, self.key, dev.device_hash())` として作られる。つまり Instance 名も CDI 名も `device_hash` に依存する。

## 驚いた点

shared と local の挙動全体は `agent/src/discovery_handler_manager/discovery_handler_registry.rs:63` の `device_hash` に宿る。

```rust
    fn device_hash(&self) -> String {
        let (id_to_digest, shared, node_name) = match self {
            DiscoveredDevice::LocalDevice(d, n) => (d.id.to_owned(), false, n.as_str()),
            DiscoveredDevice::SharedDevice(d) => (d.id.to_owned(), true, ""),
        };
        let mut id_to_digest = id_to_digest.to_string();
        // For local devices, include node hostname in id_to_digest so instances have unique names
        if !shared {
            id_to_digest = format!("{id_to_digest}{node_name}");
        }
```

共有デバイス (複数ノードから見える IP カメラ) は `id` だけを 3 byte の Blake2b ハッシュにかけるので、どのノードが発見しても同じ Instance 名に解決する。これが「1 デバイス、1 Instance、複数ノードで共有」を成立させる。ローカルデバイス (USB 周辺機器) はハッシュ前に `agent/src/discovery_handler_manager/discovery_handler_registry.rs:70` でノード名を id に連結するので、2 ノード上の同じ id が 2 つの別 Instance になる。`shared` のブール 1 つが所有モデル全体を切り替える。

2 つ目の非自明な選択は、デバイス注入を CDI スキーマ上に作り直したこと。モジュールヘッダは正確な spec バージョンを `agent/src/device_manager/cdi.rs:1` に記録する。発見デバイスから CDI デバイスへの変換は `agent/src/discovery_handler_manager/discovery_handler_registry.rs:94` の `impl From<DiscoveredDevice> for cdi::Device` で、デバイスの `properties` は `agent/src/discovery_handler_manager/discovery_handler_registry.rs:102` で `container_edits.env` の要素になり、`device_specs` と `mounts` は `agent/src/discovery_handler_manager/discovery_handler_registry.rs:107` で CDI の `device_nodes` と `mounts` にマップされる。

3 つ目は、Agent の reconcile ループがタイマーで自己修復すること。成功した reconcile は `SUCCESS_REQUEUE` 後に requeue する。これは `agent/src/util/discovery_configuration_controller.rs:38` で 600 秒と定義される。一方 `agent/src/util/discovery_configuration_controller.rs:176` の `error_policy` は Configuration ごとのバックオフを倍々にし、500 ms から始まる (`agent/src/util/discovery_configuration_controller.rs:181`)。reconcile はチャネル経由で push される discovery 状態変化にも反応する。これは `agent/src/util/discovery_configuration_controller.rs:54` の `start_controller` で設定されるので、タイマーだけに依存しない。
