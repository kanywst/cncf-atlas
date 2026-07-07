# 歴史

## 起源

ContainerSSH は Janos Pasztor が始めた。リポジトリは 2020-06-03 に作成され (出典 10)、Go module はその年の後半に公開された。最初の動機は honeypot ではない。Web ホスティングの課題、つまり同じ人物がマシンごとに異なるユーザ名を持つ中でユーザデータをサーバ間で移送したい、という問題から来ている。よくある解答である `ForceCommand` に固定した SSH サーバは、`SSH_ORIGINAL_COMMAND` 経由のコマンドインジェクションに弱く、公開すると危険だ。各セッションを専用コンテナに隔離することで、その種のリスクが消える (出典 5)。

honeypot 用途はトークを通じて後から加わった。FOSDEM 2021 で Sanja Bonic と Janos Pasztor が、コンテナから SSH honeypot を作る実験を発表した。最初の設計はコンソールセッションを asciinema に記録するものだったが、攻撃者の大半は対話型コンソールを開かず SSH 越しに直接コマンドを送る bot で、何も記録できないと分かった。そこでパスワードを含めすべてを記録するバイナリ監査ログに切り替えた (出典 5)。この監査モデルは今もプロジェクトを特徴づける機能だ。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | リポジトリ作成 (2020-06-03)、`janoszen/containerssh` として。Go module はその年の後半に公開 (出典 10)。 |
| 2021 | FOSDEM 2021 でコンテナから SSH honeypot を作るトーク。監査設計を完全なバイナリログへ転換 (出典 5)。 |
| 2022 | 2022-09-14 に CNCF Sandbox 入り (出典 3)。 |
| 2026 | 2026-03-23 に v0.6.0 リリース。リリースには `slsa-verifier` で検証可能な SLSA provenance が付く (出典 2)。 |

## どう進化したか

時間とともに最も目に見えた変化はコードの置き場所だ。プロジェクトは `github.com/janoszen/containerssh` の下で始まり、一時期はコア実装が別の `libcontainerssh` リポジトリに切り出されていた。その分割は今は元に戻り、main リポジトリ自体が実装本体になっている。module path は `go.containerssh.io/containerssh` だ。基準コミット時点でトップレベルには `agentprotocol/`, `auditlog/`, `auth/`, `cmd/`, `config/`, `http/`, `internal/`, `log/`, `message/`, `metadata/`, `service/` が並び、コードの大半 (非テスト Go ファイル約 328 のうち約 256) は `internal/` に集中している。

もう 1 つの変化はサプライチェーン保証だ。リリースは今や SLSA (Supply-chain Levels for Software Artifacts) provenance を `multiple.intoto.jsonl` ファイルとして添付し、利用者はバイナリを信頼する前に `slsa-verifier` で検証できる (出典 2)。信頼できない SSH 接続を受けることが仕事そのものであるプロジェクトにとって、これは通常より重い意味を持つ。

## 現在地

基準コミット `ce7d2b6` は `main` 上にあり、2026-03-23 の v0.6.0 リリース (その時点の最新タグ) の少し後だ。ビルドは Go (`go 1.25.3`, `go.mod:3`) で、`go build ./cmd/containerssh` によるソースビルドか、公式 `containerssh/containerssh` image のどちらかで行う。CNCF Sandbox プロジェクト (2022-09-14 受理) であり、CNCF Slack の `#containerssh` チャンネルで連携している (出典 2)。単一メンテナ主導で、控えめなコントリビュータ規模のプロジェクトのままだ。測定可能なシグナルは採用事例ページで扱う。
