# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) (2026-06-27 参照) に記載されている。出典を示せる採用組織だけを載せている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud | Elastic Algorithm Service / Elastic GPU Service。ユーザデータと AI モデルをクラウド事業者から保護 | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Red Hat | OpenShift sandboxed containers。Intel TDX / AMD SEV-SNP / IBM Z | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| IBM | LinuxONE + OpenShift。Secure Execution for Linux と統合 | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Edgeless Systems | Contrast。Kubernetes 上で confidential 配備を運用 | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| ByteDance | CoCo を使う Jeddak Sandbox | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Intel | Enterprise-RAG / OPEA を Intel TDX 上で運用 | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| JDCloud | JoyScale | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| NanhuLab | Trusted Big Data Sharing | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Switchboard | AMD SEV-SNP ベアメタル上の分散オラクル | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| Kubermatic | ベアメタル上の KubeOne | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |
| KubeArmor | CoCo との相互運用 | [ADOPTERS.md](https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub API による数値 (2026-06-27 観測):

- trustee: star 165、fork 158、contributor 約 60。
- guest-components: star 125、contributor 約 78。
- confidential-containers メタリポジトリ: star 364。

trustee は定期的にリリースしており、直近のタグは v0.18.0 (2026-03-23)、v0.19.0 (2026-04-30)、v0.20.0 (2026-05-19)。CNCF プロジェクトページと Red Hat のブログによれば、協賛ベンダには Alibaba Cloud、AMD、Arm、IBM、Intel、Microsoft、Red Hat、Rivos が含まれる。

## エコシステム

CoCo は再発明せず再利用する。VM sandbox には Kata Containers、コンテナ層には containerd、暗号化イメージには ocicrypt-rs、ポリシーには Rego (regorus エンジン経由) を使う。CNCF 内では Kata Containers (CoCo が載る sandbox runtime) と、ワークロード identity のための SPIFFE/SPIRE が最も近い隣接プロジェクトである。ただし SPIRE が発行するのはソフトウェア identity で、ハードウェア裏付けの TEE 認証ではない。CoCo の guest 側 (Attestation Agent、Confidential Data Hub、image-rs) は [guest-components](https://github.com/confidential-containers/guest-components) リポジトリにあり、trustee の counterpart である。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Edgeless Systems Constellation / Contrast | confidential Kubernetes をプロダクト化。Contrast 自体は CoCo の adopter でもあり純粋な競合ではない。 |
| Enarx / Veracruz | WebAssembly を TEE で動かす。単位は無改変コンテナでなく Wasm runtime。 |
| Gramine / Occlum / SCONE | 単一プロセスを Intel SGX に入れる LibOS 系。CoCo の `enclave-cc` がこの領域に近いが、本流の CoCo は VM ベース。 |
| Azure Confidential Containers / Google Confidential GKE Nodes | クラウドマネージドでベンダ固有。CoCo はベンダ非依存の OSS で、複数 TEE を 1 つの認証・KBS フローで束ねる。 |

本質的な差は、CoCo が無改変の Pod を Kubernetes に載せたまま、リモート認証に合格した confidential VM にだけ鍵やシークレットを配ることにある。加えて Intel TDX、AMD SEV-SNP、Intel SGX、IBM Secure Execution、Arm CCA、NVIDIA GPU を単一の `Verifier` 抽象の背後で束ねる。
