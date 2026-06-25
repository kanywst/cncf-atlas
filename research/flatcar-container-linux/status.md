# status: Flatcar Container Linux

- [x] recon 完了 @ commit `d2c217cb741debc9becda0bda86347319f17a65c`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: 主実装は `flatcar/scripts`(SDK ビルド/イメージ合成)。アンブレラ `flatcar/Flatcar` は docs/issue tracker。star はアンブレラ(1197)に集中、scripts は 84。write 段ではこの 2 リポ構成を説明すること
- ライセンス注意: `scripts` は BSD-3-Clause(ChromeOS/CoreOS 由来)、アンブレラは Apache-2.0。混同しない
- pinned commit は `main` HEAD。shallow clone で tag describe 不可。直近 stable は `stable-4593.2.3`(2026-06-16)
- カテゴリは Runtime 固定(verbatim)
- 代表トレース: `build_image` → `create_prod_image` → `start_image`/`emerge_to_image`/`finish_image`。verity root hash をカーネルへ dd で埋め込む箇所(`build_image_util.sh:783-790`)が deep-dive の目玉
- 比較記事の "ext4 /usr" は古い。現コードは btrfs+zstd(`disk_layout.json:25-37`)。write でも btrfs と書くこと
- 更新機構(A/B, Nebraska/Omaha, Ignition)はこの repo にはコードが薄い。詳細は別リポ(update_engine, nebraska, ignition)。write で OS 機構として触れるなら出典は CNCF blog(sources 2)止まり
- 採用事例は ADOPTERS.md(sources 6)記載のみ使う。捏造禁止
- taglineEn: "An immutable, auto-updating Linux distribution purpose-built for running containers."
- taglineJa: "コンテナ運用に特化した、イミュータブルで自動更新される最小構成の Linux ディストリビューション。"
- 次: atlas-write で en/ja 6 セクション化 + tools.ts 登録 + docs:build
