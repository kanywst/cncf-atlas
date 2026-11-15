# 採用事例・エコシステム

## 誰が使っているか

基準コミットの Meshery の `ADOPTERS.md` には 18 の組織が載っている。各項目は社名とリンクだけで、Meshery をどう使っているかの記述はない。そのため下の表の用途の列はすべて「記載なし」である。

| 組織 | 用途 | 出典 |
| --- | --- | --- |
| Asteria Aerospace | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| AYA Innovation Labs | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| BootLabs | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| DigitalOcean | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Ericsson | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| F5 | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| HPE Labs (Cloudless) | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| HPE Security Engineering | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Infor | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Intel | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Intraserve Systems | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Metabit Trading | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Metabob | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| OD10 Ventures | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| PITS Global Data Recovery Services | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Red Hat | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| SolarWinds | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| TCS Labs | 記載なし | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |

CNCF の Incubating 発表は、航空宇宙、通信、ネットワーク、エンタープライズソフトウェアの組織が Meshery を使っていると書くが、社名は挙げていない ([CNCF ブログ](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/))。2025 年 1 月の Incubation レビューでは、TOC のレビュアが adopter のインタビュー用の提出がまだであることを指摘している ([cncf/toc#1386](https://github.com/cncf/toc/issues/1386))。これらの組織が Meshery をどう運用しているかの公開資料は少ない。

v1.0 の発表は個人の発言を引用している (たとえば Stripe のテックリード) が、その勤務先が Meshery を使っているとは書いていないので、ここには載せない ([Meshery ブログ](https://meshery.io/blog/meshery-v1.0-general-availability/))。

## 採用のシグナル

- **GitHub**: 2026-11-15 時点で star 12,203、fork 4,187 ([GitHub API](https://api.github.com/repos/meshery/meshery))。CNCF の発表はもっと大きい数字 (star は「ほぼ 15,000」、fork は「6,800 以上」) を挙げているが、同日の API の値とは合わない。
- **コントリビュータと速度**: CNCF は 1,000 ほどの組織から 7,000 人を超えるコントリビュータがいると数え、2025 年 7 月から 2026 年 7 月の velocity で Meshery を CNCF のおよそ 250 プロジェクト中 5 位とし、その 1 年でコミットが 350% 増えたとしている ([CNCF ブログ](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/))。最新の数字は [DevStats](https://meshery.devstats.cncf.io/) にある。
- **リリース**: `v0.0.1` (2019 年) から `v1.0.79` (2026-11-13) まで 800 を超える GitHub リリースがあり、常に更新される下書きから手で公開されている ([リリース](https://github.com/meshery/meshery/releases))。
- **メンテナ**: コアメンテナの一覧には Layer5、Moneris、Intuit、USyd、OD10 の所属と、無所属の人が並ぶ ([MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md))。

## エコシステム

- **meshery/meshkit、meshery/meshsync、meshery/schemas**: 共通の Go ライブラリ、発見処理のコンポーネント、そしてサーバと UI の両方の Go 型と TypeScript 型を生成する OpenAPI スキーマ。サーバは `meshkit v1.0.29`、`meshsync v1.0.3`、`schemas v1.3.116` を固定している (基準コミットの `go.mod`、[AGENTS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/AGENTS.md))。
- **meshery-extensions**: 2 つ目の GitHub organization で、コミュニティの統合、adapter、ツールを置く ([Meshery ブログ](https://meshery.io/blog/meshery-v1.0-general-availability/))。
- **Kanvas**: Meshery の extension として提供されるビジュアルデザイナ。Kanvas Designer は v1.0 で一般提供が発表された ([Meshery ブログ](https://meshery.io/blog/meshery-v1.0-general-availability/))。
- **Service Mesh Performance (SMP)**: Layer5 が Meshery とともに CNCF に寄贈したベンチマーク仕様 ([Layer5 ニュース](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/))。Meshery の負荷試験は fortio で動く (`server/handlers/load_test_handler.go:138-139`)。
- **model の出どころ**: 同梱 model の多くは Artifact Hub に載っている Helm chart から生成されている。たとえば Istio の model は registrant として Artifact Hub を記録している (`models/istio-base/1.16.0/v1.0.0/components/VirtualService.json`)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| [Argo CD](https://argo-cd.readthedocs.io/) / [Flux](https://fluxcd.io/) | Git が真実の源で、クラスタ内のコントローラが pull して継続的に reconcile する。Meshery Server は要求ごとに design を 1 回 push する。 |
| [Crossplane](https://www.crossplane.io/) | 独自のリソース型で Kubernetes API を拡張し、クラスタの内側から reconcile する。Meshery は Kubernetes API の外部クライアントである。 |
| [Headlamp](https://headlamp.dev/) / [Kubernetes Dashboard](https://github.com/kubernetes/dashboard) | 稼働中のクラスタオブジェクトを閲覧・編集する。Meshery はそれに加えて design、関係性の評価、マルチクラスタ配備、リソース種別のレジストリを持つ。 |
| [Kiali](https://kiali.io/) | Istio 専用の可観測性コンソール。Meshery もメッシュ管理から始まったが、メッシュを問わず、ほかのインフラも扱う。 |

複数クラスタにまたがってインフラを設計、レビュー、配備し、そこに何があるかの一覧も持ちたいなら Meshery を選ぶ。監査証跡としての Git の履歴と自動の drift 修正が必要なら GitOps ツールを選ぶ。
