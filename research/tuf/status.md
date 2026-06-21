# status: The Update Framework (TUF) / python-tuf

- [x] recon 完了 @ commit `9a3c3046d6ffdc9d90ec21ce5237721bcd985652`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- pin: develop ブランチ HEAD (2026-06-16)。近いタグは v7.0.0 (2026-05-18)。`tuf/__init__.py` の `__version__` は 7.0.0。
- 採用は python-tuf 固有出典のある 3 件 (PyPI/PEP 458, sigstore-python, RSTUF) のみ確定。CNCF/報道が挙げる Amazon/Google/IBM 等は TUF 仕様レベルの採用で、python-tuf 実装とは限らない旨を recon に明記済み。
- GitHub: stars 1711, forks 298, contributors 83 (gh api, 2026-06-22)。
- 次: write 段で en/ja 6 セクション。代表操作はクライアントのメタデータ検証パス (`TrustedMetadataSet` 状態機械 + `verify_delegate` のしきい値署名)。非自明設計は intermediate metadata 許容によるロールバック保護。
