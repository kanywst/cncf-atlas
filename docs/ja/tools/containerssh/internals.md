# 内部実装

> コミット `ce7d2b6` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | 実体のエントリポイント: `Main()` (`main.go:26`)、引数パース (`getArguments`, `main.go:145`)、host key 生成 (`main.go:238`)。 |
| `factory.go` | 入れ子ハンドラスタックを内側から外側へ組み立てる (`New`, `factory.go:22`; 順序は `factory.go:54-78`)。 |
| `internal/sshserver/` | TCP リスナ、SSH プロトコル、全層が実装するハンドラインターフェース (`handler.go`)。 |
| `internal/backend/` | ブリッジ層: 接続ごとの設定ロード、バックエンド選択、security overlay の適用 (`handler.go`)。 |
| `internal/config/` | 設定ローダ。HTTP config webhook クライアントを含む (`loader_http.go`)。 |
| `internal/auth/` | 認証 webhook クライアントと、組み込みの OAuth2 / OIDC・Kerberos (`webhook_client_impl.go`, `oauth2_oidc.go`, `kerberos.go`)。 |
| `internal/docker/` | Docker backend: 接続ごとのコンテナライフサイクルと、チャンネルごとのプログラム実行。 |
| `config/` | ルートの `AppConfig` 型とその検証 (`appconfig.go`)。 |

## 中核データ構造

- `config.AppConfig` (`config/appconfig.go:11`) は全設定のルート。config webhook が接続ごとにその一部を動的に差し替える。
- `sshserver.Handler` と `NetworkConnectionHandler` (`internal/sshserver/handler.go:19`, `:97`) は、接続・認証・セッションチャンネルの各段に対応するインターフェース階層。全バックエンドと全 integration 層がこの同じ契約を実装する。
- `sshserver.AuthResponse` (`internal/sshserver/handler.go:35`) は 3 値の enum: `Success`, `Failure`, `Unavailable`。`Unavailable` は認証バックエンドが落ちていることを表し、資格情報の失敗とは意図的に区別する。
- `backend.networkHandler` (`internal/backend/handler.go:52`) は接続と、選ばれたバックエンドへの委譲先 (`backend sshserver.NetworkConnectionHandler`) を握り、`OnDisconnect` と `OnShutdown` を一元化する。
- `docker.channelHandler` (`internal/docker/handler_channel.go:16`) は 1 つの SSH session channel を 1 つのコンテナ内プログラム実行に対応させ、`exec dockerExecution` と `pty`/`rows`/`columns`/`env` 状態を保持する。

## 追う価値のあるパス

Docker backend の接続を、デフォルトの `connection` 実行モードで、ハンドシェイクから切断まで追う。

1. SSH ハンドシェイク成功後、`docker.networkHandler.OnHandshakeSuccess` (`internal/docker/handler_network.go:52`) がタイムアウト付きの `ContainerStart` context を開き、Docker client を用意し (`setupDockerClient`, `internal/docker/handler_network.go:153`)、image を pull する (`pullImage`, `internal/docker/handler_network.go:144`)。
2. 接続用ラベル (`containerssh_connection_id`, `containerssh_ip`, `containerssh_username`) を組み、`connection` モードでは接続用にコンテナをちょうど 1 つ作って起動し (`internal/docker/handler_network.go:88-95`)、`meta.GetFiles()` の中身をコンテナへ書き込む (`internal/docker/handler_network.go:97-108`)。
3. クライアントが session channel を開くと、`sshConnectionHandler.OnSessionChannel` (`internal/docker/handler_ssh.go:33`) が `channelHandler` を返す。
4. `shell`, `exec`, `subsystem` 要求は `channelHandler.OnShell` (`internal/docker/handler_channel.go:199`) か `OnExecRequest` (`internal/docker/handler_channel.go:187`) を呼び、どちらも `run` (`internal/docker/handler_channel.go:80`) を呼ぶ。
5. `run` は実行モードで分岐する (`internal/docker/handler_channel.go:91`)。`connection` モードでは `handleExecModeConnection` (`internal/docker/handler_channel.go:129`) が、既に動いているコンテナに対し `createExec` (`docker exec` 相当) を行う。`session` モードでは `handleExecModeSession` (`internal/docker/handler_channel.go:147`) が session ごとに新コンテナを起動し、プログラムをそのコンテナの主プロセスにする。
6. `c.exec.run(...)` (`internal/docker/handler_channel.go:108`) が SSH channel の stdin/stdout/stderr をコンテナ I/O に直結し、プログラム終了時に `session.ExitStatus` を返す。
7. 切断時、`networkHandler.OnDisconnect` (`internal/docker/handler_network.go:164`) が `container.remove` を呼びコンテナを破棄する。

