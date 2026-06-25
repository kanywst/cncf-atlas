# sources: Thanos

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | thanos-io/thanos | <https://github.com/thanos-io/thanos> | 2026-06-24 |
| 2 | repo | thanos-io org | <https://github.com/thanos-io> | 2026-06-24 |
| 3 | site | Thanos official site | <https://thanos.io/> | 2026-06-24 |
| 4 | site | Thanos getting started | <https://thanos.io/tip/thanos/getting-started.md/> | 2026-06-24 |
| 5 | blog | TOC approves Thanos from sandbox to incubation | <https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/> | 2026-06-24 |
| 6 | case-study | CNCF project page: Thanos | <https://www.cncf.io/projects/thanos/> | 2026-06-24 |
| 7 | spec | CNCF TAG Security self-assessment | <https://tag-security.cncf.io/community/assessments/projects/thanos/self-assessment/> | 2026-06-24 |
| 8 | talk | Fabian Reinartz and Bartlomiej Plotka: Thanos | <https://www.youtube.com/watch?v=l8syWgJ98sk> | 2026-06-24 |
| 9 | case-study | Wikitech: Thanos | <https://wikitech.wikimedia.org/wiki/Thanos> | 2026-06-24 |
| 10 | repo | go-loser (loser tree source) | <https://github.com/bboreham/go-loser> | 2026-06-24 |
| 11 | spec | K-way merge algorithm (Tournament Tree) | <https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree> | 2026-06-24 |

## コード内アンカー（pin: cc24370）

- `cmd/thanos/main.go:34,56-63` — エントリと全サブコマンド登録
- `pkg/store/proxy.go:52,84,160-161,277-405` — Client / ProxyStore / Series ファンアウト
- `pkg/store/proxy_merge.go:197,228` — NewProxyResponseLoserTree
- `pkg/losertree/tree.go:4-6,14,43-58` — 損者木 k-way merge
- `pkg/store/storepb/rpc.proto:26,39,63` — StoreAPI / Series rpc / SeriesRequest
- `pkg/block/metadata/meta.go:66,77` — Meta / Thanos meta.json
- `src/MAINTAINERS.md` — core maintainers
- `src/LICENSE` — Apache-2.0 実確認
- `docs/quick-tutorial.md:91,133` — sidecar / query 起動例
