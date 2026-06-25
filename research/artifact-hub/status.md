# status: Artifact Hub

- [x] recon 完了 @ commit `0d8b1c0b9f6b660a815e5481059ce900cd245588`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: `artifacthub/hub`。これが deep-dive 対象の主実装(Go バックエンド + React フロント + PostgreSQL 関数 + Helm chart)。
- pinned commit は v1.22.0 より後の master。write 段で「post-v1.22.0 master」と書くか、必要なら v1.22.0 tag に pin し直すか要判断。
- カテゴリは指定どおり "App Definition & GitOps" を厳密に使う。
- 採用事例: 引用できる個別企業名は無し。公開インスタンス artifacthub.io が CNCF 運用、という事実のみ確実。write 段で adopter を盛らない。
- 中核として追った代表オペレーション = tracker のリポジトリ tracking(GetRemoteDigest → clone → GetPackagesAvailable → Register → register_package SQL)。write の「内部実装」節はこれを軸にする。
- 非自明設計の目玉 2 つ: (1) ロジックを PL/pgSQL 関数に寄せ Go は JSON を渡すだけ、(2) tracking 時に Keras モデルでカテゴリ推定。
- 数値は 2026-06-24 時点: stars 2,048 / forks 302 / contributor 48。write 時に再確認推奨。
