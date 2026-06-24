# 内部実装

> コミット `65d975b` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/flux/` | Cobra CLI。`bootstrap`、`create`、`get`、`reconcile`、`build` を含む全サブコマンド。 |
| `pkg/bootstrap/` | ブートストラップのオーケストレーション。`Reconciler` インタフェースと plain-git / provider 実装。 |
| `pkg/bootstrap/provider/` | go-git-providers 上の Git provider クライアント (GitHub / GitLab / Gitea / BitBucket)。 |
| `pkg/manifestgen/install/` | `gotk-components.yaml` を生成。 |
| `pkg/manifestgen/sync/` | `gotk-sync.yaml` (自己参照する `GitRepository` と `Kustomization`) を生成。 |
| `pkg/manifestgen/sourcesecret/` | Git / OCI 認証 secret を生成。 |
| `internal/build/` | ローカルの `flux build kustomization` とサーバ側との diff。 |
| `internal/{flags,tree,utils}` | CLI フラグ型、依存ツリー描画、kube クライアントと apply ヘルパ。 |
| `manifests/` | バイナリに埋め込まれるバージョン付きマニフェスト素材。 |

## 中核データ構造

`install.Options` (`pkg/manifestgen/install/options.go:21`) はインストール全体の入力だ。どのコンポーネントか、namespace (`flux-system`)、registry (`ghcr.io/fluxcd`)、watch 範囲、NetworkPolicy、出力 `ManifestFile` (`gotk-components.yaml`)。デフォルトは同ファイルの `MakeDefaultOptions` が与え、4 つのデフォルトコンポーネントと 3 つの extra を設定する (`pkg/manifestgen/install/options.go:46`)。

`sync.Options` (`pkg/manifestgen/sync/options.go`) は自己同期するペアを記述する。`Interval`、`URL`、`Branch`、`Tag`、`SemVer`、`Commit`、`Secret`、`TargetPath`、`SparseCheckout`。デフォルトはすべて `flux-system` と名付ける (`pkg/manifestgen/sync/options.go:44`)。

`sourcesecret.Options` は認証 secret を記述する。SSH 鍵アルゴリズム、token 認証、CA、known_hosts。GitHub ブートストラップパスはここで token 認証か deploy key かを選ぶ (`cmd/flux/bootstrap_github.go:216`)。

`Reconciler` インタフェース (`pkg/bootstrap/bootstrap.go:56`) はブートストラップ全体が回転する契約だ。`ReconcileComponents`、`ReconcileSourceSecret`、`ReconcileSyncConfig`、`Report*Health` を宣言する。`PlainGitBootstrapper` と `GitProviderBootstrapper` が実装し、`Run` は型アサーションでオプション機能 (`RepositoryReconciler`、`ReconcilerWithSyncCheck`) の有無を見てから呼び出す (`pkg/bootstrap/bootstrap.go:103`)。

## 追う価値のあるパス

ブートストラップの心臓部、`ReconcileComponents` (`pkg/bootstrap/bootstrap_plain_git.go:119`) を追う。

作業コピーに HEAD がないときだけ clone し、clone を 2 秒バックオフの 1 回リトライで包む。

```go
b.logger.Actionf("cloning branch %q from Git repository %q", b.branch, b.url)
var cloned bool
if err = retry(1, 2*time.Second, func() (err error) {
    if err = b.cleanGitRepoDir(); err != nil {
        b.logger.Warningf(" failed to clean directory for git repo: %w", err)
        return
    }
    _, err = b.gitClient.Clone(ctx, b.url, repository.CloneConfig{ ... })
```

`install.Generate` でコンポーネントマニフェストを生成し (`pkg/bootstrap/bootstrap_plain_git.go:155`)、それを commit する。commit メッセージはバージョンから組み立てられ (`pkg/bootstrap/bootstrap_plain_git.go:168`)、commit は no-op を許容する。

```go
commit, err := b.gitClient.Commit(git.Commit{
    Author:  b.signature,
    Message: commitMsg,
}, commitOpts...)
if err != nil && err != git.ErrNoStagedFiles {
    return fmt.Errorf("failed to commit component manifests: %w", err)
}
```

commit が成功したら push し、`git.ErrNoStagedFiles` が返ったらコンポーネントは up to date とログする (`pkg/bootstrap/bootstrap_plain_git.go:193`)。その後で初めて命令的 apply を検討し、`mustInstallManifests` でゲートする。

```go
if mustInstallManifests(ctx, b.kube, options.Namespace) {
    b.logger.Actionf("installing components in %q namespace", options.Namespace)
    ...
    if _, err := utils.Apply(ctx, b.restClientGetter, b.restClientOptions, b.gitClient.Path(), componentsYAML); err != nil {
        return err
    }
}
```

`mustInstallManifests` (`pkg/bootstrap/bootstrap.go:140`) は `flux-system` Kustomization が存在しないか `Status.LastAppliedRevision` が空のとき true を返す。これがまさに初回条件だ。

## 読んで驚いた点

命令的な `kubectl apply` は一度しか起きない。初回以降は `flux-system` Kustomization の `LastAppliedRevision` が空でなくなるため `mustInstallManifests` は false を返し (`pkg/bootstrap/bootstrap.go:140`)、以後はクラスタ内の `kustomize-controller` が Flux 自身のコンポーネントを Git からリコンサイルする。CLI はクラスタを直接触らなくなる。

CLI はオフラインで動く。バージョン付きマニフェストは `//go:embed manifests/*.yaml` で埋め込まれ (`cmd/flux/manifests.embed.go:27`)、ネットワーク呼び出しなしでインストール base が手に入る。`install.Generate` は base が欠けているとき GitHub Releases から `manifests.tar.gz` を fetch するフォールバックを保つ (`pkg/manifestgen/install/manifests.go:37`)。

ヘルスチェックはリビジョンを正規化する。`hasRevision` (`pkg/bootstrap/bootstrap.go:268`) は期待リビジョンを Source 系の `status.artifact.revision` と Kustomization の `status.lastAttemptedRevision` に照合し、両方をレガシーリビジョン変換に通すため、古いリビジョン形式でも一致する。
