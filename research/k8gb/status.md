# status: k8gb

- [x] recon 完了 @ commit `34b4535c7642f38876d409ae8f1ba8fb9557c60e`
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- slug `k8gb` / category `Service Mesh & Networking` / maturity `Incubating`
- Internals の主役は `controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:202` `GetExternalTargets`。他クラスタの CoreDNS に `localtargets-<host>` を DNS で問い合わせて状態を共有する
- 戦略 3 種 (`roundRobin` / `geoip` / `failover`) の実装は `applicationDNSEndpoint.go:122-156` の 1 か所に集約。Architecture でここを図にする
- 採用事例は `ADOPTERS.md` の 7 組織のみ
- Getting Started の例は新 API グループ `k8gb.io/v1beta1` を使う (旧 `k8gb.absa.oss` は移行中の遺物)
- 公開先: `docs/tools/k8gb/` と `docs/ja/tools/k8gb/`。カタログ登録済み (Service Mesh & Networking / Incubating)
- Getting Started は `make deploy-full-local-setup` の k3d 遊び場を軸にした。手順は `docs/local.md` から取ったが、実行は未検証
