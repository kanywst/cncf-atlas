# status: Dapr

- [x] recon 完了 @ commit `9f2dcfd95ad44178d9553a08c181b0e6ea46232a` (tag `v1.18.1` 直後)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 主実装は `dapr/dapr` (Go)。CLI `dapr/cli`、コンポーネント `dapr/components-contrib`、SDK 各言語は別リポ。deep-dive の中心はランタイム本体なので `dapr/dapr` でよい。
- shallow clone のため `git describe` は不可。tags を fetch して直近タグが `v1.18.1` と確認。pinned commit はその後の master。
- カテゴリは CNCF landscape の "App Definition & GitOps" にマップ。Dapr は「ランタイム」だが、バケット "Runtime" は CNCF 用語ではコンテナ/ストレージ/クラウドネイティブ実行基盤を指すため、開発者向けアプリ層という性質から "App Definition & GitOps" が最も近い。
- 代表操作はサービス呼び出しを HTTP 入口 -> direct messaging -> リモート内部 gRPC -> 受信側 `CallLocal` まで通した。
- 非自明な設計判断 2 点: (1) ストリーミング有無で replay バッファリングを動的切替、(2) サービス呼び出し入口でのメソッド正規化による ACL バイパス防止。
- 次工程 (write): ビルディングブロックの図、actor / workflow / pub-sub の掘り下げ、Diagrid 商用線との関係を補足するか検討。
