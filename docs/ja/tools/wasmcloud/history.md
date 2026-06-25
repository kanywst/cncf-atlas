# 歴史

## 起源

wasmCloud は Liam Randall と Kevin Hoffman が米大手銀行に在籍していた頃に着手した。彼らはビジネスロジックを、単一ランタイムに縛られたモノリスではなく、プラットフォームが配置・結線できる小さく可搬な単位として動かしたかった。初期の抽象は actor model (1973 年に起源を持つ) に基づく。実装は一時 Rust から Erlang/OTP に移り、WebAssembly コンポーネントモデルによって Rust ベースのコンポーネントランタイムが現実的になると再び Rust に戻った ([b-nova](https://b-nova.com/en/home/content/actors-in-the-cloud-with-wasmcloud/)、[InfoWorld](https://www.infoworld.com/article/2338269/first-look-wasmcloud-and-cosmonic.html))。

スポンサー企業は Cosmonic で、Liam Randall と Stuart Harris が共同創業した。現在のプロジェクトリードは Cosmonic CTO 兼 Bytecode Alliance TSC メンバーの Bailey Hayes ([CNCF incubator blog](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | 2021-07-13 に CNCF Sandbox 受理 ([CNCF project page](https://www.cncf.io/projects/wasmcloud/)) |
| 2023 | WASI Preview 2 / コンポーネントモデルに合わせてエコシステムを componentize。IDL に WIT を採用 ([Cosmonic](https://cosmonic.com/blog/industry/cosmonic-componentizes-wasmcloud-ecosystem)) |
| 2024 | KubeCon EU Paris で wasmCloud 1.0。WASI 0.2 と wRPC を本番向けに ([Cosmonic](https://blog.cosmonic.com/engineering/wasmcloud-1-brings-components-to-enterprise/)) |
| 2024 | Kubernetes operator (旧 Cosmonic Connect Kubernetes) を CNCF へ寄贈 ([Cosmonic](https://blog.cosmonic.com/engineering/wasmcloud-operator-is-here/)) |
| 2024 | 2024-11-08 の TOC 投票で Sandbox から Incubating へ昇格 ([CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)) |
| 2026 | v2.4.0 を 2026-06-17 にリリース (GitHub Releases) |

## どう進化したか

最大の転換は、基準コミットに反映された v2 リライトだ。歴史的な wasmCloud は、NATS の「lattice」が actor (後にコンポーネント)・capability provider・宣言的デプロイ管理の `wadm` を繋ぐ多クレート構成だった ([wasmCloud docs](https://wasmcloud.com/docs/concepts/hosts/))。基準コミットの `wasmCloud/wasmCloud` リポジトリは中身が大きく異なる。`wash` (`README.md:1`) を中心に据え、Cargo workspace のメンバーは 3 つ: `wash` CLI、`wash-runtime` ランタイム、ベンチマーク用クレート。

これは Q3 2025 ロードマップに沿う。ロードマップは provider を wRPC server として位置づけ直し、transport・scheduling・events・claims を刷新しつつ Kubernetes に寄せることを掲げた ([roadmap](https://wasmcloud.com/docs/roadmap/))。v2 コードでは NATS lattice はもはやコントロールプレーンではない。制御は gRPC 経由で Kubernetes operator に流れる (`proto/wasmcloud/runtime/v2/`)。NATS は一部のプラグイン (key-value と blob store) の内部で使われる依存として残るが、必須のコントロールプレーン要素ではない。

読者にとっての帰結は 2 つ。lattice・NATS・actor・`wadm` を説明する古い記事は概念モデルの理解には今も有効だが、現行コードの構造とは一致しない。本ディープダイブのアーキテクチャと内部実装は、`0c6315b` 時点の v2 コードを記述する。

## 現在地

プロジェクトは CNCF Incubating。リリースは `v2.x` 系で継続し、v2.4.0 は 2026-06-17 付。開発は `wash` CLI と組み込みの `wash-runtime` を中心とし、Go の operator と gateway が Kubernetes 統合を提供する。掲げる方向性は、ローカル開発 (`wash dev`) と Kubernetes 本番 (operator + gRPC) で共有する単一コンポーネントランタイムであり、ロードマップに記され v2 workspace で実現されている ([roadmap](https://wasmcloud.com/docs/roadmap/))。
