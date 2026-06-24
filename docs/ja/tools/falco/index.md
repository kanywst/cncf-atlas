# Falco

> Linux カーネルのイベントを監視し、アクティビティがルールに一致したときにアラートを出すランタイムセキュリティエンジン。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Graduated
- **言語**: C++
- **ライセンス**: Apache-2.0
- **リポジトリ**: [falcosecurity/falco](https://github.com/falcosecurity/falco)
- **ドキュメント対象コミット**: `5123e90` (master, 2026-06-18)

## 概要

Falco はランタイムセキュリティツールである。Linux ホストが発行するシステムコールのストリームを取得し、各イベントをルール群と照合し、ルールに一致したときにアラートを発する。ルールはコンテナ内で起動したシェル、機微なパスへの書き込み、想定外のアドレスへの外向き接続などを記述できる。

プロジェクトは C++ で書かれた単一の `falco` バイナリとして配布される。Kubernetes では DaemonSet として動き、各ノードに自ノードのカーネルイベントを読むエージェントが配置される。イベント収集は新しめのカーネルでは eBPF プローブを使い、古いカーネルではカーネルモジュールにフォールバックする。syscall 以外にも、プラグインフレームワークによって Kubernetes audit ログやクラウドプロバイダのトレイルといった別のイベントソースを読める。

Falco は検知してアラートを出す。プロセスのブロックや kill は自分では行わない。これによりデータ経路を軽く保ち、対応は下流のツールに委ねる。enforcement レイヤーではなく検知エンジンとしての役割に合致する。

## どんなときに使うか

- メンテナンスされたコミュニティのルールライブラリとともに、Linux ホストや Kubernetes ノードでランタイムの脅威検知をしたいとき。
- syscall 以外のソース (Kubernetes audit, CloudTrail, Okta, GitHub) をプラグイン経由で 1 つの検知エンジンに取り込みたいとき。
- 複数のカーネルバージョンが混在し、eBPF CO-RE が使えない環境ではカーネルモジュールにフォールバックできるツールが必要なとき。
- 主目的がカーネル内での enforcement (プロセス kill、コネクション drop) の場合は適合度が下がる。その用途には enforcement を中心に設計されたツールが向く。

## この deep-dive の構成

- [History](./history): Sysdig での誕生、CNCF への寄贈、卒業まで。
- [Architecture](./architecture): バイナリ、エンジン、1 イベントが 1 アラートになるまで。
- [Adoption & Ecosystem](./adoption): 引用可能な採用組織、GitHub シグナル、周辺ツール。
- [Internals](./internals): ルールのデータ構造と event-type インデックスをソースから読む。
- [Getting Started](./getting-started): Helm で Kubernetes に導入し検知を確認する。

## 出典

1. [CNCF Announces Falco Graduation](https://www.cncf.io/announcements/2024/02/29/cloud-native-computing-foundation-announces-falco-graduation/) (2026-06-22)
2. [falcosecurity/falco on GitHub](https://github.com/falcosecurity/falco) (2026-06-22)
3. [Falco releases](https://github.com/falcosecurity/falco/releases) (2026-06-22)
4. [Falco's Journey to CNCF graduation, Sysdig](https://www.sysdig.com/blog/falco-cncf-graduation) (2026-06-22)
5. [Falco Graduates within the CNCF, falco.org](https://falco.org/blog/falco-graduation/) (2026-06-22)
6. [The Falco Project docs](https://falco.org/docs/) (2026-06-22)
7. [Falcoctl: install and manage rules and plugins](https://falco.org/blog/falcoctl-install-manage-rules-plugins/) (2026-06-22)
8. [Falco ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) (2026-06-22)
9. [eBPF Runtime Security Tools: Falco vs Tetragon vs Tracee](https://www.decryptiondigest.com/blog/ebpf-runtime-security-tools-falco-tetragon) (2026-06-22)
10. [Tetragon vs Falco 2026 Runtime Security Comparison](https://safeguard.sh/resources/blog/tetragon-vs-falco-runtime-security-2026) (2026-06-22)
11. [Try Falco on Kubernetes quickstart](https://falco.org/docs/getting-started/falco-kubernetes-quickstart/) (2026-06-22)
