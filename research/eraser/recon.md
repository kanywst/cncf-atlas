# recon: eraser

調査メモ。自分用の密度。出典は sources.md の番号で対応。読んだ `file:line` は pinned commit 基準。

## 基本情報

- repo: `eraser-dev/eraser` (旧 `Azure/eraser`。git remote は eraser-dev、README ロゴも eraser-dev。(S1)(S3))
- pinned commit: `20576a24c512feb83c26ed867353d4143717d798` / 近いタグ: `v1.5.0-beta.0` (`git describe` = `v1.5.0-beta.0-57-g20576a24`、commit 日 2025-12-02)
- 最新の安定リリース: `v1.4.1` (2025-12-02、Latest)。`v1.5.0-beta.0` は pre-release
- 言語 / ビルド: Go (`go 1.24.0`、`module github.com/eraser-dev/eraser`) / Makefile + Helm chart (`charts/eraser`)。Go ファイル 116 (vendor 除く)
- ライセンス: Apache-2.0 ((S1))
- CNCF 成熟度: Sandbox (2023-06-30 accepted。(S2)(S4))
- カテゴリ (tools.ts の CATEGORY_ORDER から): Security & Compliance
- 一言: 脆弱・不要なコンテナイメージを Kubernetes 全ノードから削除する。実行中イメージは触らない

## 何を解く道具か

kubelet の image GC はディスク使用率 (HighThresholdPercent) で発火し、イメージの脆弱性状態は一切見ない。
結果として脆弱性を含む古いイメージがノードにキャッシュされ続け、ストレージを食うだけでなく攻撃面になる ((S4) の sandbox 申請文)。
Eraser はこれを 2 モードで解く。

- マニュアルモード: 管理者が `ImageList` CRD に消したいイメージ名/ダイジェストを列挙 -> 各ノードで非実行なら削除
- 自動 (scan) モード: 一定間隔で全ノードのイメージを Trivy でスキャンし、閾値を超える脆弱性を持つ非実行イメージを自動削除。スキャンを無効化すると単なる GC として動く ((S1) README)

いずれも「実行中のイメージは絶対に消さない」を CRI 由来の実データで担保するのが肝。

## 歴史の素材

