# 採用事例・エコシステム

## 誰が使っているか

リポジトリには `ADOPTERS.md` も `MAINTAINERS.md` も無く (どちらも GitHub API で 404)、本番採用組織を名指しする一次情報は調査で見つからなかった。名前の出せる本番採用組織はここでは主張しない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| (確認できた本番採用組織なし) | 個人の honeypot プロジェクト `paseaf/ContainerSSH-honeypot` が、GCP 上で ContainerSSH をベースにした高対話型 SSH honeypot を動かしている。組織のデプロイではなく個人プロジェクト | [paseaf/ContainerSSH-honeypot](https://github.com/paseaf/ContainerSSH-honeypot) |

## 採用のシグナル

GitHub API から 2026-06-26 に測定 (出典 10):

- Stars: 3,061
- Forks: 106
- Contributors: 21
- Open issues: 57
- 最新リリース: v0.6.0 (2026-03-23 公開)。基準コミット `ce7d2b6` は `main` 上でその少し後
- CNCF 成熟度: Sandbox、2022-09-14 受理 (出典 3)
- コミュニティ: CNCF Slack の `#containerssh` チャンネル (出典 2)

## エコシステム

ContainerSSH は SSH クライアントとコンテナランタイムの間に座るよう作られているので、エコシステムの多くは上に構築されるツールというより、連携先のシステムだ:

- **コンテナバックエンド**: Docker, Kubernetes, Podman (Docker 互換 HTTP API 経由)。加えて別 SSH サーバへ転送する `sshproxy` backend。
- **認証・設定 webhook**: 自分で書く任意の HTTP サービス。これが IdP・データベース・ディレクトリへの到達手段になる。
- **監査ログ保存**: バイナリ監査ログを S3 互換オブジェクトストレージへアップロードできる。
- **可観測性**: Prometheus メトリクスと、接続の GeoIP エンリッチメント。
- **サプライチェーン**: リリースは `slsa-verifier` で検証可能な SLSA provenance (`multiple.intoto.jsonl`) を添付する (出典 2, 11)。

## 代替候補

ContainerSSH は狭いニッチを占める: 接続ごとに本物の使い捨てコンテナを起こし、webhook 駆動の認証・設定を持つ SSH の玄関口だ。最も近い代替は、重なりつつも別の問題を解く。

| 代替 | 違い |
| --- | --- |
| [Cowrie](https://github.com/cowrie/cowrie) | Python でシェルをエミュレートする中対話型 SSH/Telnet honeypot。コンテナを一切起こさないので、攻撃者は本物の (隔離された) システムに落ちるのではなくエミュレーションに閉じ込められる (出典 5)。 |
| [Teleport](https://github.com/gravitational/teleport) | 既存マシンやクラスタへの SSH / Kubernetes アクセスを監査する証明書ベースのアクセスプレーン。ログインごとに使い捨てコンテナを起こすのではなく、本物の機器群へのアクセスを統制する。 |
| [sshpiper](https://github.com/tg123/sshpiper) | 接続を上流の SSH サーバへ振り分ける SSH リバースプロキシ。多重化・プロキシはするが、使い捨てコンテナの生成、認証/設定 webhook、セッション監査ログのアップロードはしない。 |
