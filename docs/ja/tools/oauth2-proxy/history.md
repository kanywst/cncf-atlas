# 歴史

## 起源

OAuth2 Proxy は 2014 年頃に Bitly で `google_auth_proxy` として始まった。社内ツールを Google ログインの背後に置く小さなプロキシだった。その後より多くのプロバイダに対応するよう一般化され、OAuth2 Proxy に改名された。この系譜と Bitly 起源は、プロジェクトに関する第三者の記事 (出典 4) とプロジェクト README (出典 5) に記録されている。

現プロジェクトの祖先にあたるコードは `bitly/oauth2_proxy` リポジトリで、これは活発にメンテされなくなっていた。そこからコミュニティ fork が開発を引き継いだ。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | Bitly で `google_auth_proxy` として作成。後に一般化され `oauth2_proxy` に改名。 |
| 2018 | `bitly/oauth2_proxy` から `pusher/oauth2_proxy` へ fork。v3.0.0 系以降はこの fork に属し、元と分岐している。 |
| 2020 | リポジトリが `pusher/oauth2_proxy` から独立 org の `oauth2-proxy/oauth2-proxy` へ改名。イメージは `quay.io/oauth2-proxy/oauth2-proxy` へ、バイナリ名は `oauth2-proxy` に。 |
| 2025 | 2025-10-02 に CNCF Sandbox 受理。 |

## どう進化したか

最も大きな転換はコードではなくガバナンスだった。メンテナンスは単一企業 (Bitly) から Pusher がホストするコミュニティ fork へ、さらに 2020 年に独立した `oauth2-proxy` GitHub org へと移った (出典 5)。改名でバイナリ名 (`oauth2_proxy` から `oauth2-proxy`) とイメージレジストリが変わったため、移行はすべての運用者に見える形だった。

2025 年 10 月にプロジェクトは CNCF Sandbox 入りした。sandbox 申請 (出典 3) では、その動機を採用拡大ではなく、中立な財団の下での長期サステナビリティと明確で安全なオーナーシップと位置づけている。onboarding は別途追跡されている (出典 4)。

設定は時間とともに 2 つの並行経路に育った: 元からのフラグ + TOML 系と、新しい「alpha」YAML 系だ。ローダは今もまず legacy オプションを読み、alpha config が与えられればその上に重ねる (`main.go:84` 以降の `loadConfiguration`)。

## 現在地

タグ付きリリースは定期的に出ている。基準コミット時点で最新は v7.15.3 (2026-06-09) で、pin した `master` HEAD はその数コミット後だ。Go モジュールは `github.com/oauth2-proxy/oauth2-proxy/v7` (`go.mod:1`)、ビルドは静的な `CGO_ENABLED=0` バイナリ (`Makefile:55-56`)。現在は独立したメンテナ群と広いコントリビュータ層を持つ CNCF Sandbox プロジェクトだ ([採用事例](./adoption) 参照)。