```text
OnHandshakeSuccess (コンテナ create+start)    handler_network.go:52,88-95
  OnSessionChannel -> channelHandler          handler_ssh.go:33
    OnShell/OnExecRequest -> run              handler_channel.go:199,187,80
      run が exec モードで分岐                 handler_channel.go:91
        connection: handleExecModeConnection  handler_channel.go:129  (docker exec)
        session:    handleExecModeSession     handler_channel.go:147  (新コンテナ, PID 1)
      c.exec.run が stdio を接続, exit を返す   handler_channel.go:108
OnDisconnect (container.remove)               handler_network.go:164
```

`parseProgram` (`internal/docker/handler_channel.go:64`) は要求コマンドの解釈を決める: 先頭が `/`, `./`, `../` で始まればそのまま argv、そうでなければ `/bin/sh -c <program>` で包む。

これと並べて認証 webhook クライアントも見ておく価値がある。`internal/auth/webhook_client_impl.go` が endpoint `/password` (`webhook_client_impl.go:68`), `/pubkey` (`:92`), `/authz` (`:47`) を組み、パスワードは送る前に base64 エンコードされる (`webhook_client_impl.go:73` 付近)。これにより資格情報の検証をサーバから完全に切り離し、任意の IdP・データベース・LDAP ディレクトリを webhook の背後に置ける。

## 読んで驚いた点

- **enum 1 個が ContainerSSH を 2 つの別物にする。** Docker backend は 2 つの実行モードを持つ (`config.DockerExecutionModeConnection` 対 `DockerExecutionModeSession`, `internal/docker/handler_channel.go:91-95`)。`connection` モードでは SSH 接続ごとに 1 コンテナで、各チャンネルは `docker exec` でそこに入るので、複数セッションが状態を共有でき PTY も agent forwarding も動く (`setupAgent`, `internal/docker/handler_ssh.go:127`)。`session` モードでは session channel ごとに新コンテナを起動し、ユーザのプログラムを PID 1 にする。隔離は強いが、port と agent forwarding は `setupAgent` 内で明示的に弾かれる (`internal/docker/handler_ssh.go:185`)。honeypot は強隔離の `session` モード、ラボ・デバッグは使い勝手の `connection` モードを欲しがる。この 1 個の分岐が、同じサーバを両方にする。
- **認証バックエンドの不可用はログイン失敗ではない。** `AuthResponse` は別値 `Unavailable` を持ち (`internal/sshserver/handler.go:35`)、認証サービス障害を資格情報エラーとは別に扱い、汎用の拒否に潰さない。
- **config server が構成されると設定検証は意図的にスキップされる。** `AppConfig.Validate` は `ConfigServer.URL != "" && !dynamic` のときバックエンド検証をスキップする (`config/appconfig.go:103`)。バックエンド設定は静的ファイルではなく接続時に config webhook から来る前提だからだ。
- **サーバは初回起動時に自分の host key を生成する。** host key が未設定だと `runContainerSSH` (`main.go:120`) が一時 host key を生成し、設定ファイルへ書き戻す (`generateHostKeys`, `main.go:238`)。
