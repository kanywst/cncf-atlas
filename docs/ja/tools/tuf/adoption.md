# 採用事例・エコシステム

## 誰が使っているか

以下は python-tuf を TUF クライアント/リポジトリエンジンとして具体的に使い、出典を示せる事例。仕様としての TUF はより広く本番採用されている (Notary、車載の Uptane ほか) が、それらは別実装で動いていることが多いため、ここでは対象外とする。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| PyPI / Warehouse | PEP 458 が署名済みリポジトリメタデータで PyPI ダウンロードを守る。実装は python-tuf に依存し、TAP 15 succinct hash bin delegation を使う | [PEP 458](https://peps.python.org/pep-0458/), [VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/) |
| Sigstore (sigstore-python) | Sigstore の信頼ルート (`trusted_root.json`) を TUF で配布。sigstore-python は python-tuf をクライアントエンジンに使い、埋め込み root をアンカーにする | [Sigstore blog](https://blog.sigstore.dev/sigstore-bring-your-own-stuf-with-tuf-40febfd2badd/), [sigstore-python releases](https://github.com/sigstore/sigstore-python/releases) |
| RSTUF (Repository Service for TUF) | PEP 458 設計を一般リポジトリ向けにサービス化。python-tuf 上に構築され、OpenSSF sandbox に受理 | [VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/) |

## 採用のシグナル

python-tuf は TUF 仕様が参照するリファレンス実装であり、その仕様が他言語移植の基礎になる。PyPI で公開され、`pip install tuf` で導入する ([tuf on PyPI](https://pypi.org/project/tuf/))。pin したコミットでの最新リリースは v7.0.0 (2026-05-18)。TUF は 2019-12-18 に CNCF で卒業し、9 番目の卒業プロジェクトかつ最初の仕様、最初のセキュリティ特化、学術研究発として初だった ([CNCF プロジェクトページ](https://www.cncf.io/projects/the-update-framework-tuf/), [PRNewswire](https://www.prnewswire.com/news-releases/cloud-native-computing-foundation-announces-tuf-graduation-300976974.html))。

## エコシステム

- RSTUF は python-tuf のリポジトリヘルパの上にリポジトリ as a service を構築する。
- 同じ仕様の他言語実装: go-tuf (Go、Notary や Sigstore 周辺で使用)、rust-tuf (Rust)、tuf-js / @sigstore/tuf (JavaScript)、RubyGems 向けの Ruby 移植。
- 派生仕様: Uptane (車載 OTA、TUF 拡張)、TUF Augmentation Proposals (TAP, 例 TAP 15 succinct hash bin delegation)。
- 隣接の supply-chain プロジェクト: in-toto (ビルド来歴。同じ Secure Systems Lab 発で TUF と補完関係)、Sigstore (署名・透明性ログ。信頼ルート配布に TUF を使う)、Notary v2 / Notation。

## 代替候補

| 代替 | 違い |
| --- | --- |
| go-tuf | 同じ TUF 仕様の Go 実装。周辺スタックが Go のとき向く (Notary、Sigstore の一部) |
| tuf-js / @sigstore/tuf | Node やブラウザ隣接ツールチェーン向けの JavaScript/TypeScript TUF クライアント |
| デタッチ署名 (GPG, minisign) | 1 アーティファクトを 1 鍵で検証するだけ。ロール分離・しきい値署名・鮮度・rollback 保護はない |
| in-toto | 配布・更新チャネルを守るのではなく、アーティファクトがどう作られたか (供給網の来歴) を証明する。TUF と補完的 |

python-tuf と他移植のどちらを選ぶかは、通常は周辺ツールチェーンの言語で決まる。すべての移植が同じ仕様を実装しているからだ。
