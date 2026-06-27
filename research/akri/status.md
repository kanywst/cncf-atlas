# status: Akri

- [x] recon 完了 @ commit `604bdcb6a575073f32d72f63147b048242ae8032`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 近いタグ `v0.13.8` (`git describe` = `v0.13.8-52-g604bdcb`)。全リリースが pre-release (1.0 未満)。ワークスペース版数は `0.13.26`。
- カテゴリは Orchestration & Scheduling。device plugin framework を拡張してデバイスを広告し broker をスケジュールする性質から。Runtime とも迷うが、コンテナランタイム層ではなくスケジュール/広告層なので Orchestration & Scheduling。
- 採用組織は確証できず。`ADOPTERS.md` はあるが Adopters List は空。write 段階でも名前付き採用を捏造しない。GitHub シグナル (stars 1250 / forks 165 / contributors 46、2026-06-26) を使う。
- 非自明な設計: `device_hash` の shared/local 分岐 (共有は id のみ、ローカルはノード名連結) と CDI v0.6.0 への移行。write の architecture/internals で軸にする。
- tagline 候補: en = "Discover edge leaf devices and expose them as native Kubernetes resources."、ja = "エッジの leaf デバイスを自動発見し、Kubernetes のネイティブリソースとして公開する。"
