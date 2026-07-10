# 歴史

## 起源

HAMi は中国の AI 企業 4Paradigm による GPU 共有プロジェクト `k8s-vGPU-scheduler` として始まった。GitHub リポジトリの作成は 2021-09-14 で、README には今も旧称が残る (`README.md:23`)。解こうとした課題は、あらゆる GPU クラスタが直面するものだ。1 つの学習・推論 Pod はカードのメモリと演算のごく一部しか使わないことが多いのに、Kubernetes は GPU を丸ごと割り当てるため、残りが遊ぶ。このプロジェクトは、アプリを変更させずに、複数の Pod が Pod ごとの実効的な上限付きで 1 枚を共有できるようにすることを目指した。

コンテナ内隔離ライブラリ HAMi-core は別の系譜を持つ。Dynamia AI と NVIDIA のエンジニアが設計し、後に 4Paradigm などのメンテナが加わって、単一企業のツールではなくマルチベンダの取り組みになった (Dynamia AI ブログ)。これは `libvgpu.so` として配布され、独自リポジトリに置かれ、本体ツリーからは `libvgpu` サブモジュールとして参照される (`.gitmodules`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | 4Paradigm で `k8s-vGPU-scheduler` としてリポジトリ作成 (2021-09-14) |
| 2024 | 最初のタグ付きリリース (`v1.0.0.0`, 2024-07-25)、CNCF Sandbox 申請 (cncf/sandbox #97, 2024-04-15)、Sandbox 受理 (2024-08-21) |
| 2026 | `v2.x` リリースラインが活発 (`v2.9.0`, 2026-05-19)、CNCF Incubating へ昇格 (2026-07-02)、本稿は `2487a24` を基準 |

## どう進化したか

大きな転換は 2 つある。1 つはリリース番号のリセットだ。初期のタグは 4 桁 (`v1.0.0.0` から `v1.0.0.3`、加えて古い `hami-2.3` タグ) だったが、後に標準の `v2.x.y` セマンティックバージョニングに移行し、`v2.9.0` が 2026-05-19 に切られた。この変更は、単一企業のツールから、より広いコントリビュータ基盤を持つプロジェクトへの移行と符合する。

もう 1 つはガバナンスだ。HAMi は 2024-04-15 に CNCF Sandbox へ申請し、申請文書は原所有者を 4Paradigm と記載している (cncf/sandbox #97)。2024-08-21 に、2024 年下期の sandbox 到着プロジェクトの 1 つとして受理された (CNCF ブログ)。2026-07-02 には Incubating に昇格した (CNCF プロジェクトページ、Dynamia AI ブログ)。基準コミットには食い違いがある。README は今も HAMi を CNCF Sandbox プロジェクトと記す (`README.md:25`)。この文言が Incubating 投票より前に書かれ、このコミットが切られた時点で未更新だったためだ。現在の成熟度は Incubating であり、本ディープダイブは古い README の行ではなく CNCF プロジェクトページに従う。

## 現在地

HAMi は活発な CNCF Incubating プロジェクトで、`v2.x` ラインで安定したリリース頻度を保つ。スコープは NVIDIA をはるかに超えて広がった。`pkg/device` ツリーには Ascend・Cambricon・Hygon・Metax・Mthreads・Iluvatar・Enflame・Kunlun・AWS Neuron・Biren・VastAI・AMD の実装があり、各々が同じ `Devices` インターフェースを満たす (`pkg/device/devices.go:36`)。掲げる方向性は、デフォルトスケジューラに差し込め、Volcano や Koordinator のようなバッチシステムと連携する、ベンダ非依存のクラスタ内アクセラレータ部分共有レイヤである (HAMi ドキュメント、Koordinator ドキュメント)。
