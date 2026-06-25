# 歴史

## 起源

Flatcar は CoreOS Container Linux の系譜に連なる。CoreOS は 2013 年に、コンテナ専用の Linux ディストリビューションとして Container Linux を導入した。読み取り専用 root、自動更新、安全なアップグレードのための A/B パーティション方式が特徴だ。ビルドシステムには今もその出自が残る。`LICENSE` ファイルは "Copyright (c) 2006-2013 The Chromium OS Authors" に続いて "Copyright (c) 2013-2015 CoreOS, Inc." で始まる。イメージツールが Chromium OS のビルドシステムから fork され、CoreOS が引き継いだためだ。

2018 年に Red Hat が CoreOS を買収し、Container Linux の将来は不透明になった。2015 年設立のベルリンの企業 Kinvolk は、既存ユーザに保守された継続先を残すため、Container Linux の drop-in fork として Flatcar を立ち上げた。

## 年表

| 年 | 節目 |
| --- | --- |
| 2013 | CoreOS が Container Linux を導入（読み取り専用 root、自動更新、A/B パーティション）。 |
| 2018 | Red Hat が CoreOS を買収。Container Linux の将来が不透明に。 |
| 2018 | Kinvolk が Container Linux の drop-in fork として Flatcar を立ち上げ。 |
| 2020-05-26 | CoreOS Container Linux が EOL。Flatcar が事実上の継続先に。 |
| 2021-04-29 | Microsoft が Kinvolk を買収。Flatcar は Microsoft 配下でコミュニティプロジェクトとして継続。 |
| 2024-08-02 | CNCF が Flatcar を Incubating レベルで受理（公表は 2024-10-29）。 |

## どう発展したか

転機は 2020 年 5 月 26 日の CoreOS Container Linux の EOL だった。Flatcar は drop-in 代替として位置づけられており、EOL により Fedora CoreOS へ移行できないユーザにとっての実質的な継続先となった。

2021 年 4 月、Microsoft が Kinvolk を買収した。Flatcar はクローズドな製品ではなく、Microsoft の管理のもとコミュニティ主導のプロジェクトとして続いた。

コードベースは Gentoo/Portage の基盤を保ちつつ OS イメージを刷新してきた。コンテナランタイムはもはやベース OS に焼き込まれず、systemd-sysext イメージとして合成される。ビルドの既定 sysext セットは、OS と並んで出荷されるランタイムとして containerd と docker を宣言する（`src/build_image:42`）。

## 現在地

Flatcar は 2024 年に CNCF Incubator へ入った。財団として初の OS ディストリビューションだ。プロジェクトは stable / beta / alpha チャネルを出荷しており、本詳解時点の stable は `stable-4593.2.3`（2026 年 6 月）、ビルドツリーのバージョンマニフェストは `FLATCAR_VERSION=4734.0.0+nightly-20260617-2100` を pin していた（`src/sdk_container/.repo/manifests/version.txt`）。リリースは [flatcar/scripts](https://github.com/flatcar/scripts) の Gentoo ベース SDK ビルドシステムが生成し、ガバナンス・issue・ドキュメントはアンブレラの [flatcar/Flatcar](https://github.com/flatcar/Flatcar) リポジトリで管理される。
