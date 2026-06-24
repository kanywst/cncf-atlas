# 歴史

## 起源

cert-manager は Jetstack の先行ツール kube-lego から生まれた。kube-lego は Let's Encrypt から ACME 経由で TLS 証明書を取得し Kubernetes Ingress に結線するものだった。cert-manager はその置き換えとして書かれた。移行を容易にするため、kube-lego が使っていた `kubernetes.io/tls-acme` アノテーションを引き続き認識する ([出典 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [出典 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/))。

設計上の転換点は、Ingress アノテーションからカスタムリソースとコントローラへの移行だった。cert-manager は `Certificate` と `Issuer` をコントローラがリコンサイルする一級の API オブジェクトにした。Ingress オブジェクトのアノテーションに反応するのではなく、オペレータパターンを採った ([出典 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [出典 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/))。リポジトリは 2017-05-24 に作成され、プロジェクトは 2017 年発足とされる ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | kube-lego の後継として Jetstack でプロジェクト発足 ([出典 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [出典 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)) |
| 2020 | Jetstack を Venafi が買収 ([出典 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)) |
| 2020-11 | CNCF Sandbox に受理 ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)) |
| 2022 | CNCF Incubating に昇格 ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)) |
| 2024-11-12 | CNCF Graduated に昇格。KubeCon NA (Salt Lake City) で発表 ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [出典 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)) |

## どう進化したか

プロジェクトは複数回、組織の手を移った。Jetstack は 2020 年に Venafi が買収し、Venafi は後に CyberArk 傘下となった。商用版は当初 Venafi TLS Protect for Kubernetes だったが、CyberArk Certificate Manager for Kubernetes に改称された ([出典 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/))。

コードベースの identity も変わった。元々の Go import path は `github.com/jetstack/cert-manager` だったが、v1.8 より前にプロジェクト自身の org 配下 `github.com/cert-manager/cert-manager` へ移行した ([出典 1](https://github.com/cert-manager/cert-manager), [出典 7](https://pkg.go.dev/github.com/jetstack/cert-manager))。

## 現在地

cert-manager は CNCF Graduated プロジェクトである ([出典 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/))。Graduation 時点でプロジェクトは 200 以上のリリースと 450 名以上のコントリビュータを報告しており、安定し確立したリリース頻度を示す ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [出典 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/))。開発は `cert-manager/cert-manager` リポジトリで継続しており、ここで基準とする master の `dbc027ee` は `v1.21.0-alpha.1` タグの少し先に位置する ([出典 1](https://github.com/cert-manager/cert-manager))。
