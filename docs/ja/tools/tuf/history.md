# 歴史

## 起源

TUF の基礎技術は 2009 年に University of Washington で Justin Samuel と Justin Cappos が開発した。Tor の Thandy アップデータを改良する作業から派生し、最初の学術論文は Tor の Nick Mathewson と Roger Dingledine との共著だった。課題は具体的だった。ソフトウェア更新システムは、更新を配るサーバや鍵の 1 つが侵害された後でもクライアントを守らなければならない。単純な署名ではそれを乗り切れないため、TUF はロール分離・しきい値署名・鮮度を持つメタデータを導入した。

2011 年に Cappos は NYU (当時 NYU Polytechnic、後の NYU Tandon) に移り、Secure Systems Lab で開発を継続した。Trishank Karthik Kuppusamy, Vladimir Diaz, Sebastien Awwad, Lukas Puehringer らが関与した。開発は NSF と DHS の公的資金で支えられた。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2009 | University of Washington で TUF 設計、Tor の Thandy アップデータから派生 |
| 2011 | 開発が NYU Secure Systems Lab に移る |
| 2014 | Flynn が最初に TUF を採用 (独自の Go 実装) |
| 2015 | Docker が TUF をベースに Notary を公開 |
| 2016 | NYU・UMTRI・SWRI が車載 OTA 向けの TUF 拡張 Uptane を開始 |
| 2017 | TUF が CNCF に Incubating で受理 (2017-10-24) |
| 2019 | TUF が CNCF で Graduated に昇格 (2019-12-18) |
| 2026 | python-tuf v7.0.0 リリース (2026-05-18) |

## どう進化したか

リファレンス実装は安定したモダン API を中心に作り直された。python-tuf 1.0.0 で Metadata API (`tuf.api`) と新クライアント (`tuf.ngclient`) が安定化し、古いクライアントを置き換え、型付きでロールを意識したメタデータオブジェクト群を呼び出し側に提供した。PyPI ダウンロードを守る PEP 458 の取り組みは、まず python-tuf 1.0.0 上に構築され、後に 2.0.0 へ更新され、TAP 15 (succinct hash bin delegation) を使って委譲ターゲットメタデータの量を抑えた。

CNCF での卒業は財団にとっていくつもの「初」を意味した。9 番目の卒業プロジェクトであり、(動くソフトウェアではなく) 最初の仕様であり、最初のセキュリティ特化プロジェクトであり、学術研究発として初の卒業だった。

## 現在地

python-tuf は他言語の移植が基準とするリファレンス実装。pin したコミットでは develop ブランチを追っており、最新リリースは v7.0.0 (`__version__ = "7.0.0"`, [`tuf/__init__.py:7`](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/__init__.py#L7))。プロジェクトは CNCF の TUF コミュニティの下で維持され、TUF Augmentation Proposals (TAP) を通じて仕様を進化させ続けている。
