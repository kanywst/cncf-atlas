# 歴史

## 起源

bpfman は **bpfd** として始まった。Red Hat の Emerging Technologies グループ発のプロジェクトだ。最初のコミットは 2021 年、GitHub リポジトリの作成は 2021-12-02 (出典: [bpfman/bpfman](https://github.com/bpfman/bpfman)、[Red Hat Emerging Technologies](https://next.redhat.com/project/bpfman/))。解こうとした課題は次のとおり。eBPF プログラムのロードには通常、特権が必要で、各アプリがカーネルフックを単独で占有する。bpfd は、多数のアプリに代わってプログラムをロードし共存させられる単一の管理点を提案した。

README には今も旧名が残る (`README.md:37`):

```text
_Formerly know as `bpfd`_
```

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | bpfd として最初のコミット。GitHub リポジトリ作成は 2021-12-02 |
| 2023 | bpfd から bpfman へ改名。CNCF Sandbox へ応募 (cncf/sandbox issue #76、2023-12-20) |
| 2024 | CNCF Sandbox 受理 (2024-06-19)。daemonless アーキテクチャが入る |
| 2026 | v0.6.0 リリース (2026-03-31)。load と attach が別操作に |

## どう進化したか

重要な転換は 2 つ。1 つ目は改名だ。2023 年末に bpfd から bpfman へ移り、「同じプロジェクトの新しい名前」と位置づけられ、同時に CNCF Sandbox へ応募した (出典: [eBPF wrapped 2023](https://www.redhat.com/en/blog/ebpf-wrapped-2023)、[bpfman blog](https://bpfman.io/main/blog/))。応募文は「特権 Pod なしで eBPF を安全にロードする方法」を主張し、2024-06-19 に受理された (出典: [cncf/sandbox issue #76](https://github.com/cncf/sandbox/issues/76))。

2 つ目は技術的転換で、bpfman は **daemonless** になった。以前の設計は、クライアントが gRPC (gRPC Remote Procedure Call) 経由で話しかける常駐システムデーモンを前提としていた。現在の設計では、コマンドラインインターフェース (CLI) がコアライブラリを自プロセス内で呼び、状態を組込みデータベースに永続化する。ローカル利用にデーモンは不要だ (出典: [eBPF wrapped 2023](https://www.redhat.com/en/blog/ebpf-wrapped-2023))。権限分離が必要な場面のために gRPC サーバは依然として存在するが、任意要素だ。bpfman をシステムデーモンと説明する古い記事は、この変更より前のものだ。

v0.6.0 のもう 1 つの帰結として、load と attach が別操作になった。`load` はプログラムをカーネルに置くだけで、`attach` が後でフックへ結び付ける。両者は load が返すプログラム id で受け渡しする。

## 現在地

bpfman は CNCF Sandbox プロジェクトだ。基準コミット時点の最新リリースは v0.6.0 (2026-03-31)。記載メンテナは全員 Red Hat 所属 (`MAINTAINERS.md`: Dave Tucker、Andrew McDermott、Andre Fredette、Billy McFall。Andrew Stoycos は emeritus)。実質シングルベンダの Sandbox プロジェクトだ。Fedora で bpfman をデフォルトの eBPF プログラムマネージャにする提案も進行中 (出典: [Introduction to BPF Manager / Fedora 40](https://www.ebpf.top/en/post/bpfman_fedora_40/))。
