# Confidential Containers

> Confidential Containers は無改変の Kubernetes Pod をハードウェア隔離された confidential virtual machine の中で動かし、リモート認証に合格したワークロードにだけシークレットを渡す。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox
- **言語**: Rust
- **ライセンス**: Apache-2.0
- **リポジトリ**: [confidential-containers/trustee](https://github.com/confidential-containers/trustee)
- **ドキュメント基準コミット**: `af53e98` (2026-06-26、タグ v0.20.0 付近)

## 何をするものか

Confidential Containers (CoCo) は CNCF Sandbox プロジェクトで、Kubernetes ワークロードを Trusted Execution Environment (TEE、ホスト OS やハイパーバイザから読めないハードウェア隔離されたメモリ領域) の中で動かす。狙いはデータを使用中 (in-use) に守ることで、インフラを運用するクラウド事業者がテナントのコンテナやそのデータを覗けないようにする。

プロジェクトは GitHub org [confidential-containers](https://github.com/confidential-containers) の複数リポジトリに分散している。ランタイム側は Kata Containers を再利用し、各 Pod を軽量な confidential virtual machine (CVM) として起動する。このディープダイブが扱うのは **trustee**、すなわち認証 (attestation) とシークレット配布のサーバ側実装である。trustee は、どのワークロードが本物の TEE で、どのシークレットを受け取ってよいかを決める CoCo の信頼モデルの中核を担う。

trustee は Rust の Cargo workspace として書かれている。中核は Key Broker Service (KBS) で、Request-Challenge-Attestation-Response (RCAR) ハンドシェイクを処理し、Attestation Service (AS) を通じてハードウェア evidence を検証し、すべてのシークレットを Rego ポリシーのゲートの背後に置く HTTP サーバである。ワークロードの guest agent が KBS に接続し、本物の TEE で動いていることを証明して初めて、復号鍵やその他のシークレットを受け取る。シークレットはその特定の CVM だけが読めるように暗号化される。

## いつ使うか

- 完全には信頼できないインフラ (パブリッククラウド、共有ベアメタル) でテナントのワークロードを動かし、クラウド運用者を信頼境界の外に置きたいとき。
- ワークロードが本物の TEE で動いていることをハードウェア裏付けの evidence で証明したときにだけ、鍵・モデル重み・その他のシークレットを渡したいとき。
- 複数の TEE 種別 (Intel TDX、AMD SEV-SNP、Intel SGX、IBM Secure Execution、Arm CCA、NVIDIA GPU) を、ベンダごとの個別統合ではなく 1 つの認証・鍵配布フローでまとめたいとき。
- ホストとハイパーバイザを既に信頼している脅威モデルでは向かない。confidential VM と認証のオーバーヘッドが何の得にもならない。
- TEE 対応ハードウェアで動かせない場合も向かない。認証は署名されたハードウェア quote に依存するため。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. trustee リポジトリ: <https://github.com/confidential-containers/trustee>
2. confidential-containers org: <https://github.com/confidential-containers>
3. ADOPTERS.md: <https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md>
4. CNCF プロジェクトページ: <https://www.cncf.io/projects/confidential-containers/>
5. cncf/sandbox オンボーディング issue #216: <https://github.com/cncf/sandbox/issues/216>
6. Red Hat, "What is the Confidential Containers project?": <https://www.redhat.com/en/blog/what-confidential-containers-project>
7. Red Hat, "Understanding the Confidential Containers Attestation Flow": <https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow>
8. RATS architecture draft: <https://www.ietf.org/archive/id/draft-ietf-rats-architecture-22.html>
9. プロジェクト Web サイト: <https://confidentialcontainers.org/>
10. guest-components リポジトリ: <https://github.com/confidential-containers/guest-components>
