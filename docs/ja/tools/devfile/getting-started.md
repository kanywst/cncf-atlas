# はじめに

> `devfile/api` のコミット `368ea4e` (タグ `v2.3.0` 近傍) で検証済み。`devfile/api` は仕様と Go ライブラリであって実行可能なサーバではないため、この手順では devfile を書き、ライブラリで親の override を適用する。

## 前提

- Go 1.24 以降 (モジュールは `go.mod` で `go 1.24` を宣言)。
- モジュール取得のための Git。

## インストール

モジュールを Go プロジェクトに追加する。インストールするバイナリはなく、ライブラリを消費する。

```bash
go mod init devfile-demo
go get github.com/devfile/api/v2@v2.3.0
```

## 最初の動く構成

目標は、親 devfile の override が基底 devfile に適用される様子を見ることである。これが `pkg/utils/overriding` ライブラリが行う中核操作である。

1. コンテナ component を 1 つ持つ基底 devfile を書く。`base.yaml` として保存する。

   ```yaml
   schemaVersion: "2.3.0"
   metadata:
     name: demo
   components:
     - name: tools
       container:
         image: quay.io/devfile/universal-developer-image:latest
         memoryLimit: 512Mi
   ```

1. 既存の `tools` component のメモリ上限を引き上げる親 override を書く。`parent.yaml` として保存する。override は基底に既に存在する要素しか変更できず、ここで新しい component を名指しすると拒否される。

   ```yaml
   components:
     - name: tools
       container:
         memoryLimit: 1Gi
   ```

1. 短い Go プログラムで override を適用する。`main.go` として保存する。

   ```go
   package main

   import (
       "fmt"
       "os"

       "github.com/devfile/api/v2/pkg/utils/overriding"
       "sigs.k8s.io/yaml"
   )

   func main() {
       base, _ := os.ReadFile("base.yaml")
       parent, _ := os.ReadFile("parent.yaml")

       merged, err := overriding.OverrideDevWorkspaceTemplateSpecBytes(base, parent)
       if err != nil {
           panic(err)
       }

       out, _ := yaml.Marshal(merged)
       fmt.Print(string(out))
   }
   ```

1. 実行する。

   ```bash
   go mod tidy
   go run main.go
   ```

## 動作確認

出力される結果には、`tools` コンテナが `memoryLimit: 1Gi` を持つはずである。基底の上に override で適用された値である。

```yaml
components:
- container:
    image: quay.io/devfile/universal-developer-image:latest
    memoryLimit: 1Gi
  name: tools
```

override が新規要素を拒否することを確かめるには、`parent.yaml` の component 名を基底に存在しないもの (例えば `extra`) に変えて再実行する。`OverrideDevWorkspaceTemplateSpecBytes` はエラーを返す。`ensureOnlyExistingElementsAreOverridden` が、基底にないキーを足す patch を拒むからである (`pkg/utils/overriding/overriding.go:133`)。

## 次に読むもの

- 実際の `devfile.yaml` を解析し `parent` を解決しレジストリからスタックを取得するには `devfile/library` を使う。`devfile/api` は意図的に、型と override・merge・union・validation のヘルパで止まっている。
- devfile を Kubernetes 上の実ワークスペースとして動かすには、Eclipse Che と OpenShift Dev Spaces の下回りである `devfile/devworkspace-operator` を見る。
- フォーマットの完全なリファレンスは devfile.io ドキュメントと、リポジトリの `schemas/latest/` 以下に生成された JSON スキーマを参照。
