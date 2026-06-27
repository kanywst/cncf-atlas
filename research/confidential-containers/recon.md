# recon: Confidential Containers (trustee)

調査メモ。自分用の密度。出典は URL を添える。読んだ `file:line` は `research/confidential-containers/src` の clone (下記 pin) を実際に開いて確認したもの。

CoCo = Confidential Containers の略。プロジェクト全体は GitHub org [confidential-containers](https://github.com/confidential-containers) に分散している。`confidential-containers/confidential-containers` は docs / governance / ADOPTERS のメタ repo で実装コードは無い。実装の中核で deep-dive の対象に選んだのは **trustee** (Rust, 認証 = attestation とシークレット配布の server 側)。trustee は org 内の純粋実装 repo で最も star が多く、CoCo の信頼モデル (リモート認証に合格した Pod にだけ鍵を渡す) がここに集約されている。

略語の初出展開: TEE (Trusted Execution Environment), KBS (Key Broker Service), AS (Attestation Service), RVPS (Reference Value Provider Service), RCAR (Request-Challenge-Attestation-Response), AA (Attestation Agent), CDH (Confidential Data Hub), JWE (JSON Web Encryption), JWT (JSON Web Token), JWK (JSON Web Key), RATS (Remote ATtestation procedureS), CVM (Confidential Virtual Machine), CRD (Custom Resource Definition)。

## 基本情報

- repo: `confidential-containers/trustee` (deep-dive 対象。プロジェクト全体名は Confidential Containers)
- pinned commit: `af53e983f15500db6600430c089da796a6c1c6bc` (2026-06-26) / 近いタグ: `v0.20.0` (2026-05-19、HEAD はその後の main)
- 言語 / ビルド: Rust (workspace, edition 2021) / `make background-check-kbs` でバイナリ、`docker compose up` で KBS + AS + RVPS 一式
- ライセンス: Apache-2.0 (`src/LICENSE` 1-4 行目が "Apache License Version 2.0"、本文に "Apache License" 4 箇所。GitHub API も `Apache-2.0`)
- CNCF 成熟度: Sandbox (2022-03-08 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Security & Compliance

### workspace 構成 (`src/Cargo.toml` 2-13 行目)

メンバ: `kbs`, `attestation-service`, `rvps`, `tools/kbs-client`, `deps/verifier`, `deps/eventlog`, `integration-tests`, `tools/trustee-cli`, `deps/key-value-storage`, `deps/policy-engine`。

Rust 行数の目安 (clone 上で `find -name '*.rs' | xargs wc -l`): `kbs` 9,461 / `deps` 13,834 (大半が `deps/verifier` のハードウェア別検証器) / `attestation-service` 2,634 / `rvps` 1,518 / `tools` 1,200 / `integration-tests` 1,395。

主要外部依存 (`src/Cargo.toml`): `actix-web` 4 (HTTP), `regorus` 0.10 (Rego policy engine), `jsonwebtoken` 10, `ear` 0.5 (EAR = Entity Attestation Result token), `kbs-types` 0.15、guest 側プロトコル型 `kbs_protocol` / `kms` は guest-components を git rev で参照。

## 歴史の素材

- 起源: 2022 年に PoC として出発。当初は containerd の独自ブランチを持っていたが後に廃止、作業の多くは Kata Containers 本流へマージされた。CoCo は Kata Containers の軽量 VM (UVM) を sandbox として再利用し、その上に attestation とシークレット配布の層を載せる構成。出典: Red Hat ブログ [What is the Confidential Containers project?](https://www.redhat.com/en/blog/what-confidential-containers-project)。
- CNCF Sandbox 受理: 2022-03-08。出典: [CNCF project page](https://www.cncf.io/projects/confidential-containers/)、オンボーディング issue [cncf/sandbox#216](https://github.com/cncf/sandbox/issues/216)。
- 2 つのランタイム実装: `ccruntime` (既定、Kata ベースの VM 隔離) と `enclave-cc` (Intel SGX のプロセス隔離)。`enclave-cc` は deprecation 検討中。出典: [enclave-cc README](https://github.com/confidential-containers/enclave-cc)。
- trustee repo 自体は 2022-04-25 作成 (GitHub API `created_at`)。リリースは継続的: `v0.20.0` 2026-05-19, `v0.19.0` 2026-04-30, `v0.18.0` 2026-03-23 ... (GitHub releases API)。
- 攻撃モデルの肝: クラウド事業者・ホスト OS・ハイパーバイザを信頼境界の外に置き、データ使用中 (in-use) を TEE で守る。AA が KBS にリモート認証を行い、合格後にだけ復号鍵やシークレットが CVM 内へ配布される。出典: Red Hat ブログ [Understanding the Confidential Containers Attestation Flow](https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow)。

## アーキテクチャの素材

### トップレベル (trustee 内)

- **KBS (Key Broker Service)** `src/kbs`: HTTP front end。RCAR ハンドシェイクのエンドポイント、シークレット配布 (resource plugin)、Rego policy gate を持つ。relying party (RATS 用語) に相当。
- **AS (Attestation Service)** `src/attestation-service` + `deps/verifier`: ハードウェア evidence を検証して attestation token (JWT) を発行する verifier。KBS にビルトイン (crate) でも gRPC リモートでも、または Intel Trust Authority でも差し替え可能。
- **RVPS (Reference Value Provider Service)** `src/rvps`: 期待される測定値 (reference values) を保持し AS の検証に供給。
- **kbs-client / trustee-cli** `src/tools`: 管理 + テスト用クライアント。

guest 側 (AA, CDH, image-rs) は別 repo `guest-components`。trustee はその counterpart。

### デプロイモデル (RATS)

- **Background Check mode** (既定): AA が KBS にハードウェア evidence を送り、KBS の背後の AS が検証し、KBS が relying party になる。`src/kbs/README.md` の mermaid 図参照。
- **Passport mode**: 検証用 KBS1 (+ AS) とシークレット配布用 KBS2 を分離。CoCo は AS への直結を許さないため KBS1 が verifier の窓口になる。出典: `src/kbs/README.md`、[RATS architecture draft](https://www.ietf.org/archive/id/draft-ietf-rats-architecture-22.html)。

### 代表オペレーションの end-to-end トレース: RCAR ハンドシェイク + シークレット取得

起動は `src/kbs/src/bin/kbs.rs` の `main` (kbs.rs:22)。`KbsConfig::try_from` (kbs.rs:64) で TOML を読み、`ApiServer::new` (kbs.rs:68) のあと `serve` (kbs.rs:70)。`ApiServer::server` (api_server.rs:147) は actix-web を立て、**単一の catch-all route** `web::resource([kbs_path!("{path:.*}")])` (api_server.rs:172) に GET/POST/PUT/DELETE を全て `api` ハンドラへ束ねる。prefix は `const KBS_PREFIX: &str = "/kbs/v0";` (api_server.rs:33)。

`api` ハンドラ (api_server.rs:211) はパスを `/` で split し、先頭セグメントを **plugin 名として文字列 match** する (`let plugin = path_parts[0];` api_server.rs:230、match は api_server.rs:247)。

1. **POST `/kbs/v0/auth`** で match arm (api_server.rs:249) が `AttestationService::auth` を呼ぶ。`auth` (backend.rs:233) から `__auth` (backend.rs:239): body を `kbs_types::Request` にデシリアライズ、KBS protocol version を `VERSION_REQ` (= `0.4.0`, backend.rs:35-37) と照合 (backend.rs:248)、`generate_challenge` (backend.rs:257) で 32 byte の nonce を生成 (`make_nonce` backend.rs:65、`NONCE_SIZE_BYTES = 32` backend.rs:62)、`SessionStatus::auth` (backend.rs:264, session.rs:59) で `Authed` セッションを作り、`Set-Cookie: kbs-session-id` (session.rs:18, 72) と `Challenge` を返し `session_map.insert` (backend.rs:272) で永続化。

2. **POST `/kbs/v0/attest`** で match arm (api_server.rs:255) が `AttestationService::attest` (backend.rs:277) から `__attest` (backend.rs:283): cookie からセッション取得 (backend.rs:290)、body を `kbs_types::Attestation` にデシリアライズ、**nonce 突合** (`if nonce != attestation.runtime_data.nonce { bail!(...) }` backend.rs:344) で replay を防ぐ。`IndependentEvidence` (backend.rs:54) を組み立て primary evidence を push (backend.rs:371)、追加 evidence があれば足す。`self.inner.verify(evidence_to_verify)` (backend.rs:404) で `Attest` トレイト実装 (= AS) に検証委譲、戻り値の attestation token (JWT 文字列) を `session.attest(token)` (backend.rs:425, session.rs:94) でセッションを `Attested` に遷移させ `insert` (backend.rs:427)、`{"token": ...}` を返す。

3. **GET `/kbs/v0/resource/...` などの plugin** で match の fallback arm (api_server.rs:378)。`plugin_manager.get` (api_server.rs:379) で plugin を引く。admin 認可不要の経路では `get_attestation_token` (api_server.rs:403、定義 api_server.rs:64 はまずセッション cookie 経由の token、無ければ `Authorization: Bearer`) で token を取り、`token_verifier.verify(token)` (api_server.rs:407) で JWT を検証して claims を得る。`policy_engine.evaluate_rego(...)` (api_server.rs:415) が Rego ルール `data.policy.allow` (`KBS_POLICY_RULE` api_server.rs:38) を評価、false なら `Error::PolicyDeny` (api_server.rs:441)。許可なら `plugin.handle` (api_server.rs:446)。plugin が `encrypted` (api_server.rs:450) を返す場合、token claims から TEE の公開鍵を取り出し (`extract_tee_public_key` api_server.rs:455)、`jwe(public_key, response)` (api_server.rs:456-457) でシークレットを JWE 暗号化して返す。これにより平文鍵がネットワークに出ず、対象 CVM だけが復号できる。

検証器の実体は `Attest` トレイト (backend.rs:89) の `verify` (backend.rs:97) = AS。AS はさらに `deps/verifier` の `pub trait Verifier` (verifier/lib.rs:218) の `evaluate` (verifier/lib.rs:248) を TEE 種別ごとに呼ぶ。`deps/verifier/src` 配下に `tdx`, `snp`, `sgx`, `se` (IBM Secure Execution), `cca` (Arm), `csv`/`hygon_dcu` (Hygon), `az_snp_vtpm`/`az_tdx_vtpm` (Azure vTPM), `nvidia`, `tpm`, `sample` がある。`evaluate` は `report_data` (nonce + TEE 公開鍵のバインド) と `init_data_hash` をハードウェア署名に対して突合する (verifier/lib.rs:244-253 の doc)。

### 設計判断 (非自明)

- **KBS はハードウェア evidence を自分で検証しない**。検証は差し替え可能な `Attest` バックエンド (builtin crate / gRPC / Intel Trust Authority、`AttestationService::new` の match backend.rs:151-174) に委譲し、信頼のヒンジは AS が発行する attestation token (JWT) になる。KBS は後段で `token_verifier` を使ってその JWT を再検証するだけ。これがシークレット配布 (relying party) と evidence 評価 (verifier) を分離する RATS background-check / passport の実装。
- **全エンドポイントが単一 catch-all route + 先頭パスセグメント = plugin 名のディスパッチ** (api_server.rs:172, 230)。`auth`/`attest`/`attestation-policy`/`reference-value`/`resource-policy` は built-in、それ以外は PluginManager 経由。resource 取得もシークレット配布も「attestation token + Rego policy」という単一ゲートを通す統一設計。
- **セッションは KeyValueStorage 抽象に serde_json で永続化** (session.rs:111-145)。memory や他バックエンドを差し替え可能で、起動時に 60 秒間隔の期限切れ掃除タスクを spawn (backend.rs:184-213, `cleanup_expired` session.rs:147)。

## 内部実装の素材

中核データ構造 (3-5):

1. **`ApiServer`** (api_server.rs:51): `plugin_manager` (52), `attestation_service` (55, feature gate), `policy_engine: PolicyEngine<Regorus>` (57), `admin` (58), `token_verifier` (60)。HTTP 層と各サブシステムを束ねる。
2. **`AttestationService`** (backend.rs:128): `inner: Arc<dyn Attest>` (130, 差し替え可能 AS), `session_map: SessionMap` (133), `timeout: i64` (136)。RCAR の状態と検証委譲を持つ。
3. **`Attest` トレイト** (backend.rs:89) と **`Verifier` トレイト** (verifier/lib.rs:218): 前者が AS の抽象、後者が TEE 種別ごとのハードウェア検証の抽象。CoCo のマルチ TEE 対応はこの 2 段の trait object で実現。
4. **`SessionStatus` enum** (session.rs:22): RCAR の有限状態機械。`Authed { request, challenge, id, timeout }` (23) から `attest()` (94) を経て `Attested { token, id, timeout }` (31)。
5. **`IndependentEvidence`** (backend.rs:54): 1 attester 分の evidence (`tee`, `tee_evidence`, `runtime_data`, `init_data`)。複数 TEE の合成検証を許す。

外部 crate `kbs-types` の `Request` / `Challenge` / `Attestation` が KBS protocol のワイヤ型 (session.rs:12, backend.rs:12 で import)。

追う価値のあるパス: 上記 RCAR トレース (backend.rs:239-433) と plugin ゲート (api_server.rs:378-465)。驚いた点: nonce 突合が 1 行の `bail!` (backend.rs:344) で、ここが anti-replay の唯一の砦。token 検証後の Rego 評価で `data.policy.allow` ルールが未定義/非 bool のときは false に倒し warn を出す防御的実装 (api_server.rs:428-438)。

エントリポイント: `src/kbs/src/bin/kbs.rs` の `main` (kbs.rs:22)。

## 採用事例の素材

出典は `confidential-containers/confidential-containers` の [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) (参照 2026-06-27)。記載組織:

- **Alibaba Cloud**: Elastic Algorithm Service / Elastic GPU Service でユーザデータと AI モデルを CSP から保護。
- **Red Hat**: OpenShift sandboxed containers として提供 (Intel TDX, AMD SEV-SNP, IBM Z)。
- **IBM**: LinuxONE + OpenShift で Secure Execution for Linux と統合。
- **Edgeless Systems**: Contrast で Kubernetes 上の confidential 配備を運用。
- **ByteDance**: Jeddak Sandbox で CoCo を利用。
- **Intel**: Enterprise-RAG / OPEA を Intel TDX 上で運用。
- **JDCloud** (JoyScale), **NanhuLab** (Trusted Big Data Sharing), **Switchboard** (AMD SEV-SNP bare metal の分散オラクル), **Kubermatic** (KubeOne bare metal), **KubeArmor** (相互運用) も ADOPTERS.md 記載。

GitHub シグナル (GitHub API, 参照 2026-06-27): trustee star 165 / fork 158 / contributors 約 60。guest-components star 125 / contributors 約 78。メタ repo `confidential-containers` star 364。協賛企業として Alibaba Cloud, AMD, ARM, IBM, Intel, Microsoft, Red Hat, Rivos 等 (CNCF / Red Hat ブログ)。

## 代替・エコシステム

- **基盤として再利用**: Kata Containers (VM sandbox), containerd, ocicrypt-rs (暗号化イメージ), Rego/regorus (policy)。CoCo は新しい runtime を一から作るのでなく Kata 上に attestation 層を載せる。
- **隣接 CNCF**: SPIFFE/SPIRE (workload identity、ただし TEE ハードウェア attestation ではない)、Kata Containers (CNCF, sandbox runtime)。
- **代替/競合**:
  - **Edgeless Systems Constellation / Contrast**: confidential Kubernetes をプロダクト化 (Contrast 自体は CoCo を利用する adopter でもある)。
  - **Enarx / Veracruz**: WebAssembly を TEE で動かす方向。コンテナでなく Wasm runtime が単位。
  - **Gramine / Occlum / SCONE**: 単一プロセスを SGX に入れる LibOS 系。CoCo の `enclave-cc` がこの領域に近いが、CoCo 本流は VM (TDX/SEV-SNP/SE) ベースで無改変の Pod をそのまま CVM に入れる点が差。
  - クラウド managed: Azure Confidential Containers (ACI/AKS), Google Confidential GKE Nodes。CoCo はベンダ非依存・OSS でマルチ TEE を 1 つの attestation/KBS で扱う点が distinction。
- **差の本質**: Kubernetes に無改変の Pod を載せたまま、リモート認証に合格した CVM にだけ鍵/シークレットを配る統一フロー。加えて TDX/SEV-SNP/SGX/IBM SE/Arm CCA/NVIDIA GPU を 1 つの Verifier 抽象で束ねるマルチ TEE 対応が CoCo の独自価値。
