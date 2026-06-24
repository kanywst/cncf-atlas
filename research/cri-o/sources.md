# sources: CRI-O

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | cri-o/cri-o (GitHub) | <https://github.com/cri-o/cri-o> | 2026-06-22 |
| 2 | repo | ADOPTERS.md | <https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md> | 2026-06-22 |
| 3 | repo | install.md | <https://github.com/cri-o/cri-o/blob/main/install.md> | 2026-06-22 |
| 4 | announcement | CNCF Announces Graduation of CRI-O (2023-07-19) | <https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/> | 2026-06-22 |
| 5 | blog | CNCF to host CRI-O (incubating, 2019-04-08) | <https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/> | 2026-06-22 |
| 6 | blog | Red Hat contributes CRI-O to the CNCF | <https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation> | 2026-06-22 |
| 7 | news | InfoQ: CRI-O Graduates from CNCF (2023-09) | <https://www.infoq.com/news/2023/09/cncf-crio-graduation/> | 2026-06-22 |
| 8 | project page | CRI-O on CNCF projects | <https://www.cncf.io/projects/cri-o/> | 2026-06-22 |
| 9 | blog | OpenShift Container Platform 4 defaults to CRI-O | <https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine> | 2026-06-22 |
| 10 | docs | Oracle Linux Cloud Native Environment: CRI-O | <https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html> | 2026-06-22 |
| 11 | repo | containerd (alternative runtime) | <https://github.com/containerd/containerd> | 2026-06-22 |
| 12 | repo | opencontainers/runc | <https://github.com/opencontainers/runc> | 2026-06-22 |

## path:line アンカー (pinned `68f2617bf26cc328f3d6edb030ed830362f4b76b`)

- entrypoint: `cmd/crio/main.go:1-60`
- Server 構造体: `server/server.go:69-104`
- RunPodSandbox: `server/sandbox_run.go:68`, `server/sandbox_run_linux.go:409,535,1294,1350,1372,1489,1587`
- RuntimeImpl interface: `internal/oci/oci.go:60-86`, `RuntimeType` `:184`
- conmon 起動: `internal/oci/runtime_oci.go:145-160,217`
- Container 構造体: `internal/oci/container.go:44`
- Sandbox 構造体: `internal/lib/sandbox/sandbox.go:33`
- version: `internal/version/version.go:6`
- build: `Makefile:183,212-213`
- license: `LICENSE:1-3`
- scope / deps: `README.md:102-119`
