# 内部実装

> コミット `0d888c2` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/frontend/` | BuildKit が実行するフロントエンドバイナリ。エントリポイントと内部サブコマンド |
| リポジトリルート (`package dalec`) | spec のデータモデルと共通ロジック: `spec.go`、`load.go`、`source*.go`、`artifacts.go`、`tests.go`、generator 群 |
| `frontend/` | ルーター、リクエスト処理、ターゲットフォワーディング、署名 (`MaybeSign`) |
| `targets/linux/rpm/distro/` | RPM distro ハンドラ (Azure Linux・AlmaLinux・Rocky Linux) |
| `targets/linux/deb/distro/` | DEB distro ハンドラ (Debian・Ubuntu) |
| `targets/windows`, `targets/plugin` | Windows ターゲットと外部フロントエンドのフォワーディング |
| `packaging/linux/rpm`, `packaging/linux/deb` | spec → `.spec` / spec → `debian/` の変換と `rpmbuild`/`dpkg` の LLB |

## 中核データ構造

`Spec` (`spec.go:20`) はパース済み YAML のルートである。`Name`・`Version`・`Revision` (`spec.go:22`, `spec.go:29`, `spec.go:32`)、`License` (`spec.go:75`)、`Sources map[string]Source` (`spec.go:56`)、`Patches map[string][]PatchSpec` (`spec.go:63`)、`Build ArtifactBuild` (`spec.go:66`)、`Artifacts` (`spec.go:82`)、`Targets map[string]Target` (`spec.go:85`)、`Dependencies *PackageDependencies` (`spec.go:89`)、`Image *ImageConfig` (`spec.go:95`)、`Tests []*TestSpec` (`spec.go:103`) を持つ。各 distro ハンドラはこの 1 つの構造体から読む。

`Source` (`source.go:31`) はソース種別のタグ付き union だ。`DockerImage`・`Git`・`HTTP`・`Context`・`Build`・`Inline`・`LLB` があり、不変条件はコメントに明記されている。厳密に 1 つだけが非 nil でなければならない (`source.go:33`)。フィルタ用フィールド (`Path`・`Includes`・`Excludes`) は `source.go:46`, `source.go:50`, `source.go:52` にあり、`Generate []*SourceGenerator` (`source.go:65`) が gomod/cargohome/pip のキャッシュ generator を駆動する。カスタム `UnmarshalYAML` (`source.go:70`) が元の YAML ノードを source map として保持する。

`Router` と `Route` (`frontend/router.go:73`, `frontend/router.go:49`) がディスパッチの中核だ。`Route` は `FullPath` (`frontend/router.go:51`)、`gwclient.BuildFunc` 型の `Handler` (`frontend/router.go:54`)、`Info Target` (`frontend/router.go:57`)、任意の `Forward *Forward` (`frontend/router.go:61`) を持つ。

`distro.Config` (`targets/linux/rpm/distro/distro.go:14`) は distro 1 個分の設定だ。`FullName` と `ImageRef` (`distro.go:15`, `distro.go:16`)、`ReleaseVer` (`distro.go:20`)、`BuilderPackages` (`distro.go:23`)、`BasePackages []dalec.Spec` (`distro.go:26`)、`InstallFunc PackageInstaller` (`distro.go:31`)、`CacheName`/`CacheDir` (`distro.go:35`, `distro.go:41`) を持つ。Azure Linux・AlmaLinux・Rocky Linux はそれぞれこの構造体の値であり、これが RPM コードパスの共有を成り立たせている。

RPM の `.spec` ファイルは `specTmpl` (`packaging/linux/rpm/template.go:23`)、すなわち `text/template` から生成される。`Name`・`Version`・`Release`・`License`・`Summary` (`template.go:25`) を埋め、続いて `%description`・`PrepareSources`・`BuildSteps`・`Install`・`Post`・`Files`・`Changelog` の各節を生成する (`template.go:44`)。このテンプレートが、Dalec spec が RPM spec ファイルへ変わる具体的な地点だ。

## 追う価値のあるパス

`azlinux3/container` ターゲットを端から端まで追う。spec → RPM → 最小コンテナである。

```text
HandleContainer(cfg)          targets/linux/rpm/distro/distro.go:125
  -> Config.BuildContainer     container.go:17
       -> Config.BuildPkg      pkg.go:47
            spec.Preprocess    pkg.go:54   ソース generator を実行
            rpm.BuildRoot      pkg.go:58   rpmbuild ツリーを組む
            rpm.Build          pkg.go:70   rpmbuild を LLB として実行
       -> frontend.MaybeSign   pkg.go:72   要求があれば署名
       -> cfg.Install(pkgs)    container.go:68  RPM を /tmp/rootfs へインストール
