# sources: cert-manager

各出典に番号を振り、`recon.md` の「(出典 N)」と対応させる。アクセス日 2026-06-22。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | cert-manager/cert-manager README | <https://github.com/cert-manager/cert-manager> | 2026-06-22 |
| 2 | docs | Migrating from Kube-LEGO | <https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/> | 2026-06-22 |
| 3 | announcement | CNCF Announces cert-manager Graduation | <https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/> | 2026-06-22 |
| 4 | blog | cert-manager is now a CNCF Graduated Project | <https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/> | 2026-06-22 |
| 5 | comparison | Best Certificate Management Tools 2026 (Infisical) | <https://infisical.com/blog/best-certificate-management-tools> | 2026-06-22 |
| 6 | vendor | CyberArk Certificate Manager for Kubernetes | <https://www.cyberark.com/products/certificate-manager-for-kubernetes/> | 2026-06-22 |
| 7 | pkg | go.dev jetstack/cert-manager (旧 import path) | <https://pkg.go.dev/github.com/jetstack/cert-manager> | 2026-06-22 |
| 8 | blog | Switching from kube-lego to cert-manager | <https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/> | 2026-06-22 |
| 9 | project | CNCF project page: cert-manager | <https://www.cncf.io/projects/cert-manager/> | 2026-06-22 |

## ローカル検証コマンド

- pinned: `git -C research/cert-manager/src rev-parse HEAD` -> `dbc027ee2a7ded1fa109ed63e631ba35cd83b6cf`
- 近いタグ: `git tag --sort=-creatordate` -> `v1.21.0-alpha.1` (2026-06-05)
- stars/fork: `gh repo view cert-manager/cert-manager --json stargazerCount,forkCount` -> 13873 / 2383 (2026-06-22)
- ライセンス: `head LICENSE` -> Apache-2.0
