# The Update Framework (TUF)

> ソフトウェア更新システムを保護し、リポジトリや署名鍵が侵害されても悪意ある更新をクライアントに送り込めないようにするフレームワーク。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Graduated
- **言語**: Python (>=3.10)
- **ライセンス**: Apache-2.0 OR MIT (デュアル)
- **リポジトリ**: [theupdateframework/python-tuf](https://github.com/theupdateframework/python-tuf)
- **ドキュメント基準コミット**: `9a3c304` (タグ v7.0.0 近傍, 2026-05-18)

## 何をするものか

TUF は侵害耐性 (compromise-resilience) を持つソフトウェア更新の仕様であり、python-tuf はそのリファレンス実装。対処する脅威は「このファイルが壊れていないか」ではなく「攻撃者がリポジトリを乗っ取ったり署名鍵を盗んだ後に何が起きるか」。TUF はこれに対し、ロール分離・しきい値署名・オフライン鍵・鍵失効、そして鮮度 (expiry)・順序・バージョン情報を持つメタデータで応える。これにより、クライアントは rollback 攻撃や freeze 攻撃を拒否できる。

python-tuf は CLI ではなくライブラリとして配布される。公開 API は `tuf.ngclient` で、`Updater` / `UpdaterConfig` / `FetcherInterface` / `Urllib3Fetcher` / `TargetFile` をエクスポートする ([`tuf/ngclient/__init__.py:6`](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/__init__.py#L6))。低レベルの Metadata API (`tuf.api`) がシリアライズと署名検証を担い、`tuf.repository` がリポジトリ側ツールを作るための基底クラスを提供する。

位置づけはソフトウェア配布システムの下層。パッケージインデックス、アーティファクト CDN、署名サービスが TUF メタデータを使い、ダウンロードしたものを署名済み・ロール分離されたメタデータと照合してから信頼する。

## いつ使うか

- ソフトウェアやアーティファクトを配布し、リポジトリや 1 つの署名鍵が侵害されてもクライアントに完全性検証を続けさせたいとき。
- 単なるファイル完全性だけでなく、rollback (古い脆弱な版を配る) や freeze (更新を止める) 攻撃への防御が必要なとき。
- パッケージインデックス向けの署名済みメタデータ層 (PyPI 向け PEP 458) や信頼ルート配布チャネル (Sigstore) を実装するとき。
- 向かないのは、1 つのファイルが既知ハッシュと一致するか確かめるだけで足りるとき、または 1 アーティファクトへのデタッチ署名 (GPG) で十分なとき。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [theupdateframework/python-tuf ソース, pin `9a3c304`](https://github.com/theupdateframework/python-tuf)
2. [The Update Framework (TUF), CNCF プロジェクトページ](https://www.cncf.io/projects/the-update-framework-tuf/)
3. [The Update Framework, Wikipedia](https://en.wikipedia.org/wiki/The_Update_Framework)
4. [CNCF Announces TUF Graduation, PRNewswire](https://www.prnewswire.com/news-releases/cloud-native-computing-foundation-announces-tuf-graduation-300976974.html)
5. [Open-source system to secure software updates graduates, NYU Tandon](https://engineering.nyu.edu/news/open-source-system-secure-software-updates-graduates-protect-leading-cloud-services)
6. [PEP 458: Secure PyPI downloads with signed repository metadata](https://peps.python.org/pep-0458/)
7. [Implementing PEP 458 to Secure PyPI Downloads, VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/)
8. [Sigstore: Bring-your-own sTUF with TUF, Sigstore blog](https://blog.sigstore.dev/sigstore-bring-your-own-stuf-with-tuf-40febfd2badd/)
9. [sigstore/sigstore-python releases](https://github.com/sigstore/sigstore-python/releases)
10. [tuf on PyPI](https://pypi.org/project/tuf/)
