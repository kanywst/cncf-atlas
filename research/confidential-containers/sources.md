# sources: Confidential Containers

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。コード行の出典は `research/confidential-containers/src` の pin commit `af53e983f15500db6600430c089da796a6c1c6bc` を直接参照。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | confidential-containers/trustee (実装対象) | <https://github.com/confidential-containers/trustee> | 2026-06-27 |
| 2 | repo | confidential-containers org (プロジェクト全体) | <https://github.com/confidential-containers> | 2026-06-27 |
| 3 | repo | ADOPTERS.md (採用組織一覧) | <https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md> | 2026-06-27 |
| 4 | repo | architecture.md (メタ repo) | <https://github.com/confidential-containers/confidential-containers/blob/main/architecture.md> | 2026-06-27 |
| 5 | case-study | CNCF project page (Sandbox / 2022-03-08 受理確認) | <https://www.cncf.io/projects/confidential-containers/> | 2026-06-27 |
| 6 | repo | cncf/sandbox onboarding issue #216 | <https://github.com/cncf/sandbox/issues/216> | 2026-06-27 |
| 7 | blog | Red Hat: What is the Confidential Containers project? | <https://www.redhat.com/en/blog/what-confidential-containers-project> | 2026-06-27 |
| 8 | blog | Red Hat: Understanding the Confidential Containers Attestation Flow | <https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow> | 2026-06-27 |
| 9 | repo | enclave-cc (プロセス隔離ランタイム, deprecation 検討) | <https://github.com/confidential-containers/enclave-cc> | 2026-06-27 |
| 10 | spec | RATS architecture (background-check / passport 用語) | <https://www.ietf.org/archive/id/draft-ietf-rats-architecture-22.html> | 2026-06-27 |
| 11 | doc | project website | <https://confidentialcontainers.org/> | 2026-06-27 |
| 12 | repo | guest-components (AA / CDH / image-rs, counterpart) | <https://github.com/confidential-containers/guest-components> | 2026-06-27 |
| 13 | repo | kbs/README.md (デプロイモード, build) | <https://github.com/confidential-containers/trustee/blob/main/kbs/README.md> | 2026-06-27 |

## コード行アンカー (pin commit 直読)

| 主張 | file:line |
| --- | --- |
| KBS_PREFIX `/kbs/v0` | `src/kbs/src/api_server.rs:33` |
| KBS_POLICY_RULE `data.policy.allow` | `src/kbs/src/api_server.rs:38` |
| ApiServer 構造体 | `src/kbs/src/api_server.rs:51` |
| get_attestation_token (cookie or Bearer) | `src/kbs/src/api_server.rs:64` |
| 単一 catch-all route `{path:.*}` | `src/kbs/src/api_server.rs:172` |
| api ハンドラ | `src/kbs/src/api_server.rs:211` |
| plugin = path_parts[0] | `src/kbs/src/api_server.rs:230` |
| auth arm / attest arm | `src/kbs/src/api_server.rs:249` / `:255` |
| plugin fallback / token verify / Rego eval / PolicyDeny | `src/kbs/src/api_server.rs:378` / `:407` / `:415` / `:441` |
| JWE wrap (extract_tee_public_key, jwe) | `src/kbs/src/api_server.rs:455-457` |
| NONCE_SIZE_BYTES = 32 / make_nonce | `src/kbs/src/attestation/backend.rs:62` / `:65` |
| Attest トレイト / verify | `src/kbs/src/attestation/backend.rs:89` / `:97` |
| AttestationService 構造体 / new の backend match | `src/kbs/src/attestation/backend.rs:128` / `:151-174` |
| IndependentEvidence | `src/kbs/src/attestation/backend.rs:54` |
| __auth (version 照合, challenge, insert) | `src/kbs/src/attestation/backend.rs:239,248,257,272` |
| __attest (nonce 突合, inner.verify, attest) | `src/kbs/src/attestation/backend.rs:344,404,425` |
| SessionStatus enum (Authed/Attested) | `src/kbs/src/attestation/session.rs:22,23,31` |
| SessionMap insert/get/cleanup_expired | `src/kbs/src/attestation/session.rs:120,134,147` |
| Verifier トレイト / evaluate | `src/deps/verifier/src/lib.rs:218` / `:248` |
| ClientPlugin トレイト | `src/kbs/src/plugins/plugin_manager.rs:26` |
| エントリポイント main | `src/kbs/src/bin/kbs.rs:22` |
