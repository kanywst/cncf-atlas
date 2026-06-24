# 内部実装

> コミット `7977d50` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

コントロールプレーンのロジックを担うディレクトリを挙げる。生成 protobuf と vendor コードは除く。

| パス | 責務 |
| --- | --- |
| `cli/` | `linkerd` CLI。エントリポイント `cli/main.go` がルート cobra コマンドを組み `Execute` を呼ぶ |
| `controller/cmd/` | `os.Args[1]` でディスパッチする単一コントロールプレーンバイナリ |
| `controller/webhook/` | 共通の admission webhook サーバ (TLS、リクエストデコード、ハンドラディスパッチ) |
| `controller/proxy-injector/` | サイドカーを注入する mutating webhook ハンドラ |
| `controller/api/destination/` | gRPC ディスカバリサーバ (`Get`、`GetProfile`) |
| `pkg/identity/` | proxy の CSR に署名する mTLS 認証局 |
| `pkg/inject/` | Helm values から注入レポートと JSON パッチを組む |
| `policy-controller/` | proxy 向けに認可 CRD を解決する Rust サービス |

## 中核データ構造

注入パスは `pkg/inject` のいくつかの型を中心に回る。

- `ResourceConfig` (`pkg/inject/inject.go:120`) は注入の中心。Helm `values`、namespace とそのアノテーション、対象ワークロード (object・meta・owner ref)、pod (meta・labels・annotations・spec) を保持する。
- `podPatch` (`pkg/inject/inject.go:156`) は `l5dcharts.Values` を埋め込み、`PathPrefix` と `AddRoot` フラグを加える。patch チャートのレンダリング入力である。
- `Report` (`pkg/inject/report.go:57`) は注入レポート。`Injectable()` が可否のブール値と、注入できない理由を返す (`pkg/inject/report.go:138`)。
- identity の CA は `Service` 型 (`pkg/identity/service.go`) で、`validator`、`*tls.Issuer`、`issuerMutex` (`*sync.RWMutex`) を保持する。リクエスト処理中でも issuer の証明書をディスクからホットリロードできるようにするためである。

## 追う価値のあるパス

identity サービスの mTLS ブートストラップを追う。proxy は起動時に ServiceAccount トークンと CSR を `Certify` に送る (`pkg/identity/service.go:212`)。サーバは署名前に 3 段階で検証する。

```text
Certify(req)
  checkCSR(csr, reqIdentity)            // service.go:234  CSR の形式が妥当か
  svc.validator.Validate(ctx, tok)      // service.go:241  Kubernetes に対し TokenReview
  if reqIdentity != tokIdentity { ... } // service.go:260  identity がトークンと一致するか
  issuer.IssueEndEntityCrt(csr)         // service.go:269  短命リーフ証明書に署名
```

要求された identity がトークンで証明された identity と一致しない場合、呼び出しは `codes.FailedPrecondition` を返し、証明書は発行されない (`pkg/identity/service.go:260-265`)。3 つの検証をすべて通過して初めて、サーバは mutex のもとで issuer を取り、`issuer.IssueEndEntityCrt(csr)` を呼んでサイドカーが mTLS を話せるようにするリーフ証明書を発行する (`pkg/identity/service.go:268-269`)。

## 読んで驚いた点

proxy injector は JSON パッチを手書きしない。`GetPodPatch` は `podPatch` を YAML にマーシャルし、埋め込みファイルシステムから `patch` Helm チャート (`templates/patch.json`) を読み込んでレンダリングする (`pkg/inject/inject.go:809-828`)。インストール時のテンプレートと実行時のサイドカー注入が、単一のテンプレート経路と単一の `Values` 型を共有する。代償はその直後に現れる。レンダリングされた JSON が不正な末尾カンマを含むことがあり、コードは正規表現 `rTrail` で `},]` を `}\n]` に置換してから返す (`pkg/inject/inject.go:40`、`inject.go:834`)。テンプレートエンジンに JSON Patch を吐かせる選択がこの粗い部分を残す。

webhook サーバはリクエストボディを `util.ReadAllLimit(req.Body, 10*util.MB)` で 10MB に制限し (`controller/webhook/server.go:129`)、空のボディはエラーにせずログして破棄する (`controller/webhook/server.go:136-139`)。

## 出典

- 出典 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- 出典 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)
