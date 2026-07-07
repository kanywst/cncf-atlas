# recon: ContainerSSH

SSH 接続を受けると、その接続専用の使い捨てコンテナ (Docker / Kubernetes) を起動して中に放り込む SSH サーバ。認証も接続ごとの設定も外部 HTTP webhook に委譲するのが肝。調査メモ。出典は各節末と `sources.md`。

## 基本情報

- repo: `ContainerSSH/ContainerSSH` (Go module は `go.containerssh.io/containerssh`)
- pinned commit: `ce7d2b6dbe3a592355c50ef4d80f7ae10eb3fa26` (2026-05-08, `fix: x11 forward crash (#694)`)
- 近いタグ: `v0.6.0` (2026-03-23 リリース)。pin はその後の `main` HEAD なので v0.6.0 より新しい
- 言語 / ビルド: Go (`go 1.25.3`、`go.mod:3`) / `go build ./cmd/containerssh` もしくは公式 Docker image `containerssh/containerssh`
- ライセンス: Apache-2.0 (`LICENSE` 冒頭、GitHub API の `spdx_id` も `Apache-2.0`)。ビジュアルアイデンティティだけ別ライセンス
- CNCF 成熟度: Sandbox (2022-09-14 受理)
- メインエントリポイント: `cmd/containerssh/main.go` が `containerssh.Main()` を呼ぶだけ。実体は repo ルートの `main.go:26` `Main()`
- カテゴリ: Developer Tools

補足: 旧称 `github.com/janoszen/containerssh`。かつてコア実装は別 repo `libcontainerssh` に切り出されていたが、現在は main repo がそのまま実装本体 (module path `go.containerssh.io/containerssh`)。toplevel に `agentprotocol/ auditlog/ auth/ cmd/ config/ http/ internal/ log/ message/ metadata/ service/` が並ぶ。`.go` 非テストファイルは約 328、うち `internal/` に 256 が集中。

出典: GitHub repo `ContainerSSH/ContainerSSH`、CNCF プロジェクトページ。

## 歴史の素材

- 作者は Janos Pasztor。repo の作成は 2020-06-03 (GitHub API `created_at`)。Go module が公開されたのは 2020 年後半。
- 元々は honeypot 用ではなく、Web ホスティングの課題 (サーバ間でユーザ名が異なる中でデータ移送したい) を解くために作られた。`ForceCommand` 方式の SSH は `SSH_ORIGINAL_COMMAND` 経由のコマンドインジェクション (command injection) に弱く、honeypot にすると危険、という問題意識がコンテナ分離の動機の一つ。出典: LWN「Creating an SSH honeypot」<https://lwn.net/Articles/848291/>。
- FOSDEM 2021 で Sanja Bonic と Janos Pasztor が「コンテナで SSH honeypot を作る」実験を発表。最初は asciinema へ console ログを録る構成にしたが、攻撃者の大半は bot で console を開かず SSH 経由で直接コマンドを送るためログが取れず、バイナリ形式の audit log (パスワード含め全部録る) に切り替えた、という実話。出典: 同 LWN 記事。
- マイルストーン: v0.1.0 から v0.6.0。pin 時点の最新リリースは v0.6.0 (2026-03-23)。リリースには SLSA (Supply-chain Levels for Software Artifacts) provenance ファイル `multiple.intoto.jsonl` が付き `slsa-verifier` で検証可能 (README「Verify provenance」)。
- 2022-09-14 に CNCF Sandbox 入り。出典: CNCF プロジェクトページ <https://www.cncf.io/projects/containerssh/>。

## アーキテクチャの素材

ハンドラを多層にラップする「ロシア人形」構造。`New()` (`factory.go:22`) が下から上へ handler を組み立てる。各層は `sshserver.Handler` を実装し、内側の handler を wrap する。

組み立て順 (`factory.go:54-78`):

1. `createBackend` (`factory.go:54`、`backend.New`): docker / kubernetes / sshproxy を選ぶ最内層
2. `createAuthHandler` (`factory.go:59`、`authintegration.New`): 認証 webhook を呼ぶ層
3. `createAuditLogHandler` (`factory.go:64`、`auditlogintegration.New`): 監査ログと GeoIP
4. `createMetricsBackend` (`factory.go:69`、`metricsintegration.NewHandler`): Prometheus メトリクス
5. `createSSHServer` (`factory.go:74`、`sshserver.New`): 実際に TCP/SSH を待ち受ける最外層

リクエストは外 (SSH) から内 (backend) へ降りる。SSH サーバが接続を受けると `Handler.OnNetworkConnection` (`internal/sshserver/handler.go:30`) が呼ばれ、各層が `NetworkConnectionHandler` (`internal/sshserver/handler.go:97`) を返してチェーンする。

接続ごとの設定取得 (config server) はバックエンド層の `OnHandshakeSuccess` で起きる。`internal/backend/handler.go:96` の `networkHandler.OnHandshakeSuccess` が、

