# 採用事例・エコシステム

## 誰が使っているか

ドキュメント基準コミットの時点で、名前付きの採用組織はプロジェクトから確認できない。リポジトリには `ADOPTERS.md` があるが、その「Adopters List」セクションは空である。ファイルにはテンプレートと組織追加の要件のみがあり、列挙された組織はない。この deep-dive は採用組織を捏造しない。

正直に述べられるのは、プロジェクトの出自と公開トークである。Akri は Microsoft DeisLabs で始まり、Helm、SMI、Virtual Kubelet と並んで Microsoft が CNCF へ寄贈に向けたプロジェクト群の 1 つだった (出典 3)。設計の根拠は maintainer の Kate Goldenring が Kubernetes Podcast で語っている (出典 5)。

## 採用シグナル

2026-06-26 に `gh api` で観測した GitHub シグナル (出典 1):

| シグナル | 値 |
| --- | --- |
| Stars | 1250 |
| Forks | 165 |
| Contributors | 46 |
| Open issues | 88 |

プロジェクトは CNCF Sandbox にあり (2021-09-14 受理)、すべてのリリースは 1.0 未満のままである (出典 1、2)。リリースのタグ付けは不定期で、ドキュメント基準コミットでの最新は 2024 年 11 月の v0.13.8 である。

## エコシステム

Akri は Kubernetes の device plugin framework に組み込まれ、Helm で配備される。ONVIF、udev、OPC UA 用の Discovery Handler と、テスト用の debug-echo ハンドラを同梱し、discovery gRPC プロトコルを話すプロセスなら独自ハンドラとして追加できる (出典 1、6)。Controller は `controller/src/main.rs:16` で定義される `akri_broker_pod_count` などの Prometheus メトリクスを expose する。

## 代替

Akri は範囲が狭い。すでに Kubernetes を動かすノードに対して leaf device を発見・広告する。隣接プロジェクトはエッジ問題の別の層を解く。

| 代替 | 違い |
| --- | --- |
| KubeEdge | 既存の Kubernetes ノードを前提とせず、エッジノードで EdgeCore を動かし mapper と MQTT でデバイスを制御する。Akri と補完的に使える (出典 7) |
| OpenYurt / SuperEdge | Kubernetes 制御面をエッジノードへ拡張する。デバイス発見が主目的ではない (出典 7) |
| k3s / MicroK8s | ノード自体のための軽量 Kubernetes ディストリ。Akri は Kubernetes をまったく動かせないほど小さいデバイスを対象にする (出典 7) |
