# 採用事例・エコシステム

## 誰が使っているか

README は Lima を VM エンジンとして組み込むアダプタを列挙している。これらが出典を示せる採用先で、いずれもエンドユーザー組織ではなくツールであり、各々が README の Adopters セクションからリンクされている。

| プロジェクト | ユースケース | 出典 |
| --- | --- | --- |
| Rancher Desktop | デスクトップ向けの Kubernetes・コンテナ管理。VM エンジンに Lima を使用 | [rancherdesktop.io](https://rancherdesktop.io/) |
| Colima | macOS/Linux で Docker・Kubernetes を最小設定で。Lima 上に構築 | [github.com/abiosoft/colima](https://github.com/abiosoft/colima) |
| Finch | AWS のローカルコンテナ開発向けコマンドラインクライアント | [github.com/runfinch/finch](https://github.com/runfinch/finch) |
| Podman Desktop | Podman Desktop GUI が Lima 仮想マシン用プラグインを同梱 | [podman-desktop.io](https://podman-desktop.io/) |

エンドユーザー組織名はドシエでは確立できていない。メンテナは CNCF デューデリジェンス用にユーザーストーリーを集める Discussion #2390 を開いている。

## 採用のシグナル

GitHub REST API で 2026-06-24 に観測:

- スター数: 21,323
- フォーク数: 908
- コントリビュータ: 約 215 名
- 最新リリース: v2.1.3 (2026-06-19)。v2.0 は 2025-11-06、v2.1 は 2026 年初頭に出荷されており、リリースは安定したペースで続いている。

Lima は 2025-10-14 に CNCF Incubating へ到達しており、それ自体が成熟度のシグナルだ。

## エコシステム

上記のアダプタ群 (Rancher Desktop / Colima / Finch / Podman Desktop) が Lima を VM エンジンとして組み込む。Lima は `templates/` 配下に Ubuntu / Debian / Fedora / Alpine などのテンプレートを同梱する。ラッパバイナリ (`nerdctl.lima` / `docker.lima` / `kubectl.lima` / `podman.lima`) でホストのコマンドがゲストを直接駆動でき、`limactl-mcp` が MCP インターフェースを公開する。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Colima | Lima の上に Docker/containerd 向けに事前設定された薄く opinionated な CLI。Lima 自体は YAML でより細かく制御でき、非 Ubuntu ディストロや再現可能な dev VM に向く。 |
| Multipass (Canonical) | Ubuntu cloud-image の高速ランチャ。ホストマウントは 9p で、Lima の virtiofs の方が I/O が速い。 |
| Docker Desktop | 商用で GUI が厚く、バンドル機能とライセンス条項がある。Lima はヘッドレスで軽量、Apache-2.0。 |
| OrbStack | macOS 専用の商用製品。高速で UI が洗練。Lima は OSS でクロスホスト。 |
| UTM / QEMU / VirtualBox | 汎用 VM ツール。Lima は開発者向けに自動マウント・ポートフォワード・テンプレートを付けた点が差。 |

## 出典

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Adopters), 参照 2026-06-24。
2. [Rancher Desktop](https://rancherdesktop.io/), 参照 2026-06-24。
3. [Colima](https://github.com/abiosoft/colima), 参照 2026-06-24。
4. [Finch](https://github.com/runfinch/finch), 参照 2026-06-24。
5. [Podman Desktop](https://podman-desktop.io/), 参照 2026-06-24。
6. [Discussion #2390: CNCF デューデリジェンス用ユーザーストーリー](https://github.com/lima-vm/lima/discussions/2390), 参照 2026-06-24。
7. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), 参照 2026-06-24。
8. [Lima vs Colima vs Multipass vs Docker Desktop](https://sumguy.com/lima-vs-multipass/), 参照 2026-06-24。
