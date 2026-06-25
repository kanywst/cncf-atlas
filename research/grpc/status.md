# status: gRPC

- [x] recon 完了 @ commit `c697b01a0dec7d704cec73ed72c5bdf4711deda0`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 対象リポは `grpc/grpc` (C-core ベースのマルチ言語実装) に確定。`grpc-go` / `grpc-java` / `grpc-dotnet` は別リポなので deep-dive 本体では C-core を主軸にする
- pinned commit は master HEAD (`v1.81.1` の少し先、`1.83.0-dev`)。タグは指していない。write 段でバージョン表記するなら「v1.81.1 系列、HEAD は 1.83 開発線」と書く
- CNCF 成熟度は Incubating (2026-06 時点)。タスク指定どおり。卒業はしていないので write でも Incubating と書く
- カテゴリは指定どおり Developer Tools 固定
- 推し材料 (write で効く): Stubby 起源の物語、HTTP/2 + protobuf、Call V1/V3 二世代併存という非自明な内部設計、Envoy/xDS/Kubernetes との結合、ConnectRPC との対比
- 採用組織は grpc.io About の 5 社 + Google のみ citable。これ以外を足さない
- 次: atlas-write で en/ja 6 セクション生成 -> tools.ts 登録 -> build/lint
