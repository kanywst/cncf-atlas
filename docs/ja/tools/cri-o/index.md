# CRI-O

> Kubernetes の Container Runtime Interface を実装した軽量コンテナランタイム。kubelet が runc や crun などの OCI ランタイムを通して Pod を動かせるようにする。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cri-o/cri-o](https://github.com/cri-o/cri-o)
- **ドキュメント基準コミット**: `68f2617` (2026-06-22, `main`, バージョン行 1.37.0)

## 何をするものか

CRI-O は Kubernetes の Container Runtime Interface (CRI) を一点突破で実装したもの。kubelet が gRPC で CRI を話すと、CRI-O はその呼び出しを OCI ランタイム・イメージストア・ネットワークプラグインへの操作に翻訳する。吐くバイナリは `crio` の 1 本だけで、デーモンとして動く。エンドユーザ向けの汎用 CLI は持たない (`README.md:102-107`)。

CRI-O は他のランタイムが抱え込もうとする部分を委譲する。コンテナ実行は [runc](https://github.com/opencontainers/runc) や crun などの OCI ランタイムへ、イメージは containers/image へ、ストレージは containers/storage へ、ネットワークは CNI へ渡す (`README.md:113-119`)。CRI-O 自身は kubelet とそれらの接着剤に徹する。

利用者は kubelet ただ一つに絞り、Kubernetes とバージョンを揃える。CRI-O の `1.x` リリースは Kubernetes の `1.x` に対応する。pinned コミットはバージョン `1.37.0` を報告し (`internal/version/version.go:6`)、リリース済みの `v1.36.1` より上の開発線上にある。

## いつ使うか

- Kubernetes を動かしており、ランタイムをその用途ちょうどに絞りたい。守る面も運用する面も増やしたくない。
- ランタイムのバージョンを Kubernetes のマイナーバージョンに固定したい。
- ワークロードごとに分離方式を切り替えたい。通常の Pod は runc/crun、VM 分離が要る Pod は Kata Containers を runtime handler で選ぶ。
- ローカルビルド用の単体コンテナエンジンや非 Kubernetes ホストが必要なら向かない。CRI-O はユーザ CLI もイメージビルダーも持たず、それは設計上スコープ外 (`README.md:102-107`)。

## このディープダイブの構成

- [歴史](./history): OCID としての起源、CNCF incubation から graduation までの道のり。
- [アーキテクチャ](./architecture): デーモン、OCI 抽象、Pod 作成の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、代替に何があるか。
- [内部実装](./internals): 中核となる型と RunPodSandbox パスをソースから読む。
- [はじめに](./getting-started): インストールと最小の動く構成。

## 出典

1. [cri-o/cri-o (GitHub)](https://github.com/cri-o/cri-o)
2. [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md)
3. [install.md](https://github.com/cri-o/cri-o/blob/main/install.md)
4. [CNCF Announces Graduation of CRI-O (2023-07-19)](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)
5. [CNCF to host CRI-O (2019-04-08)](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)
6. [Red Hat contributes CRI-O to the CNCF](https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation)
7. [InfoQ: CRI-O Graduates from CNCF (2023-09)](https://www.infoq.com/news/2023/09/cncf-crio-graduation/)
8. [CRI-O on CNCF projects](https://www.cncf.io/projects/cri-o/)
9. [OpenShift Container Platform 4 defaults to CRI-O](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine)
10. [Oracle Linux Cloud Native Environment: CRI-O](https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html)
11. [containerd](https://github.com/containerd/containerd)
12. [opencontainers/runc](https://github.com/opencontainers/runc)
