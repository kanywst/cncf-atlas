# 採用事例・エコシステム

## 誰が使っているか

旗艦となる本番デプロイは Datadog で、USENIX Security 2019 論文に記録されている。以下の残りの採用組織と連携先は、プロジェクト自身の [in-toto/friends](https://github.com/in-toto/friends) レジストリに記載されたものである。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Datadog | agent とその integration の CI/CD を保護。tag step はハードウェアドングルで署名、CI はオンライン鍵、配布は TUF と併用 | [USENIX 2019](https://www.usenix.org/system/files/sec19-torres-arias.pdf) |
| Debian / Reproducible Builds | `rebuilderd` が再現ビルド結果を in-toto link として記録、`apt-transport-in-toto` が導入時に k-of-n rebuilder メタデータを検証 | [reproducible-builds.org](https://reproducible-builds.org/tools/), [in-toto/friends](https://github.com/in-toto/friends) |
| Sigstore / cosign | keyless 署名で in-toto メタデータに署名。cosign の SLSA プロベナンス生成で使用 | [in-toto/friends](https://github.com/in-toto/friends) |
| Tekton Chains | TaskRun を観測して in-toto attestation を生成 | [in-toto/friends](https://github.com/in-toto/friends) |
| GitHub | artifact attestations が SLSA build provenance と SBOM を in-toto predicate type として扱う | [in-toto/friends](https://github.com/in-toto/friends) |
| GUAC / Grafeas | GUAC は SLSA/in-toto attestation を取り込み、Grafeas は in-toto link メタデータをサポート | [in-toto/friends](https://github.com/in-toto/friends) |
| Lockheed Martin | friends レジストリに採用組織として記載 | [in-toto/friends](https://github.com/in-toto/friends) |

## 採用のシグナル

Python リファレンスリポジトリ (in-toto/in-toto) について、GitHub API は stars 1,009・forks 155・watchers 35 を返し、リポジトリ作成日は 2016-05-24 だった (観測 2026-06-22、[GitHub API](https://api.github.com/repos/in-toto/in-toto))。これらの数字は Python 実装のみを表す。仕様・attestation フレームワーク・Go/Java/Rust 移植を含むエコシステム全体はこれより広い。in-toto は 2025 年に CNCF Graduated に到達した。これは本番採用の実績が示されたプロジェクトに与えられる成熟度である ([CNCF 発表](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/))。

## エコシステム

in-toto の attestation フレームワーク (ITE-6) は、他のサプライチェーンツールが中身を埋める statement/subject/predicate エンベロープを定義する。SLSA Provenance はこのエンベロープ上の predicate type として表現される ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq))。Sigstore は in-toto メタデータの keyless 署名を提供し、Tekton Chains や GitHub artifact attestations が生成し、GUAC や Grafeas が消費・集約する ([in-toto/friends](https://github.com/in-toto/friends))。

## 代替候補

これらは直接の競合というより層の違いである。in-toto はフォーマットと検証モデル、SLSA はその上の要求仕様、Sigstore は署名と透明性を解く。典型的なパイプラインは 3 つすべてを組み合わせる。

| 代替 | 違い |
| --- | --- |
| SLSA | ツールではなく要求仕様。プロベナンスの運搬手段として in-toto attestation を使い、L2/L3 で署名済みプロベナンスを要求する ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)) |
| Sigstore | 短命の OIDC 証明書と Rekor 透明性ログで鍵管理を解く。in-toto を置き換えるのではなく署名層を埋める ([AquilaX](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa)) |
| TUF | 配布チャネルの侵害耐性を担う。相補的で、Datadog は両方を使う ([USENIX 2019](https://www.usenix.org/system/files/sec19-torres-arias.pdf)) |
| Grafeas / GUAC | それぞれメタデータ API と attestation 集約。チェーン・オブ・カストディの証明を生成するのではなく in-toto データを消費する ([in-toto/friends](https://github.com/in-toto/friends)) |
