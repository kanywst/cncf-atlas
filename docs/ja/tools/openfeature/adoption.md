# 採用事例・エコシステム

## 誰が使っているか

CNCF の Incubating 公表 (2023-12-19) は、OpenFeature の end user として 4 組織を挙げる。flagd リポジトリに `ADOPTERS` ファイルは無いため、本ディープダイブが挙げる採用組織はこれだけで、それ以外は主張しない (4)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| eBay | OpenFeature の end user として明記 | [CNCF ブログ (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| Google | OpenFeature の end user として明記 | [CNCF ブログ (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| SAP | OpenFeature の end user として明記 | [CNCF ブログ (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |
| Spotify | OpenFeature の end user として明記 | [CNCF ブログ (2023-12-19)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) |

複数の flag ベンダーは end user としてではなく、標準そのものを公に支持する: LaunchDarkly / Split / CloudBees / Flagsmith (4)(7)。

## 採用のシグナル

2026-06-24 時点で GitHub API により計測 (11):

- flagd: stars 934、forks 119、open issues 122、リポジトリ作成 2022-05-26。
- open-feature/spec: stars 1,192、forks 55。
- flagd のコントリビュータ: 約 75 名 (GitHub contributors API のページネーションから)。

CNCF 成熟度は Incubating: 2022-06-17 に Sandbox 受理、2023-11-21 に Incubating 昇格を投票 (3)(4)。

## エコシステム

- `open-feature/spec`: SDK が実装する評価 API 仕様 (2)。
- 各言語 SDK: Go / Java / JavaScript / .NET / Python / PHP / Ruby ほか (1)(5)。
- OpenFeature Operator: Kubernetes 上で flagd をサイドカーとして注入する (2)(5)。
- OFREP (OpenFeature Remote Evaluation Protocol): flagd が実装するリモート評価のワイヤプロトコル (1)(12)。
- provider 実装: 各 flag 管理システムを標準 API に接続する (5)。
- 統合: OpenTelemetry の trace / metrics をネイティブに発行 (`flagd/pkg/runtime/from_config.go:67-82`)、Kubernetes CRD sync、クラウド blob ストレージ (S3 / GCS / Azure) (1)(12)。

## 代替候補

OpenFeature は標準なので、本当の「代替」は個々の flag 製品だ。それらの一部は OpenFeature provider も出すため、選択は二者択一ではなく「標準 + バックエンド」になることが多い (5)(7)。

| 代替 | 違い |
| --- | --- |
| LaunchDarkly | 独自 SDK を持つ商用 SaaS。OpenFeature provider を提供するが、単体ではベンダー中立ではない |
| Split | 実験と feature delivery に重点を置く商用 SaaS |
| CloudBees Feature Management | 商用 flag 管理 (旧 Rollout) |
| ConfigCat | 商用ホスト型 flag サービス |
| Unleash | 独自サーバと SDK を持つ OSS のセルフホスト flag プラットフォーム |
| Flagsmith | セルフホスト可能な OSS flag プラットフォーム。OpenFeature を CNCF に提出した |
| GO Feature Flag | OpenFeature と OFREP に統合する OSS の flag ソリューション |
