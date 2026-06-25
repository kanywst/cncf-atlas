# sources: Flatcar Container Linux

各出典に番号を振り、recon / ドキュメント側の引用と対応させる。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | flatcar/scripts (image build and composition scripts) | <https://github.com/flatcar/scripts> | 2026-06-24 |
| 2 | blog | Flatcar brings Container Linux to the CNCF Incubator (CNCF) | <https://www.cncf.io/blog/2024/10/29/flatcar-brings-container-linux-to-the-cncf-incubator/> | 2026-06-24 |
| 3 | project | Flatcar Container Linux (CNCF project page) | <https://www.cncf.io/projects/flatcar-container-linux/> | 2026-06-24 |
| 4 | blog | Flatcar accepted into CNCF at incubating level (Microsoft Open Source) | <https://opensource.microsoft.com/blog/2024/10/29/flatcar-accepted-into-cncf-at-incubating-level/> | 2026-06-24 |
| 5 | proposal | Propose Flatcar for Incubation (cncf/toc PR #991) | <https://github.com/cncf/toc/pull/991> | 2026-06-24 |
| 6 | repo | flatcar/Flatcar ADOPTERS.md | <https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md> | 2026-06-24 |
| 7 | article | Immutable Linux Distros: Fedora CoreOS vs Flatcar vs Talos vs Bottlerocket (HomeLab Starter) | <https://homelabstarter.com/homelab-immutable-os-comparison/> | 2026-06-24 |
| 8 | article | Container-Optimized Linux Distributions Compared (DEV Community) | <https://dev.to/matheus_releaserun/container-optimized-linux-distributions-compared-flatcar-bottlerocket-talos-and-fedora-coreos-4fj2> | 2026-06-24 |
| 9 | blog | Flatcar Container Linux enters new era after CoreOS End-of-Life (Kinvolk) | <https://kinvolk.io/blog/2020/02/flatcar-container-linux-enters-new-era-after-coreos-end-of-life-announcement> | 2026-06-24 |
| 10 | blog | Container Linux: Back on Track with Flatcar (flatcar.org) | <https://www.flatcar.org/blog/2020/05/container-linux-back-on-track-with-flatcar/> | 2026-06-24 |
| 11 | blog | Microsoft acquires Kinvolk to accelerate container-optimized innovation (Azure) | <https://azure.microsoft.com/en-us/blog/microsoft-acquires-kinvolk-to-accelerate-containeroptimized-innovation/> | 2026-06-24 |
| 12 | news | Microsoft acquires Kinvolk, the Berlin-based cloud startup behind Flatcar (GeekWire) | <https://www.geekwire.com/2021/microsoft-acquires-kinvolk-berlin-based-cloud-startup-behind-flatcar-container-linux/> | 2026-06-24 |
| 13 | docs | Flatcar docs: SDK modifying Flatcar | <https://www.flatcar.org/docs/latest/reference/developer-guides/sdk-modifying-flatcar/> | 2026-06-24 |
| 14 | repo | flatcar/Flatcar (umbrella: issues, governance, docs) | <https://github.com/flatcar/Flatcar> | 2026-06-24 |

## コード参照アンカー (pinned commit d2c217cb)

| パス:行 | 内容 |
| --- | --- |
| `src/build_image:189` | `create_prod_image` 呼び出し(prod イメージ生成のエントリ) |
| `src/build_library/prod_image_util.sh:58-211` | `create_prod_image` 本体 |
| `src/build_library/build_image_util.sh:494-530` | `start_image`(GPT format + mount + baselayout emerge) |
| `src/build_library/build_image_util.sh:126-153` | `emerge_to_image`(`--usepkgonly` バイナリ pkg 展開) |
| `src/build_library/build_image_util.sh:779-790` | dm-verity root hash 算出 + カーネルへの埋め込み(非自明設計) |
| `src/build_library/disk_layout.json:9-45` | USR-A/USR-B の A/B レイアウト、btrfs+zstd+verity |
| `src/build_library/disk_util:779-816` | `Verity()`(`veritysetup format` + root hash parse) |
| `src/build_library/disk_util:28-138` | `LoadPartitionConfig` / partitions dict 計算 |
| `src/sdk_container/.repo/manifests/version.txt` | バージョンマニフェスト |
