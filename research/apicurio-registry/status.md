# status: Apicurio Registry

- [x] recon 完了 @ commit `3443acd986a231b5032b0e487b7b5a5ce330fa8d`（近いタグ v3.3.0）
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは Messaging & Streaming で確定。スキーマレジストリとして Kafka/イベントストリーミング文脈が中心（Axual / IBM Event Streams / Libon の Avro 利用）。汎用 API レジストリ（OpenAPI/AsyncAPI）でもあるが採用シグナルの重心は streaming 側。
- 成熟度は CNCF Sandbox。Graduated/Incubating ではない。
- 言語は Java/Quarkus。コードトレースは SQL ストレージ（正典実装）で実施済み。KafkaSQL/gitops/kubernetesops は未トレース、write 時に深掘り不要なら sql のみで十分。
- 非自明ポイント 2 つを write で活かす: (1) content の二重ハッシュ（生 + 正規化）と type 別 ContentCanonicalizer SPI による意味的 dedup、(2) 階層型ルール解決（artifact > group > global > default-global、最も具体的な 1 階層のみ）。
- 3.0.0 GA の正確な日付は releases に `3.0.0` タグが見当たらず未確定（マイルストーン 3.0.0.M3 は 2024-06-17）。write で「3.0 系は 2024 年」と幅を持たせる。
- adopters は全て ADOPTERS.md 由来で citable。捏造なし。
