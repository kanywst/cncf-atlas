# Notary Project

> Notary Project は X.509 PKI で OCI アーティファクトに署名・検証し、各署名を対象アーティファクトの隣にレジストリ内へ保存する。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [notaryproject/notation](https://github.com/notaryproject/notation)
- **ドキュメント基準コミット**: `51ff5ec` (2026-03-26)

## 何をするものか

Notary Project は OCI アーティファクトの署名・検証のための仕様群とツール群だ。旗艦実装は `notation` CLI で、コンテナイメージなどの OCI アーティファクトに署名し、設定済みの trust store と trust policy に照らして署名を検証する。署名・検証の中核ロジックは依存ライブラリ `notation-go` / `notation-core-go` 側にあり、`notation` はその上のコマンド層だ。

信頼モデルは標準 X.509 PKI に基づく。署名者は鍵と証明書チェーンを持ち、検証者は信頼するルート証明書と、どの ID がどのアーティファクトに署名できるかを定める trust policy を設定する。KMS や HSM にある外部鍵は CLI に組み込むのではなくプラグイン経由で扱う。

決定的な設計判断は、署名を同一リポジトリ内の対象アーティファクトに紐づく OCI Referrer として保存する点だ (`cmd/notation/registry.go:59-93`)。アーティファクトをレジストリ間でコピーしても署名が追随するため、前身の Docker Content Trust が抱えていたレジストリ間ポータビリティの欠如を解消する。

## いつ使うか

- すでに CA や PKI を運用していて、透明性ログではなく既存の X.509 信頼を土台にしたアーティファクト署名が欲しい。
- イメージをレジストリ間でコピーしても残る署名が必要 (署名は OCI Referrer としてアーティファクトと同居する)。
- KMS や HSM の鍵で署名し、署名プラグイン経由で統合したい。
- Docker Content Trust から移行する。Azure Container Registry などが DCT を廃止し、Notary Project 署名を代替として案内している。

向かないのは、短命な ID と公開透明性ログによるキーレス署名が欲しい場合だ。そこは Sigstore/cosign が対象とするモデルになる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [notaryproject/notation README](https://github.com/notaryproject/notation)
2. [Notary Project (CNCF project page)](https://www.cncf.io/projects/notary-project/)
3. [Notary Project FAQ](https://notaryproject.dev/docs/faq/)
4. [trust-store-trust-policy.md (v1.1.0)](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md)
5. [Notary Project announces a major release](https://notaryproject.dev/blog/2023/announcing-major-release/)
6. [Transition from Docker Content Trust to Notary Project (ACR)](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation)
7. [Simplifying Image Signing with Notary Project and Artifact Signing (GA)](https://techcommunity.microsoft.com/blog/appsonazureblog/simplifying-image-signing-with-notary-project-and-artifact-signing-ga/4487942)
8. [AWS Signer container signing workflow](https://docs.aws.amazon.com/signer/latest/developerguide/container-workflow.html)
9. [GHSA-57wx-m636-g3g8 (rollback attack with permissive policy)](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8)
10. [How Docker Image Signing Will Evolve With Notary v2](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)
11. [Notary Project GOVERNANCE](https://github.com/notaryproject/.github/blob/main/GOVERNANCE.md)
12. [notation building.md](https://github.com/notaryproject/notation/blob/main/building.md)
13. [Signing container images: Sigstore, Notary, DCT (Snyk)](https://snyk.io/blog/signing-container-images/)