- 2021-05-28 リポジトリ作成 ((S3) createdAt)。初期コミット群は 2021-06-01 (`git log --reverse`: `c428065a` README setup ほか)。Microsoft/Azure 発、AKS チーム由来 ((S4)(S7))
- 2023 前半、AKS の "Image Cleaner" アドオンとして世に出る。OSS 本体と managed アドオンはロードマップを分離運用と明言 ((S4) 申請文、(S9) Microsoft Learn Image Cleaner)
- 2023-06-30 CNCF Sandbox 受理 ((S2) cncf.io project ページ、(S4) cncf/sandbox issue #24)
- 2023-11 KubeCon NA 2023 で "Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes" (Peter Engelbert & Ashna Mehrotra, Microsoft) ((S5)(S6))
- リリース系譜: `v0.1.0` (初タグ) -> `v1.0.0` -> ... -> `v1.4.1` (2025-12) -> `v1.5.0-beta.0`。API は `v1alpha1 -> v1alpha2 -> v1alpha3` と `v1` を保持し、変換で移行 (`api/` 配下に各バージョン + `zz_generated.conversion.go`)
- ガバナンス: リポジトリ名が `Azure/eraser` から `eraser-dev/eraser` へ移り、CNCF 中立オーナーシップへ寄せた ((S1) remote/README ロゴ)。「Azure ではなくコミュニティ所有にしたい」は申請文にも明記 ((S4))

## アーキテクチャの素材

コンポーネント (全部 1 バイナリ `main.go` を subcommand/引数で切替、コンテナとして別ロールで起動)。

- eraser-manager (controller-manager): 常駐。3 つの controller を回す
  - imagelist-controller: `controllers/imagelist/imagelist_controller.go`。`ImageList` CRD を watch
  - imagejob-controller: `controllers/imagejob/imagejob_controller.go`。`ImageJob` CRD を watch し、ノードごとに worker Pod を生成
  - imagecollector-controller: `controllers/imagecollector/imagecollector_controller.go`。scan モードの定期 `ImageJob` を作る
- worker Pod (ノード単位、`RestartPolicyNever`、`NodeName` 固定):
  - collector コンテナ (`pkg/collector`): CRI からノード上の全イメージを集める
  - trivy-scanner コンテナ (`pkg/scanners/trivy`): 脆弱性スキャン。プラグイン差し替え可 (`pkg/scanners/template/scanner_template.go` の `ImageProvider` interface)
  - remover コンテナ (`pkg/remover`): 非実行かつ対象のイメージを CRI 経由で削除
- CRI クライアント (`pkg/cri`): containerd / CRI-O などを CRI API v1 / v1alpha2 のフォールバックで叩く (`client.go:47` `newClientWithFallback`)

CRD (`eraser.sh` group、いずれも cluster-scoped)。

- `ImageList` (`api/v1/imagelist_types.go:20-49`): `spec.images []string` に削除対象。`*` で prune 全削除。status に success/failed/skipped/timestamp
- `ImageJob` (`api/v1/imagejob_types.go:41-72`): 1 回の全ノード掃討ジョブ。status.phase = Running/Completed/Failed、desired/succeeded/failed/skipped、`deleteAfter` (完了後の遅延削除時刻)

### 代表オペレーション: ImageList 適用からノードで削除まで end-to-end

1. ユーザーが名前 `imagelist` の `ImageList` を apply。imagelist-controller の `Reconcile` が発火。名前が固定 `imagelist` 以外は無視 (`imagelist_controller.go:139-144`)
2. 既存の子 `ImageJob` を owner 参照でフィルタ (`:158` `FilterJobListByOwner`)。0 件なら新規イベント経路 `handleImageListEvent` (`:162`)。既に走行中の Job があれば 1 分後 requeue (`:173`)
3. `handleImageListEvent` (`:257`): `spec.Images` を JSON 化して immutable ConfigMap を作成 (`:263-273`)。remover コンテナの `PodTemplateSpec` を組み立て (image/リソース/`SharedSecurityContext`/OTLP env、`:295-342`)。除外用 ConfigMap をボリュームとして合流 (`:362-372`)
4. `ImageJob` を作成 (owner = ImageList、ラベル `imagejob-owner=imagelist-controller`、`:344-374`)。さらに `PodTemplate` オブジェクトを manager Pod owner で作成 (`:395-409`)。ConfigMap の owner を Job に付け替え (`:411-412`)
5. imagejob-controller の `Reconcile` (`imagejob_controller.go:178`) が新 Job (phase 空) を検知して `handleNewJob` (`:294`) へ
6. `handleNewJob`: 全 Node を list (`:295`)、`PodTemplate` を取得 (`:301`)、status.desired = ノード数。NodeFilter (include/exclude、`:336-353`) で対象ノードを選抜、skip 数を status に記録 (`:356`)
7. ノードごとに `copyAndFillTemplateSpec` (`:365`、`:533`) で PodSpec を複製し `NodeName` を固定 (`:582`)、`GenerateName: eraser-<node>-` の Pod を Create (`:363-397`)。ラベルで remover/collector を判別 (`:388-393`)
8. 各 remover Pod は `--imagelist=/run/eraser.sh/imagelist/images` を読み (`imagelist_controller.go:276-278`、mount は `:314-315`)、`pkg/remover/main` が起動
9. remover: `cri.NewRemoverClient` (`remover.go:63`)、`ParseImageList` (`:121`)、`removeImages` (`:140`) の順
10. `removeImages` (`pkg/remover/helpers.go:11`): `ListImages` で全イメージ、`ListContainers` で実行中コンテナを取得。`GetRunningImages` / `GetNonRunningImages` (`pkg/utils/utils.go:129,149`) で「name/digest/id -> 実行中か」の map を構築。対象が nonRunning かつ除外でなければ `DeleteImage`、running なら skip、`*` は prune 全削除 (`helpers.go:66-126`)
11. Pod 完了で imagejob-controller が phase を Completed/Failed に更新。imagelist-controller `handleJobListEvent` (`:179`) が ImageList.status を集計 (`handleJobCompletion:420`)、`deleteAfter` を設定して遅延後に Job と PodTemplate を掃除 (`handleJobDeletion:225`)

設計判断のポイント。

- push 型 fan-out: DaemonSet ではなく「Job からノード数ぶんの単発 Pod」。ノードごとに NodeName 固定 Pod を撒くので、走った Pod は完了後に消える (常駐しない)
- 実行中保護は kubelet ではなく CRI の `ListContainers` 実データで判定。ノード上の真の running set を見る (`helpers.go:45-52`)
- scan は差し替え可能な interface。Trivy は既定実装で、`ImageProvider` (`scanner_template.go:21`) を満たせば別スキャナに置換可能 ((S4) の plugin 主張と一致)
- collector/scanner/remover は 1 Pod 内の複数コンテナで、`shared-data` emptyDir と named pipe (`ScanErasePath` / `EraseCompleteCollectPath` など、`remover.go:80-190`) で受け渡す

## 内部実装の素材

コードマップ (pinned commit)。

- `main.go`: エントリ。manager 起動と controller 登録
- `api/`: CRD 型。`v1` が storage version。`v1alpha1/2/3` + `unversioned` に config 型、`zz_generated.conversion.go` で相互変換
- `controllers/`: imagelist / imagejob / imagecollector / configmap / util。`util/util.go` に owner フィルタ・`IsCompletedOrFailed`・`After` など
- `pkg/cri/`: CRI クライアント。`client.go` に interface、`client_v1.go` / `client_v1alpha2.go` に実装、`newClientWithFallback` (`:47`) で version 判定
- `pkg/remover/`: 削除ロジック本体 (`helpers.go:removeImages`)
- `pkg/collector/`: イメージ収集
- `pkg/scanners/trivy/`: Trivy 実装。`pkg/scanners/template/` が汎用 interface
- `pkg/utils/`: `GetRunningImages` / `GetNonRunningImages` / `IsExcluded` / `ProcessRepoDigests` / security context

中核データ構造。

- `unversioned.Image { ImageID, Names[], Digests[] }` (`api/v1/imagejob_types.go:23-27` の `Image` と同形)。CRI の Image を名前・ダイジェストで引ける正規形に落とす
- running/nonRunning は `map[string]string`: key が (id | name | digest) の全部、value が imageID。1 イメージを id でも tag でも digest でも参照できるように多重登録する (`utils.go:129-170`)

追う価値のあるパス: 実行中イメージ保護 (`pkg/remover/helpers.go:11-97` + `pkg/utils/utils.go:129-170`)。

- `ListContainers` の各コンテナから `container.Image.GetImage()` = imageID を取り、その imageID の Names/Digests もすべて runningImages に登録 (`utils.go:133-146`)。つまり「実行中コンテナが参照する imageID にひもづく名前・digest はすべて running 扱い」
- nonRunningImages は allImages のうち runningImages に無い imageID だけを、同じく id/name/digest の三面で登録 (`utils.go:149-169`)
- 削除ループは targetImages (ユーザー指定 or scan 結果) を 1 つずつ引き、nonRunning map にヒットしたときだけ削除 (`helpers.go:72-88`)。running map にヒットしたら明示 skip ログ (`:90-94`)。どちらにも無ければ「ノードに無い」
- 非自明な点: 実行中/非実行の判定は imageID 単位。あるノードで動いていれば、その imageID に紐づく別 tag 指定でも running 扱いになり消えない。誤削除防止の実装がこの多重 map に集約されている

驚いた点。

- worker は DaemonSet ではなく Job から撒く単発 Pod。完了後に自身と PodTemplate/ConfigMap を owner 参照 + `deleteAfter` で GC。常駐コストを避ける代わりに controller のジョブ寿命管理がやや込み入る (`imagelist_controller.go:179-255`)
- CRI は v1 と v1alpha2 のフォールバックを持ち、古い containerd/CRI-O も掴む (`pkg/cri/client.go:47-94`)
- config は CRD ではなく ConfigMap ベースの `EraserConfig` を `config.Manager` が read する (`api/unversioned/config`)。CRD は ImageList/ImageJob の 2 つだけ

## 採用事例の素材 (出典必須)

- Azure Kubernetes Service "Image Cleaner": AKS の managed アドオンが Eraser を内部利用。`eraser-controller-manager` を配置し collector/trivy-scanner/remover コンテナで unused/vulnerable イメージを掃除、と Microsoft 公式ドキュメントが明記 ((S9) Microsoft Learn)。ただし OSS 本体と managed のロードマップは分離 ((S4))
- GitHub シグナル (2026-07-08、`gh repo view eraser-dev/eraser` (S3)): stars 611、forks 71、contributors 35 (`gh api .../contributors`)、topics に cncf/kubernetes/trivy/security-tools。作成 2021-05-28、最終 push 2026-04-09
- CNCF: (S2) cncf.io の Eraser プロジェクトページに Sandbox として掲載
- 注意: リポジトリに ADOPTERS ファイルは無い (`ls` 確認済み)。名前付き採用組織として確実に引けるのは AKS Image Cleaner のみ。他は出典が無いので載せない

## 代替・エコシステム

- kubelet の image garbage collection: K8s ネイティブ。ディスク使用率閾値で古いイメージを消すが脆弱性・許可リストの概念なし。Eraser はこの穴 (脆弱性ベース + 明示リスト) を埋める ((S4))
- kube-image-keeper (enix): 逆方向の発想で、使用中イメージをキャッシュ/ミラーして registry 障害に備える。削除ではなく保全なので目的が真逆
- Trivy (Aqua、CNCF): Eraser の既定スキャナ。Eraser は Trivy を worker Pod 内で呼ぶ ((S1))。Eraser 側は `ImageProvider` interface で別スキャナに差し替え可能 (`pkg/scanners/template/scanner_template.go:21`)
- 連携面: OTLP メトリクスを export (`pkg/metrics`)、除外リスト ConfigMap、NodeFilter (include/exclude) でノード選抜。scan 無効時は純粋な image GC として動く
