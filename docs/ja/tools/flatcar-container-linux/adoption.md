# 採用とエコシステム

## 誰が使っているか

以下の組織はプロジェクト自身の `ADOPTERS.md` に記載されている。自己申告と公開言及による利用を、連絡先付きで記録したファイルだ。各行はそのファイルから採った。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Adobe | 複数クラウドと自社 DC 22 リージョンにまたがる 18,000 ノード超の Kubernetes フリート | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| 1&1 Mail & Media（GMX, WEB.DE, mail.com） | 4,000 万ユーザ超向けの on-prem ベアメタル Kubernetes のベース OS | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| DeepL | CI/CD から GPU ワークロードまでの on-prem Kubernetes | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| Equinix Metal | ベアメタルクラウドのコントロールプレーンの OS | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| Finleap Connect | 規制業界の cloud-native スタックで 12 本番クラスタ・300 ノード超 | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |
| AT&T, Atsign, Digital Science, Genesis Cloud | その他の記載済み採用企業 | [ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md) |

## 採用シグナル

実装が複数リポジトリに分散するため、GitHub の star はビルドスクリプトよりアンブレラに集中する。2026-06-24 観測:

- [flatcar/Flatcar](https://github.com/flatcar/Flatcar)（アンブレラ: docs・ガバナンス・issue）: star 約 1,197、contributor 27。
- [flatcar/scripts](https://github.com/flatcar/scripts)（ビルド実装）: star 約 84、fork 94、contributor 228。
- CNCF は 2024 年に Flatcar を Incubating レベルで受理した。財団として初の OS ディストリビューションだ（[CNCF ブログ](https://www.cncf.io/blog/2024/10/29/flatcar-brings-container-linux-to-the-cncf-incubator/)）。

## エコシステム

Flatcar は cloud-native ツール群と統合する。

- **Ignition**: 宣言的な初回ブート構成。
- **containerd**: 出荷されるランタイム（Docker も利用可）で、systemd-sysext として合成される（`src/build_image:42`）。
- **systemd-sysext**: 読み取り専用 `/usr` に機能を重ねる。
- **Cluster API**: Kubernetes ノードの自動プロビジョニング。
- **Nebraska**: Omaha プロトコル互換の更新サーバで、イメージ更新を配信する。

## 代替

以下 4 つはいずれもコンテナ最適化のイミュータブル Linux ディストリビューションだ。違いはクラウドの守備範囲、ホストの締め付けの度合い、更新思想にある（[HomeLab 比較](https://homelabstarter.com/homelab-immutable-os-comparison/)、[DEV 比較](https://dev.to/matheus_releaserun/container-optimized-linux-distributions-compared-flatcar-bottlerocket-talos-and-fedora-coreos-4fj2)）。

| 代替 | 違い |
| --- | --- |
| Fedora CoreOS | 同じ CoreOS 系譜だが Fedora 追従で更新が速い。RHCOS/OpenShift の上流。Flatcar は稼働中コンテナを壊さないよう保守的。 |
| Bottlerocket（AWS） | EKS 特化、SSH 既定無効、署名済みカーネルモジュールのみ。AWS 全振りなら強い。Flatcar は複数クラウドとベアメタルにまたがる。 |
| Talos（Sidero Labs） | スクラッチ設計で shell も SSH も無く、API 専用（`talosctl`）の管理モデル。最も締め付けが強いが運用流儀が異なる。Flatcar はデバッグ容易性のため SSH と Docker を残す。 |
