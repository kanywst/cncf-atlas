# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` ファイルはない。以下の本番ユーザは CNCF のエンドユーザケーススタディに基づく。入手できる最も確かな引用可能な証拠だ。いずれも Kubernetes 上で GPU ワークロードを動かす中国の大企業である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| SF Technology (順豊科技) | Kubernetes 上の AI ワークロードの GPU 共有 | [CNCF ケーススタディ](https://www.cncf.io/case-studies/sf-technology/) |
| KE Holdings Inc. (貝殻找房) | Kubernetes 上の AI ワークロードの GPU 共有 | [CNCF ケーススタディ](https://www.cncf.io/case-studies/ke-holdings-inc/) |
| NIO (蔚来) | Kubernetes 上の AI ワークロードの GPU 共有 | [CNCF ケーススタディ](https://www.cncf.io/case-studies/nio/) |

形式的な採用企業サーベイは限定的なため、このリストは完全な採用企業数ではなく、出典付きで名前を挙げられる範囲 (上記の CNCF エンドユーザ事例) だ。

## 採用のシグナル

2026-07-08 時点で、GitHub リポジトリはスター 3,720、fork 611、コントリビュータ 129 である (GitHub API)。リリースラインは活発で、`v2.9.0` が 2026-05-19 に切られた。HAMi は 2026-07-02 に CNCF Incubating に到達した。この昇格には、本番利用の証拠と健全なコントリビュータ基盤を TOC が確認することが要る (CNCF プロジェクトページ、Dynamia AI ブログ)。README には OpenSSF Best Practices バッジと `projecthami/hami` の Docker Hub pull バッジもある。測定可能なシグナルは、実際の広がりと単一企業を超えたコントリビュータ基盤を示しており、それが Incubating 昇格に表れている。

## エコシステム

HAMi は単体で立つのではなく、既存のスケジューラに差し込むよう設計されている。Volcano は自身の NVIDIA vGPU device plugin に HAMi-core ベースの隔離を使っており、バッチ AI では定番の組み合わせだ (HAMi ドキュメント)。Koordinator は HAMi の上に構築した end-to-end の GPU 共有構成を文書化している (Koordinator ドキュメント)。隔離ライブラリ HAMi-core 自体も再利用可能な部品だ。別リポジトリであり、コンテナ内強制の部分として他のスケジューラが取り込む。ハードウェア側では、`pkg/device` ツリーが NVIDIA に加えて Ascend・Cambricon・Hygon・Metax・Mthreads・Iluvatar などをカバーするため、エコシステムの話は周辺スケジューラと同じくらいアクセラレータベンダの話でもある。

## 代替候補

HAMi の立ち位置は、Pod ごとのメモリ・演算制限付きのソフト GPU 共有、アプリ改変なし、MB 単位の任意粒度、そして多数のベンダにまたがる単一モデルである。代替は各々がその範囲の一部を、別のトレードオフでカバーする。

| 代替 | 違い |
| --- | --- |
| NVIDIA GPU Operator の time-slicing | GPU を N 個の複製リソースとして kubelet に見せるだけで、メモリ・演算の隔離がなく、Pod が互いのメモリを読める。HAMi は HAMi-core で Pod ごとの上限を強制する |
| NVIDIA MIG | 強い隔離のハードウェア分割だが、特定カード (A100/H100 系) 限定で粒度が固定プロファイル。HAMi は MB 単位の任意ソフト分割を行い、MIG も駆動できる |
| NVIDIA MPS | SM 演算は共有できるがメモリ隔離が弱く、耐障害境界が緩い。HAMi は device plugin 経由で MPS を選べ、独自のメモリ制限を加える |
| run:ai などの商用 GPU オーケストレータ | 同種の部分共有とスケジューリングを商用製品として提供する。HAMi は CNCF の OSS で複数アクセラレータベンダにまたがる |
