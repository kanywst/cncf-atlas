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
- Getting Started は 2026-09-08 に `make deploy-full-local-setup` を実際に回して検証。クラスタ 3 つの起動と `Gslb` / `DNSEndpoint` の確認、operator ログの `Final target list` までは動く
- arm64 (Apple Silicon) では `dig` 系がすべて空。原因は edgedns の `internetsystemsconsortium/bind9:9.21` が amd64 単一アーキで、qemu 下で segfault すること。BIND が死ぬ → external-dns が RFC2136 で NS 委譲を書けない → ゾーンが委譲されない → CoreDNS が何も返さない、という連鎖。ページに事実として記載済み
- VM は 2 CPU / 4GB では足りない (Helm 中に API サーバの TLS handshake timeout)。`fs.inotify.max_user_instances` の既定 128 も k3s の `too many open files` を招く。どちらもページに記載済み
