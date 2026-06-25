# sources: Artifact Hub

各出典に番号を振り、recon / ドキュメント側の記述と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | artifacthub/hub (GitHub) | <https://github.com/artifacthub/hub> | 2026-06-24 |
| 2 | repo | README (機能 / 対応 kind / 自己ホスト) | <https://github.com/artifacthub/hub/blob/master/README.md> | 2026-06-24 |
| 3 | repo | architecture.md (層構造 / コンポーネント) | <https://github.com/artifacthub/hub/blob/master/docs/architecture.md> | 2026-06-24 |
| 4 | repo | repositories.md (リポジトリ登録 / 索引仕様) | <https://artifacthub.io/docs/topics/repositories/> | 2026-06-24 |
| 5 | blog | Artifact Hub becomes a CNCF incubating project (起源 / 沿革 / メンテナ数 / ライセンス) | <https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/> | 2026-06-24 |
| 6 | case-study | Artifact Hub プロジェクトページ (CNCF) | <https://www.cncf.io/projects/artifact-hub/> | 2026-06-24 |
| 7 | blog | CNCF Artifact Hub, a One-Stop Shop for Cloud Native Config (The New Stack) | <https://thenewstack.io/cncf-artifact-hub-a-one-stop-shop-for-cloud-native-config/> | 2026-06-24 |
| 8 | repo | リリース v1.22.0 (直近タグ付きリリース) | <https://github.com/artifacthub/hub/releases/tag/v1.22.0> | 2026-06-24 |

## ローカル一次情報(pinned commit `0d8b1c0`)

| 種別 | パス | 内容 |
| --- | --- | --- |
| code | `cmd/hub/main.go:35-161` | API サーバ entrypoint / DI / ディスパッチャ |
| code | `cmd/tracker/main.go:93-148` | tracker のリポジトリ走査ループ |
| code | `internal/tracker/tracker.go:34-217` | tracking の中核 `Run()` と clone 分岐 |
| code | `internal/tracker/helpers.go:92-138` | kind → TrackerSource の dispatch |
| code | `internal/tracker/source/helm/helm.go:119-268` | Helm source の取得 / パッケージ生成 |
| code | `internal/pkg/manager.go:43,243-319` | パッケージ登録と DB 関数呼び出し |
| code | `database/migrations/functions/packages/register_package.sql` | 登録ロジック本体 (PL/pgSQL) |
| code | `internal/hub/pkg.go:65-149` | `Package` / `PackageCategory` 構造体 |
| code | `internal/hub/repo.go:50-315` | `RepositoryKind` 定数 / `Repository` 構造体 |
| code | `internal/hub/tracker.go:37-55` | `TrackerSource` インタフェース / 入力 |
| code | `internal/scanner/alerts.go:10` | Trivy 連携 |
| meta | `LICENSE`, `go.mod:3` | Apache-2.0 / Go 1.26.1 |
