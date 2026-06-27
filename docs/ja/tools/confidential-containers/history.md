# 歴史

## 起源

Confidential Containers は 2022 年に、Trusted Execution Environment (TEE) 隔離を Kubernetes ワークロードに持ち込む proof of concept として出発した。初期は containerd の独自ブランチを持っていたが、そのブランチは後に廃止され、ランタイム作業の多くは Kata Containers 本流へアップストリームされた。新しいコンテナランタイムを一から作るのではなく、Kata の軽量 VM を sandbox として再利用し、その上に認証 (attestation) とシークレット配布の層を載せる。この経緯は Red Hat の [What is the Confidential Containers project?](https://www.redhat.com/en/blog/what-confidential-containers-project) に記されている。

プロジェクトは 2022-03-08 に CNCF Sandbox に受理された。[CNCF プロジェクトページ](https://www.cncf.io/projects/confidential-containers/) とオンボーディング issue [cncf/sandbox#216](https://github.com/cncf/sandbox/issues/216) に記録がある。このディープダイブが扱う、サーバ側の認証と key-broker 実装である trustee リポジトリは 2022-04-25 に作成された。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | proof of concept。containerd ブランチは後に廃止、ランタイム作業は Kata Containers へ移行。 |
| 2022 | 2022-03-08 に CNCF Sandbox 受理 ([cncf/sandbox#216](https://github.com/cncf/sandbox/issues/216))。 |
| 2022 | trustee リポジトリ作成 (2022-04-25)。 |
| 2026 | trustee の継続的リリース: v0.18.0 (2026-03-23)、v0.19.0 (2026-04-30)、v0.20.0 (2026-05-19)。 |

## どう進化したか

CoCo は隔離モデルの異なる 2 つのランタイム実装に落ち着いた。既定の `ccruntime` は Kata ベースの VM 隔離を使い、無改変の Pod を confidential VM の中で起動する。もう 1 つの [`enclave-cc`](https://github.com/confidential-containers/enclave-cc) は VM ではなく Intel SGX のプロセス隔離を使う。これは deprecation が検討されている。今や VM パスが主流で、無改変の Pod をエンクレーブ向けに作り直すことなく、そのまま confidential VM に入れられるからである。

攻撃モデルは時とともに研ぎ澄まされ、プロジェクトを定義づける主張になった。クラウド運用者・ホスト OS・ハイパーバイザはすべて信頼境界の外に置かれ、データは使用中に TEE で守られる。guest 側の Attestation Agent が Key Broker Service に対してリモート認証を行い、その認証に合格して初めて復号鍵やシークレットが confidential VM 内へ配布される。このフローは Red Hat の [Understanding the Confidential Containers Attestation Flow](https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow) が解説している。

## 現在地

trustee は定期的なリリースを続けており、直近のタグは 2026 年前半の v0.18.0、v0.19.0、v0.20.0 である。開発は confidential-containers GitHub org 全体に分散し、trustee と guest-components が 2 つの主要な実装リポジトリ、`confidential-containers/confidential-containers` がガバナンス・アーキテクチャ文書・ADOPTERS 一覧のメタリポジトリとして機能する。プロジェクトは CNCF Sandbox のままで、対応する TEE verifier のセットを拡大し続けている。
