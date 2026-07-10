# HAMi

> HAMi は、1 枚の物理 GPU をデバイスメモリと演算パーセントで分割共有し、Pod ごとの上限を実行時に強制する。アプリケーションの改変は要らない。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating (2024-08-21 Sandbox 受理、2026-07-02 Incubating 昇格)
- **言語**: Go (`go 1.26.2`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [Project-HAMi/HAMi](https://github.com/Project-HAMi/HAMi)
- **ドキュメント基準コミット**: `2487a24` (master, 2026-07-07, タグ `v2.9.0` の近傍)

## 何をするものか

HAMi (Heterogeneous AI Computing Virtualization Middleware、旧称 `k8s-vGPU-scheduler`) は、1 枚の物理 GPU をシェアに切り分ける Kubernetes アドオンである。Pod は GPU 1 枚に加えて、メモリ上限を MB 単位、演算コアを割合で要求でき、複数の Pod が同じカード上で互いを踏まずに動く。アプリケーションに CUDA の変更や専用ランタイムは不要だ。`nvidia.com/gpumem` や `nvidia.com/gpucores` のようなリソースを要求すれば、その予算に制限されたデバイスが見える (`README.md:71-79`)。

処理は 3 つの層に分かれる。コントロールプレーンのスケジューラが、要求をどの物理 GPU に載せるかを決め、その決定を Pod のアノテーションに書く。各ノードの device plugin が、そのアノテーションを読んで実デバイスに解決し、環境変数とライブラリのマウントをコンテナに注入する。HAMi-core と呼ばれるコンテナ内ライブラリ (`libvgpu.so` として配布) が全プロセスに preload され、メモリ上限とコア制限を CUDA 呼び出し時に強制する。スケジューラと device plugin は本リポジトリの Go コードだが、HAMi-core は別リポジトリ [Project-HAMi/HAMi-core](https://github.com/Project-HAMi/HAMi-core) の C/CUDA ライブラリで、ここでは `libvgpu` サブモジュールとして取り込まれる。

HAMi はベンダ非依存である。NVIDIA が最も完成度の高い経路だが、同じインターフェースが Ascend・Cambricon・Hygon・Metax・Mthreads・Iluvatar なども覆い、各々が 1 つの `Devices` 契約 (`pkg/device/devices.go:36`) を実装する。位置づけとしては Kubernetes スケジューラと kubelet の device-plugin API の間に立ち、どちらも置き換えず両方を拡張する。

## いつ使うか

- 高価な GPU を個々のワークロードが使い切れておらず、複数の Pod で 1 枚を、Pod ごとの実効的なメモリ・演算制限付きで共有したい。
- 複数のアクセラレータベンダにまたがるデバイス共有を、単一のスケジューリングモデルで実現したい。
- アプリを書き換えず、専用のコンテナランタイムも入れずに、GPU の部分要求 (メモリは MB、演算はパーセント) をしたい。
- デフォルトの Kubernetes スケジューラを残したまま GPU 対応の配置を上乗せしたい、あるいはバッチ AI 向けに Volcano と組み合わせたい。
- カードが MIG に対応していてハードウェア分割による隔離が必須要件なら、あまり向かない。HAMi は MIG も駆動できるが、既定モードは preload ライブラリによるソフト隔離で、ハードウェア境界より弱い。
- 学習ジョブやパイプラインのオーケストレータではない。デバイスのスケジューリングと隔離はするが、ジョブキュー・gang scheduling・ワークフロー状態の管理は単体では行わない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと GPU 要求の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [Project-HAMi/HAMi README](https://github.com/Project-HAMi/HAMi/blob/master/README.md) (参照 2026-07-09)
2. [HAMi ソース (固定コミット `2487a24`)](https://github.com/Project-HAMi/HAMi) (参照 2026-07-09)
3. [HAMi プロジェクトページ (CNCF)](https://www.cncf.io/projects/hami/) (参照 2026-07-10)
4. [\[Sandbox\] HAMi, cncf/sandbox Issue #97](https://github.com/cncf/sandbox/issues/97) (参照 2026-07-10)
5. [Exploring cloud native projects in sandbox: 13 arrivals from 2024 H2 (CNCF)](https://www.cncf.io/blog/2025/08/11/exploring-cloud-native-projects-in-sandbox-13-arrivals-from-2024-h2/) (参照 2026-07-10)
6. [HAMi Becomes a CNCF Incubating Project (Dynamia AI)](https://dynamia.ai/blog/hami-cncf-incubating) (参照 2026-07-10)
7. [Project-HAMi/HAMi-core (libvgpu.so 隔離ライブラリ)](https://github.com/Project-HAMi/HAMi-core) (参照 2026-07-10)
8. [SF Technology ケーススタディ (CNCF)](https://www.cncf.io/case-studies/sf-technology/) (参照 2026-07-10)
9. [KE Holdings Inc. ケーススタディ (CNCF)](https://www.cncf.io/case-studies/ke-holdings-inc/) (参照 2026-07-10)
10. [NIO ケーススタディ (CNCF)](https://www.cncf.io/case-studies/nio/) (参照 2026-07-10)
11. [How to use Volcano vGPU (HAMi ドキュメント)](https://project-hami.io/docs/installation/how-to-use-volcano-vgpu) (参照 2026-07-10)
12. [Koordinator: device scheduling GPU share with HAMi](https://koordinator.sh/docs/user-manuals/device-scheduling-gpu-share-with-hami) (参照 2026-07-10)
13. [HAMi 2025 Year in Review (Dynamia AI)](https://dynamia.ai/blog/hami-2025-recap) (参照 2026-07-10)