```

ルートのハンドラは `linux.HandleContainer(cfg)` (`targets/linux/rpm/distro/distro.go:125`) で、`Config.BuildContainer` を呼ぶ (`targets/linux/rpm/distro/container.go:17`)。コンテナのビルドにはまずパッケージが要るので、`Config.BuildPkg` (`targets/linux/rpm/distro/pkg.go:47`) がビルド依存入りの worker イメージを用意し (`pkg.go:50`)、`spec.Preprocess` で spec の generator を実行し (`pkg.go:54`)、`rpm.BuildRoot` で `rpmbuild` ツリーを組み (`pkg.go:58`)、`.spec` のパスを `SPECS/<name>/<name>.spec` に確定し (`pkg.go:60`)、`rpm.Build` で `rpmbuild` を LLB として実行する (`pkg.go:70`)。

署名は結果に上書きする。`frontend.MaybeSign` (`pkg.go:72`) が署名済み state を作り、`st.File(llb.Copy(signed, "/", "/"))` で未署名の出力へコピーする (`pkg.go:76`)。未署名ビルドと署名ビルドは、この上書きステップだけが違う。

`BuildContainer` は続いてパッケージを新しい root ファイルシステムへインストールする。`spec.GetSingleBase(targetKey)` でベースを選び (`container.go:23`)、インストール時リポジトリをマウントし (`container.go:31`)、worker 上で `cfg.Install(pkgs, ...)` を実行して RPM を `/tmp/rootfs` に置き (`container.go:68`)、spec が post-install symlink を宣言していれば `InstallPostSymlinks` を適用し (`container.go:76`)、rootfs state を返す。これらのステップはすべて LLB グラフへの追記であり、BuildKit がそれを並列・キャッシュ付きで solve する。

## 読んで驚いた点

フロントエンドはビルドを一切実行しない。上記の各関数は、完成した成果物ではなく LLB state を返す。`HandleContainer` のチェーン全体がグラフの構築で、実際の `rpmbuild`・インストール・コピーは BuildKit がグラフを solve するときにだけ起きる。この反転こそが、Dalec がビルドサーバを要さず、キャッシュと並列性を BuildKit から無償で得られる理由だ。

プラグイン拡張はレジストリではなくルート上書きである。`Router.Add` は、同じ `FullPath` を持つ後のルートが前のルートを黙って置き換えることを許し、コメントはこれが意図的だと述べる。ターゲットフォワーディングがこれを使ってビルトインを上書きする (`frontend/router.go:79`)。spec が外部フロントエンドを指すとき、その上書きを仕込むのが `WithTargetForwardingHandler` (`frontend/router.go:399`) だ。Dalec の拡張とは、別建てのプラグインテーブルに登録するのではなく、ビルトインのルートを影で覆うことを意味する。

ルーターはすべてのリクエストを `recover` で包む。`Router.Handler` は、あらゆる panic を join されたエラー返却に変える recover を defer する (`frontend/router.go:91`)。そのため、あるターゲットのハンドラのバグは、BuildKit が対話しているフロントエンドプロセスを落とすのではなく、ビルドエラーとして表面化する。
