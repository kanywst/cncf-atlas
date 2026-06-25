# cert-manager

> ACME・Vault・Venafi・プライベート CA から X.509 証明書を発行・更新し、Kubernetes ネイティブなリソースとして扱う Kubernetes コントローラ。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Graduated
- **言語**: Go (`go 1.26.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cert-manager/cert-manager](https://github.com/cert-manager/cert-manager)
- **ドキュメント基準コミット**: `dbc027ee` (master, 2026-06-19, タグ `v1.21.0-alpha.1` 付近)

## 何をするものか

cert-manager は Kubernetes 内部で TLS 証明書管理を自動化する。`Certificate`・`Issuer`・`ClusterIssuer` といったカスタムリソースを追加し、設定したソースから証明書を取得して Kubernetes Secret に保存するコントローラを動かす。証明書が有効期限に近づくと、運用者の操作なしにコントローラが更新する。

複数の発行バックエンドを 1 つの共通モデルで扱う。ACME プロトコル (Let's Encrypt と互換 CA)、HashiCorp Vault PKI、Venafi と CyberArk、クラスタ内 CA または自己署名。どのバックエンドが署名したかに関わらず、ワークロードは同じ形の Secret を消費する。

典型的なスタックでは Ingress コントローラや Gateway API の背後に位置し、それらのエッジが TLS を終端するための証明書を供給する。Kubernetes におけるクラスタ内証明書自動化の事実上の標準である。

## いつ使うか

- Kubernetes 上でワークロードを動かし、TLS 証明書を自動で発行・更新したい。
- Let's Encrypt など ACME CA を使い、HTTP-01 / DNS-01 チャレンジをクラスタ内で解きたい。
- Vault、プライベート CA、Venafi といった内部 PKI (Public Key Infrastructure) があり、Kubernetes ネイティブな単一の消費方法が欲しい。
- Ingress や Gateway API で TLS を終端し、アノテーションや参照で証明書を結線したい。

証明書が Kubernetes の外側にある場合は不向きで、ホストレベルの ACME クライアントの方が単純である。信頼バンドルをワークロードへ配布する機能は単体では持たない。それは姉妹プロジェクト trust-manager の役割である。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cert-manager/cert-manager README](https://github.com/cert-manager/cert-manager)
2. [Migrating from Kube-LEGO](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/)
3. [CNCF Announces cert-manager Graduation](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)
4. [cert-manager is now a CNCF Graduated Project](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)
5. [Best Certificate Management Tools 2026 (Infisical)](https://infisical.com/blog/best-certificate-management-tools)
6. [CyberArk Certificate Manager for Kubernetes](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)
7. [go.dev: jetstack/cert-manager (旧 import path)](https://pkg.go.dev/github.com/jetstack/cert-manager)
8. [Switching from kube-lego to cert-manager](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)
9. [CNCF project page: cert-manager](https://www.cncf.io/projects/cert-manager/)
