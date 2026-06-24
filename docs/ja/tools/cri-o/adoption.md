# 採用事例・エコシステム

## 誰が使っているか

下記の組織はプロジェクトの [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) に記載されている。うち外部裏付けがある 2 つは、その出典も併記する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Red Hat | OpenShift Container Platform 4 は CRI-O を唯一サポートする CRI 実装として出荷 | [Red Hat blog](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine) |
| Oracle | Linux Cloud Native Environment と Kubernetes Engine。runc と Kata の両方を扱える点を評価 | [Oracle docs](https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html) |
| SUSE | CaaS Platform v4 の既定ランタイム。openSUSE Kubic でも採用 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Lyft | 2017 から本番利用 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Reddit, Adobe | 本番採用として記載 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Nestybox | Sysbox に同梱して配布 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |
| Digital Science, HERE Technologies, Particule, PITS Global Data Recovery Services | 採用として記載 | [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) |

## 採用のシグナル

[cri-o/cri-o](https://github.com/cri-o/cri-o) の GitHub API を 2026-06-22 に観測: スター 5,628、フォーク 1,179、watcher 119、open issue 133、API で列挙したコントリビュータ約 326。当時の最新リリースは `v1.36.1` (2026-06-03)。リリースは Kubernetes のマイナーサイクルに従い、直近の `1.36`・`1.35`・`1.34` の各線を並行して維持する。

最も強い採用シグナルは構造的なものだ。OpenShift 4 は CRI-O を唯一サポートする CRI 実装として動かす ([Red Hat blog](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine))。つまり全ての OpenShift 4 クラスタの下に CRI-O が入る。

## エコシステム

CRI-O は共有のコンテナコンポーネントから組み上げられており、それらを再実装しない。実行を runc/crun に、監視を conmon/conmonrs に、イメージを containers/image に、ストレージを containers/storage に委譲する。これは Podman や Buildah が使うのと同じスタックだ (`README.md:113-119`)。ネットワークは任意の CNI プラグイン。VM 分離ワークロードは Kata Containers を runtime handler で Pod ごとに選んで動かす。Node Resource Interface のプラグイン面は `internal/nri/` にある。

## 代替候補

dockershim パスは Kubernetes 1.24 で kubelet から除去され、CRI ランタイムの現実的な選択肢は CRI-O と containerd になった。CRI-O は、Kubernetes を動かしておりランタイムをその用途ちょうどに絞りたいとき、そして Kubernetes のマイナーバージョンに追従させたいときに正解になる。containerd は Kubernetes 外でも使える汎用ランタイムや、より豊富なプラグイン・snapshotter モデルが要るときに合う。

| 代替 | 違い |
| --- | --- |
| [containerd](https://github.com/containerd/containerd) | CNCF Graduated で汎用。Docker と Kubernetes 両方に対応し plugin/snapshotter 設計を持つ。CRI-O は Kubernetes 専用でバージョンを揃える |
| [runc](https://github.com/opencontainers/runc) | CRI ランタイムではなく OCI ランタイム。CRI-O が conmon 経由で駆動する対象であって、CRI-O の代わりではない |
