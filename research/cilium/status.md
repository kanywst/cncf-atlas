# status: cilium

- [x] recon 完了 @ commit `fe36ad62130243ba43159521bd384ef56d0918f0`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: cilium/cilium (モノレポ。agent + eBPF datapath + operator + Hubble core)。pinned は `main` 先端 `1.20.0-dev`、安定タグ最新は `v1.19.5`。write 段で安定版に言及するなら v1.19 系を基準にする。
- カテゴリは Service Mesh & Networking で確定 (CNI 兼サービスメッシュ兼可観測性だが、ネットワークが主)。
- 端から端まで追ったパス: CNI ADD (`plugins/cilium-cni/cmd/cmd.go:523`) から `CreateEndpoint` (`pkg/endpoint/api/endpoint_api_manager.go:88`) から `Regenerate` (`pkg/endpoint/policy.go:867`) から `regenerateBPF` (`pkg/endpoint/bpf.go:360`) から `ReloadDatapath` (`pkg/endpoint/bpf.go:587`)。
- 非自明な設計判断は ELF テンプレートキャッシュ (`pkg/datapath/loader/cache.go:175`, `template.go:34-93`)。write 段の「設計の妙」セクションの目玉に使える。
- 採用事例は USERS.md 出典のみ列挙済み (174 件、自己申告・production 限定)。捏造なし。Google GKE Dataplane V2 は外部でも広く言及あり。
- 確認保留: コントリビュータ正確数 (contributors API last page 約 1354 は anon 込みで上振れ)。write でカウントを出すなら「800+ 個人コントリビュータ (CNCF graduation 公表値)」を安全側で使う。
- write 段でやること: install 手順を docs.cilium.io でバージョン整合チェックしてから en/ja に書く。