- `loadConnectionSpecificConfig` (`internal/backend/handler.go:179`) で config webhook を叩き、ベース設定に接続固有設定をマージ
- `getConfiguredBackend` (`internal/backend/handler.go:139`) で `appConfig.Backend` 文字列 (`docker`/`kubernetes`/`sshproxy`) を見て実バックエンドを生成
- `security.New` (`internal/backend/handler.go:130`) で security overlay を必ず一枚かぶせてから backend を返す

config webhook の HTTP 呼び出しは `internal/config/loader_http.go:37` `httpLoader.LoadConnection` から `client.Get` で行い、返ってきた `AppConfig` を `structutils.Merge` で重ねる (`internal/config/loader_http.go:42-49`)。これにより「ユーザ A は Docker、ユーザ B は Kubernetes、ログインごとに image を変える」が webhook 側のロジックだけで実現できる。

設定のルート構造は `config.AppConfig` (`config/appconfig.go:11`)。`SSH` / `ConfigServer` / `Auth` / `Audit` / `Security` / `Backend` / `Docker` / `Kubernetes` / `SSHProxy` をまとめる。`Validate(dynamic bool)` (`config/appconfig.go:92`) は config server を使う場合 (`ConfigServer.URL != "" && !dynamic`) はバックエンド検証をスキップする (`config/appconfig.go:103`)。バックエンド設定は config server から来る前提だから。

## 内部実装の素材

### 中核データ構造

- `config.AppConfig` (`config/appconfig.go:11`): 全設定のルート。webhook で動的差し替えされるのはこの一部。
- `sshserver.Handler` / `NetworkConnectionHandler` (`internal/sshserver/handler.go:19`, `:97`): 接続 → 認証 → セッションチャンネルの各段に対応するインターフェース階層。全バックエンドと全 integration 層がこれを実装する共通契約。
- `sshserver.AuthResponse` (`internal/sshserver/handler.go:35`): `Success` / `Failure` / `Unavailable` の 3 値 enum。`Unavailable` は「資格情報が違う」ではなく「認証バックエンドが落ちている」を表し、credentials 失敗と区別する設計。
- `backend.networkHandler` (`internal/backend/handler.go:52`): 接続を保持し、選ばれた実バックエンドへの委譲先 (`backend sshserver.NetworkConnectionHandler`) を握る。`OnDisconnect`/`OnShutdown` をここで一元化。
- `docker.channelHandler` (`internal/docker/handler_channel.go:16`): 1 つの SSH session channel が 1 つのコンテナ内プログラム実行に対応。`exec dockerExecution` と `pty/rows/columns/env` を保持。

### 代表的コアオペレーションを端から端まで (Docker backend, exec-mode = connection)

1. SSH ハンドシェイク成功後、`docker.networkHandler.OnHandshakeSuccess` (`internal/docker/handler_network.go:52`)。`ContainerStart` タイムアウト付き context を張り、Docker client を用意 (`setupDockerClient`, `:153`)、image を pull (`pullImage`, `:144`)。
2. 接続用ラベル (`containerssh_connection_id` / `containerssh_ip` / `containerssh_username`) を組み、exec-mode が `connection` なら 1 接続 = 1 コンテナを `createContainer` で作って `start` する (`internal/docker/handler_network.go:88-95`)。`meta.GetFiles()` の中身をコンテナへ書き込む (`:97-108`)。
3. クライアントが session channel を開くと `sshConnectionHandler.OnSessionChannel` (`internal/docker/handler_ssh.go:33`) が `channelHandler` を返す。
4. `shell`/`exec`/`subsystem` 要求で `channelHandler.OnShell` (`internal/docker/handler_channel.go:199`) や `OnExecRequest` (`:187`) が `run` (`:80`) を呼ぶ。
5. `run` は exec-mode を分岐 (`internal/docker/handler_channel.go:91`)。`connection` モードは `handleExecModeConnection` (`:129`) で既存コンテナに対し `createExec` (`docker exec` 相当)。`session` モードは `handleExecModeSession` (`:147`) で session ごとに新コンテナを作りプログラムをコンテナの主プロセスにする。
6. 続けて `c.exec.run(...)` (`internal/docker/handler_channel.go:108`) で SSH channel の stdin/stdout/stderr をコンテナ I/O に直結し、終了時に `session.ExitStatus` を返す。
7. 切断時 `networkHandler.OnDisconnect` (`internal/docker/handler_network.go:164`) が `container.remove` でコンテナごと破棄。これが「ログアウトで全部消える」の実体。

`parseProgram` (`internal/docker/handler_channel.go:64`): 要求コマンドの先頭が `/`・`./`・`../` で始まる絶対/相対パスならそのまま argv、そうでなければ `/bin/sh -c <program>` で包む。

### 認証 webhook

