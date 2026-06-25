# 採用とエコシステム

## 誰が使っているか

以下の組織はすべて出典付きだ。公開出典のない採用例は省く。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Heroku (Salesforce) | 次世代基盤 "Fir" が CNB を全アプリでデフォルト採用。Heroku は専任メンテナチームに投資。 | [Heroku Fir](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/) |
| DigitalOcean | App Platform は Dockerfile が無いとき CNB でビルドし、言語を検出して buildpack でビルドする。 | [DigitalOcean docs](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/) |
| Greenhouse, Salesforce, VMware | CNCF Incubation 時点の本番ユーザとして明記。 | [CNCF](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/) |

## 採用シグナル

`buildpacks/pack` で GitHub API により 2026-06-24 に計測。

- Stars: 2,939
- Forks: 345
- Open issues: 169
- Contributors: 約 164 (匿名含む)
- リポジトリ作成: 2018-06-25

CNCF Incubation 承認 (2020-11-18) は 15 を超える本番ユーザと複数組織からの committer を挙げている。

## エコシステム

- 参照プロジェクト: `buildpacks/lifecycle` (ビルドエンジン)、`buildpacks/spec` (Buildpack / Platform / Distribution / Image Extension API)、`buildpacks/rfcs` (設計プロセス)。
- buildpack 提供元: Paketo Buildpacks、Heroku CNB、Google Cloud buildpacks。builder / stack は `paketobuildpacks/builder-jammy-base` 等のイメージとして配布される。
- Kubernetes 連携: kpack が CRD で CNB lifecycle を駆動。Tekton 連携 (`buildpacks/tekton-integration`) と GitHub Actions 連携 (`buildpacks/github-actions`) がある。
- プラットフォーム統合: Heroku Fir、DigitalOcean App Platform、Google Cloud。

## 代替

| 代替 | 本質的な差 |
| --- | --- |
| Dockerfile + BuildKit | 最も汎用だが、ベースイメージのパッチ・レイヤ最適化・SBOM を自前で書く。CNB は buildpack が検出と依存解決を担い、rebase で Dockerfile なしにベースを差し替えられる。 |
| Google Jib | JVM 専用で Docker デーモン不要。CNB は共有 builder / stack 契約で多言語を扱う。 |
| ko | Go 専用で非常に高速。CNB は言語非依存。 |
| kaniko | Dockerfile をクラスタ内でデーモンレスにビルド。CNB は Dockerfile を書かない。image extension が内部で kaniko を使うのは別話。 |
| OpenShift Source-to-Image | 思想は近いが Red Hat / OpenShift 寄り。CNB は OCI 標準・rebase・分散 buildpack エコシステムの面で広い。 |
| nixpacks (Railway) | 自動検出の UX は近いが Nix ベースで CNB 仕様ではない。 |

核心の差は、ベンダ中立な platform-to-buildpack 契約と OCI レイヤ rebase だ。OS パッチは run イメージを rebase するだけで全アプリに反映でき、単一 builder で Dockerfile を書かずに多言語を扱える。

## 出典

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
3. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
4. [App Platform Buildpack References (DigitalOcean)](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/)
5. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
6. [buildpacks/pack リポジトリ](https://github.com/buildpacks/pack)
