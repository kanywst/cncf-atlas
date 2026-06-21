# status: in-toto

- [x] recon 完了 @ commit `a8ce9ee2125ae5a4b041a4e37cc1cf10eed0da6b`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pin: `a8ce9ee` (2026-05-19, develop 先端)。近いタグ v3.1.0 (`c82fe5d`)。`__init__.py` の `__version__` は "3.0.0" のままだが hatchling dynamic version なので配布版とは別物。write 時はタグ v3.1.0 を提示しつつ「pin は develop 先端」と明記。
- category = "Supply Chain" / maturity = "Graduated"。
- これは Python リファレンス実装の repo。仕様本体 (in-toto/docs)、attestation framework (in-toto/attestation, ITE-6)、Go/Java/Rust 実装は別 repo。write でフォーマット (in-toto) vs SLSA (要求) vs Sigstore (署名) の層分けを軸にすると整理しやすい。
- 検証トレースの主役は verifylib.py:1484 `in_toto_verify` の 11 段。artifact rule のファイアウォール式キュー (verifylib.py:1022-1032, :1148) が他にない特徴。
- 採用は Datadog (USENIX 論文) が一次資料として最強。Debian/RB、Tekton Chains、GitHub、Sigstore は friends レジストリ。Lockheed Martin も friends 記載のみ。
- stars 1,009 (2026-06-22) は Python repo のみ。エコシステム全体規模は別途。