認証層は HTTP POST で外部サーバに問い合わせる。`internal/auth/webhook_client_impl.go` で endpoint を組む。`/password` (`:68`)、`/pubkey` (`:92`)、`/authz` (認可, `:47`)。パスワードは base64 エンコードして送る (`webhook_client_impl.go:73` 付近)。これにより認証ロジックを ContainerSSH 本体から完全に切り離し、任意の IdP (Identity Provider) / DB / LDAP を webhook の向こうに置ける。OAuth2 / OIDC (OpenID Connect) / Kerberos の組み込み実装も `internal/auth/` にある (`oauth2_oidc.go`, `kerberos.go` ほか)。

### 非自明な設計判断

Docker backend の 2 つの実行モード (`config.DockerExecutionModeConnection` 対 `DockerExecutionModeSession`, `internal/docker/handler_channel.go:91-95`)。

- `connection` モード: SSH 接続ごとに 1 コンテナ。各 channel は `docker exec` でそのコンテナ内に入る。複数セッションが状態を共有でき、PTY (擬似端末) や agent forwarding (`setupAgent`, `internal/docker/handler_ssh.go:127`) も成立する。
- `session` モード: SSH session channel ごとに新コンテナを起動し、ユーザのプログラムをコンテナの PID 1 にする。隔離は強いが port/agent forwarding は `setupAgent` 内で「session モードでは動かない」と弾かれる (`internal/docker/handler_ssh.go:185`)。

honeypot 用途では強隔離の session モード、lab/debug 用途では使い勝手の connection モード、という住み分け。この一個の enum 分岐が「ユースケースごとに別物に化ける」 ContainerSSH の性格を決めている。

出典: 上記すべて `research/containerssh/src` 内の該当 `file:line`。

## 採用事例の素材

- 公開された ADOPTERS / MAINTAINERS ファイルは repo に無い (GitHub API で `ADOPTERS.md` / `MAINTAINERS.md` ともに 404)。名前の出せる本番採用組織は確認できなかった。捏造しない。
- GitHub シグナル (2026-06-26 時点、GitHub API): stars 3,061 / forks 106 / contributors 21 / open issues 57。Apache-2.0。
- 関連事例として高対話型 honeypot を ContainerSSH で構築した個人プロジェクト `paseaf/ContainerSSH-honeypot` (GCP 上) が存在。組織採用ではない。
- CNCF Slack に `#containerssh` チャンネルがありコミュニティ窓口になっている (README)。

出典: GitHub API、README、`sources.md` 参照。

## 代替・エコシステム

- 隣接/代替: `cowrie` (中対話型 SSH/Telnet honeypot, Python)。honeypot 用途では競合するが、cowrie は擬似シェルでありコンテナを起こさない。ContainerSSH は本物のコンテナに落とす点が本質的に違う。
- `sshpiper` や `gliderlabs/ssh` ベースの自作 SSH ゲートウェイ: SSH proxy/multiplex はできるが、接続ごとの ephemeral コンテナ起動と webhook 認証/設定と監査ログ S3 アップロードまで束ねた製品は少ない。
- `Teleport` (cloud-native access): SSH/k8s への監査付きアクセスという目的は重なるが、Teleport は証明書ベースの access plane で、ContainerSSH は「使い捨てコンテナを生む SSH サーバ」。狙いが違う。
- 統合先: Docker / Kubernetes / Podman (HTTP API を持つ container backend)、別 SSH サーバへの転送 (`sshproxy` backend)、認証/設定 webhook、audit log の S3 アップロード、Prometheus メトリクス、GeoIP、SLSA provenance と `slsa-verifier`。

出典: LWN 記事 (Docker/Podman/Kubernetes backend 言及)、README、`sources.md`。

## 動かす最小手順 (Docker backend)

公式 examples repo の quick-start が最小構成 (ダミー認証とダミー config サーバ込みの docker-compose)。本番では認証サーバを自前で書く前提。

1. examples を取得する。

    ```bash
    git clone https://github.com/ContainerSSH/examples.git
    cd examples/quick-start
    ```

2. docker-compose で起動する。

    ```bash
    docker-compose up -d
    ```

3. SSH で接続する (このサンプルは任意のパスワードを通すテスト用)。

    ```bash
    ssh foo@localhost -p 2222
    ```

4. 後片付けする。

    ```bash
    docker-compose down
    docker-compose rm
    docker image rm containerssh/containerssh-guest-image
    ```

ユーザ名 `busybox` で繋ぐと Busybox コンテナに入る。`foo` はデフォルトのゲスト image。出典: 公式 getting-started <https://containerssh.io/v0.5/getting-started/>。

なお host key 未設定で起動すると、`runContainerSSH` (`main.go:120`) が一時 host key を生成して設定ファイルへ書き戻す (`generateHostKeys`, `main.go:238`)。CLI フラグは `-config` / `-dump-config` / `-licenses` / `-healthcheck` (`getArguments`, `main.go:145`)。
