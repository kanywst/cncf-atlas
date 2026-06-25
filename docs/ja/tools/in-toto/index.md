# in-toto

> ソフトウェアサプライチェーンの各ステップが、計画通り、権限を持つ者によって、改竄されていない成果物に対して実行されたことを検証するフレームワーク。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Graduated
- **言語**: Python (>=3.9)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [in-toto/in-toto](https://github.com/in-toto/in-toto)
- **ドキュメント基準コミット**: `a8ce9ee` (2026-05-19)

## 何をするものか

in-toto はソフトウェアサプライチェーンの完全性を端から端まで守る。プロジェクトオーナーは、チェーンのステップ (タグ付け・ビルド・テスト・パッケージ化) と各ステップを実行する権限を持つ **functionary** を列挙した、署名付きの **layout** を書く。functionary がステップを実行すると、in-toto はどのコマンドが走り、どのファイルが入力され出力されたかを署名付きの **link** ファイルに記録する。リリース時には layout・link 群・オーナーの公開鍵が成果物とともに配布され、`in-toto-verify` が記録されたチェーンと計画されたチェーンが一致するかを確認する (in_toto/in_toto_verify.py:222)。

ここで扱う Python リポジトリは in-toto 仕様のリファレンス実装で、6 本のコマンドラインツールを提供する (pyproject.toml:50)。仕様本体、および Go・Java・Rust への移植は、同じプロジェクト配下の別リポジトリにある。

in-toto はホスティングサービスではなく、フォーマットと検証モデルである。ビルドプロベナンスを in-toto attestation として表現する SLSA のような上位レイヤの下に位置し、署名と透明性ログの問題を解く Sigstore と並んで使われる。

## いつ使うか

- リリースした成果物が、定義した正確なビルドステップ列から生まれ、権限のないステップが差し込まれていないことを暗号的に証明したいとき。
- 個別の CI ステージ (ソース・ビルド・パッケージ) を特定の署名鍵に紐づけ、あるステージの出力が次のステージの入力であることを強制したいとき。
- SLSA プロベナンスを生成・消費しており、その土台となるエンベロープと検証ロジックが欲しいとき。
- 単一の成果物に署名するだけで、複数ステップのチェーンという概念が不要なときには不向き。素の Sigstore や GPG 署名のほうが単純。
- 鍵の配布・失効は管理しない。そこは TUF や Sigstore と組み合わせる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [in-toto/in-toto リポジトリ](https://github.com/in-toto/in-toto)
2. [GitHub API: in-toto/in-toto メタデータ](https://api.github.com/repos/in-toto/in-toto)
3. [CNCF プロジェクトページ: in-toto](https://www.cncf.io/projects/in-toto/)
4. [CNCF: in-toto が Incubator へ (2022)](https://www.cncf.io/blog/2022/03/10/supply-chain-security-project-in-toto-moves-to-the-cncf-incubator/)
5. [CNCF: in-toto の Graduation を発表 (2025-04-23)](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)
6. [InfoQ: CNCF が in-toto を Graduate](https://www.infoq.com/news/2025/06/cncf-intoto/)
7. [NYU CCS: in-toto が CNCF を卒業](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)
8. [Sbomify: What Is in-toto?](https://sbomify.com/2024/08/14/what-is-in-toto/)
9. [USENIX Security 2019: in-toto farm-to-table guarantees](https://www.usenix.org/system/files/sec19-torres-arias.pdf)
10. [in-toto/friends: 連携先と採用組織](https://github.com/in-toto/friends)
11. [reproducible-builds.org tools](https://reproducible-builds.org/tools/)
12. [AquilaX: in-toto vs SLSA vs Sigstore](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa)
13. [SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)
