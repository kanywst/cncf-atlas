# 内部実装

> コミット `af53e98` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/kbs` | Key Broker Service: HTTP フロントエンド、RCAR ハンドシェイク、ポリシーゲート、plugin。 |
| `src/kbs/src/api_server.rs` | actix-web サーバと単一の `api` リクエストディスパッチャ。 |
| `src/kbs/src/attestation/backend.rs` | `Attest` トレイト、`AttestationService`、`__auth` / `__attest` フロー。 |
| `src/kbs/src/attestation/session.rs` | RCAR セッションの状態機械と key-value 永続化。 |
| `src/attestation-service` | Attestation Service: evidence を評価し attestation token を発行。 |
| `src/deps/verifier` | `Verifier` トレイトの背後にある TEE 別ハードウェア verifier。 |
| `src/rvps` | Reference Value Provider Service: 期待測定値を保持。 |
| `src/tools` | `kbs-client` と `trustee-cli` の管理・テストクライアント。 |

## 中核データ構造

`ApiServer` (`src/kbs/src/api_server.rs:51`) は HTTP 層と各サブシステムを束ねる。`plugin_manager` (`src/kbs/src/api_server.rs:52`)、feature gate 付きの `attestation_service` (`src/kbs/src/api_server.rs:55`)、`policy_engine: PolicyEngine<Regorus>` (`src/kbs/src/api_server.rs:57`)、`admin` (`src/kbs/src/api_server.rs:58`)、`token_verifier` (`src/kbs/src/api_server.rs:60`)。

`AttestationService` (`src/kbs/src/attestation/backend.rs:128`) は RCAR の状態と検証委譲を持つ。`inner: Arc<dyn Attest>` (`src/kbs/src/attestation/backend.rs:130`)、`session_map: SessionMap` (`src/kbs/src/attestation/backend.rs:133`)、`timeout: i64` (`src/kbs/src/attestation/backend.rs:136`)。

マルチ TEE 対応は 2 つの trait object に乗っている。`Attest` (`src/kbs/src/attestation/backend.rs:89`) が Attestation Service を抽象化し、`Verifier` (`src/deps/verifier/src/lib.rs:218`) が 1 つの TEE 種別のハードウェア検証を抽象化し、`evaluate` (`src/deps/verifier/src/lib.rs:248`) が実処理を行う。`IndependentEvidence` 構造体 (`src/kbs/src/attestation/backend.rs:54`) は 1 attester 分の evidence を保持し、1 リクエストで複数 TEE の evidence を運べる。

RCAR ハンドシェイクは有限状態機械 `SessionStatus` (`src/kbs/src/attestation/session.rs:22`) である:

```rust
pub(crate) enum SessionStatus {
    Authed {
        request: Request,
        challenge: Challenge,
        id: String,
        #[serde(with = "time::serde::rfc3339")]
        timeout: OffsetDateTime,
    },

    Attested {
        token: String,
        id: String,
        #[serde(with = "time::serde::rfc3339")]
        timeout: OffsetDateTime,
    },
}
```

セッションは `Authed` (`src/kbs/src/attestation/session.rs:23`) で始まり、`attest()` (`src/kbs/src/attestation/session.rs:94`) を経て `Attested` (`src/kbs/src/attestation/session.rs:31`) に遷移する。ワイヤ型 `Request`、`Challenge`、`Attestation` は外部 crate `kbs-types` 由来である。

## 追う価値のあるパス

サーバ全体が 1 つのルートである。`ApiServer::server` は単一の catch-all resource を登録する (`src/kbs/src/api_server.rs:172`):

```rust
                    .service(
                        web::resource([kbs_path!("{path:.*}")])
                            .route(web::get().to(api))
                            .route(web::post().to(api))
                            .route(web::put().to(api))
                            .route(web::delete().to(api)),
                    )
```

すべてのメソッドが `api` (`src/kbs/src/api_server.rs:211`) に着地し、先頭パスセグメントを plugin 名として取り (`let plugin = path_parts[0];`、`src/kbs/src/api_server.rs:230`)、それで match する (`src/kbs/src/api_server.rs:247`)。`auth` では nonce が `make_nonce` (`src/kbs/src/attestation/backend.rs:65`) で生成される:

```rust
const NONCE_SIZE_BYTES: usize = 32;

/// Create a nonce and return as a base-64 encoded string.
pub async fn make_nonce() -> anyhow::Result<String> {
    let mut nonce: Vec<u8> = vec![0; NONCE_SIZE_BYTES];

    OsRng.fill_bytes(&mut nonce[..]);

    Ok(STANDARD.encode(&nonce))
}
```

`attest` では、唯一の anti-replay チェックが 1 つの比較である (`src/kbs/src/attestation/backend.rs:344`):

```rust
        if nonce != attestation.runtime_data.nonce {
            bail!("the nonce in the handshake session is different from the client side in KBS protocol's Attestation message");
        }
```

attestation evidence で返ってきた nonce が `auth` で発行した nonce と一致しなければリクエストは拒否される。`self.inner.verify(evidence_to_verify)` (`src/kbs/src/attestation/backend.rs:404`) が成功すると、セッションは `Attested` に遷移し永続化される (`src/kbs/src/attestation/backend.rs:425`)。

セッションは key-value 抽象に永続化される。`SessionMap::insert` は `serde_json` で直列化し (`src/kbs/src/attestation/session.rs:120`)、`get` は読み戻して期限切れエントリを捨て (`src/kbs/src/attestation/session.rs:134`)、`cleanup_expired` がストアを掃除する (`src/kbs/src/attestation/session.rs:147`)。

## 読んで驚いた点

Rego ゲートは意図的に fail-closed する。token 検証の後、ハンドラは `evaluate_rego` (`src/kbs/src/api_server.rs:415`) で `data.policy.allow` を評価する。ポリシーがそのルールを定義していなければ、コードは警告を出して `false` を既定にする (`src/kbs/src/api_server.rs:428`)。ルールの結果が bool でなければ、再び `false` を既定にする (`src/kbs/src/api_server.rs:434`)。ポリシーが欠けていたり不正でも、許可ではなく拒否に倒れる。

期限切れセッションの掃除は単純な固定間隔ループではない。`AttestationService::new` で spawn されるバックグラウンドタスクは、正常時は 60 秒ごとに `cleanup_expired` を走らせるが、失敗時には初期 5 秒・最大 300 秒の指数バックオフに切り替える (`src/kbs/src/attestation/backend.rs:187`)。これによりストレージバックエンドの障害がリトライの嵐にならない。
