# 歴史

## 起源

Capsule はイタリアの Kubernetes コンサルティング企業 Clastix が立ち上げ、2020 年に OSS として公開した。GitHub リポジトリの作成日は 2020-06-29 で、最初期のリリースは `v0.0.1` タグだった。作者の Dario Tranchitella は当初から Apache-2.0 ライセンスかつ CNCF 互換であることを明記して公開を告知している (出典 9)。

解こうとした課題は構造的なものだ。Kubernetes の Namespace はフラットな単位であり、1 チームの複数 Namespace を束ねる、それらで quota を共有する、チームオーナーが安全に追加作成する、といったことを表す組み込みオブジェクトがない。よくある回避策はチームごとにクラスタを与えることだが、これはクラスタ乱立 (cluster sprawl) と相応の運用コストを生む。Capsule は単一クラスタ内でチームごとの Namespace を 1 つの `Tenant` オブジェクトに集約してこれを避ける (出典 8)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | Clastix が Capsule を OSS 公開。リポジトリ作成 2020-06-29、初回リリース v0.0.1 (出典 1, 9) |
| 2022 | 2022-12-13 に CNCF Sandbox 採択 (出典 2, 3) |
| 2022 以降 | Sandbox オンボーディング: 中立な `projectcapsule` org への移管、docs の MkDocs 化、DCO/CLA と行動規範の整備 (出典 4) |
| 2026 | リリースが継続。v0.13.7 を 2026-06-24 にカット (出典 1) |

## どう進化したか

最大のコード外の転換はガバナンスだった。CNCF Sandbox オンボーディングの一環 (umbrella issue #812 で追跡) として、プロジェクトはベンダー所有の `clastix/capsule` リポジトリから中立な `projectcapsule` org へ移り、Developer Certificate of Origin と Contributor License Agreement のフローを採用し、行動規範を公開し、ドキュメントサイトを作り直した (出典 4)。ドキュメントのドメインも `capsule.clastix.io` から `projectcapsule.dev` へ移行し、Helm チャートの README は後者を指す (`charts/capsule/README.md:5`)。

API 側では、Capsule は 2 つの CRD API グループ `api/v1beta1` と `api/v1beta2` を維持し、v1beta2 を storage version としている (`api/v1beta2/tenant_types.go:141` の `+kubebuilder:storageversion` マーカー)。テナントモデルはルールと enforcement の仕組みへ拡張されつつあり、古い `TenantStatus` / `TenantSpec` フィールドのいくつかは新しい構成へ非推奨化されている。例えば `TenantStatus.Namespaces []string` は Deprecated とされ (`api/v1beta2/tenant_status.go:42`)、`Spaces []*TenantStatusNamespaceItem` へ置き換えられている (`api/v1beta2/tenant_status.go:44`)。

## 現在地

Capsule は `projectcapsule` org 配下の CNCF Sandbox プロジェクトである (出典 2)。リリースは定期的に出ており、v0.13.7 は 2026-06-24 にカットされた (出典 1)。ビルドは単一の Go コントローラバイナリで、`make manager` は `go build -o bin/manager` を実行する (`Makefile:64-65`)。モジュールは Go 1.26 を対象とする (`go.mod`、`go 1.26.4`)。掲げる方向性は、追加の API サーバやテナントごとのコントロールプレーンを持たない native な体験を保ちつつ、Namespace ごとのポリシーをテナントスコープのルールと enforcement モデルへ集約し続けることである。
