# 採用事例・エコシステム

## 誰が使っているか

CoHDI は若い CNCF Sandbox プロジェクトなので、採用の多くは独立した本番ユーザというより、それを作っているベンダーだ。以下の組織はプロジェクトの [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) に記載されたもの (2026-06-27 観測)。ここではそれ以外の採用者を主張しない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| IBM Research (2024 年以降) | CoHDI 以前に Composable Resource Operator を開発。プロジェクトの一部として継続している。 | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| Fujitsu / Fsas Technologies Inc. (2025 年以降) | サーバ・ストレージベンダーで、CDI 対応サーバシステムと並行して CoHDI を開発。 | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| NEC (2025 年以降) | CDIM (Composable Disaggregated Infrastructure Manager) を開発し、CoHDI と協業。 | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |
| NTT (2022 年以降) | ICT インフラ事業者。CoHDI を IOWN Data-Centric Infrastructure に統合する計画。 | [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) |

同じ ADOPTERS ファイルは、ワーカーノード上での動的なデバイススケーリングの解として CoHDI を「含める予定」と述べる 2 つのディストリビューションにも触れている。Red Hat OpenShift と SUSE Rancher だ。いずれも計画段階であり、出荷済みではない。

## 採用のシグナル

2026-06-27 に GitHub API から測定:

- `composable-resource-operator`: 23 stars、8 forks、10 contributors、約 58 commits。3 リポジトリの中で最も活発。
- `composable-dra-driver`: 6 stars。
- `dynamic-device-scaler`: 6 stars。

プロジェクトは OpenSSF Best Practices バッジ (project 12016) と OpenSSF Scorecard を持ち、どちらも README からリンクされている。CNCF は 2025-12-19 に Sandbox 成熟度で受理した ([CNCF project page](https://www.cncf.io/projects/cohdi/))。数字は小さい。CoHDI は新興であり、まだ広く展開されてはいないと捉えるべきだ。

## エコシステム

CoHDI は Kubernetes のデバイス管理スタックの内側にあり、いくつかの隣接プロジェクトに依存する:

- Kubernetes DRA とスケジューリング SIG、加えてデバイスが attach されるまでスケジューラが Pod を保留できるようにする上流の [KEP-5007](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled)。
- NVIDIA GPU Operator と NVIDIA DRA driver。operator は `go.mod` で `github.com/NVIDIA/gpu-operator` に依存し、attach 後に GPU スタックの DaemonSet を名前指定で再起動する。
- Metal3 BareMetalHost、cluster-api-provider-metal3、OpenShift Machine API。ノードを machine UUID に解決するのに使う (`internal/cdi/fti/fm/client.go:416`)。
- CDI プロバイダバックエンド: Fujitsu FTI_CDI (Composition Manager と Fabric Manager)、SNIA Sunfish、NEC。
- 残る 2 つの CoHDI コンポーネント `composable-dra-driver` と `dynamic-device-scaler`、そして fabric 側の CDI プラットフォームとしての NEC の project-cdim。

## 代替候補

誠実に言えば、代替の多くは別の層で動く。CoHDI はノードが持つ物理ハードウェアそのものを変える。他はすでにそこにあるハードウェアを管理する。

| 代替 | 違い |
| --- | --- |
| 素の Kubernetes DRA | デバイスを予約・割り当てるが、ノードに配線されるハードウェアの構成は起動時に固定。CoHDI は PCIe と CXL fabric を操作し、その構成を実行時に変える。 |
| NVIDIA GPU Operator | 静的に存在する GPU のドライバ・device-plugin・DCGM ライフサイクルを管理する。CoHDI はその前段で GPU を attach し、クラスタに認識させるため GPU Operator スタックを再起動する。競合ではなく補完。 |
| Project CDIM | fabric 側で CoHDI の下にある CDI 管理プラットフォームそのもの。CoHDI は CDI システムを呼び出す。NEC は CDIM をライバルではなく協業先として挙げる。 |
| Cluster Autoscaler やノードオートスケーラ | ノードごと増減させる。CoHDI はノード数を固定したまま、既存ノードにデバイスを足す。 |
