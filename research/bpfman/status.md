# status: bpfman

- [x] recon 完了 @ commit `8e5a9d296a570dfacc3ed748b5e1639cebbc5d55` (近接タグ `v0.6.0`)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは Runtime で確定。eBPF プログラムのロード/アタッチのライフサイクル管理層であり、用途中立。Observability/Security ではなく、それらを支える下層。
- write 段で強調すべき非自明点 2 つ: (1) v0.6.0 は daemonless で CLI が lib をプロセス内直呼び、状態は tmpfs 上の sled DB (`/run/bpfman/db`)。(2) XDP/TC のディスパッチャパターンで「1 IF に複数 eBPF プログラム」を実現 (スロット 10 固定、優先度順)。
- 注意: Web 上の解説や CNCF 応募文 (#76) は今も「system daemon + gRPC」と書くものが多い。実コード (v0.6.0) は daemonless が既定で gRPC (`bpfman-rpc`) は k8s/権限分離用の任意経路。write でここを混同しない。
- adopter は名指しできる一次情報なし。ADOPTERS ファイル無し。GitHub シグナル (stars 748 等 @2026-06-26) と Red Hat 単独メンテナ体制で記述する。捏造しない。
- ライセンスは Apache-2.0 が本体だが、カーネルにロードする dispatcher の .bpf.c は GPL-2.0 / BSD-2-Clause。deep-dive で 1 行触れる価値あり。
- 数値 (CNCF page の contributors 184 等) は集計対象が不明瞭。引用するなら「CNCF 集計」と明記、コア repo の API 値 (748 stars) を主に使う。
