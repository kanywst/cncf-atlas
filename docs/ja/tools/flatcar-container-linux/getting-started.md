# 入門

> 2 つの道がある。公開済みの Flatcar イメージを動かすか、コミット `d2c217c` の `flatcar/scripts` から自分でビルドするか。コマンドは Docker と Linux ホストを前提とする。

## 前提

- 実行向け: サポート対象クラウド（AWS, Azure, GCP）のアカウント、または raw イメージ用の QEMU/ベアメタルホスト。
- ビルド向け: Docker、Linux ホスト、特権コンテナを動かせること（ビルドは loop device を使う、`README.md:89`）。
- 初回ブート構成用の Ignition 設定（YAML の Butane 設定から transpile する）。

## インストール

多くのユーザは Flatcar をビルドしない。公開イメージをブートして Ignition で構成する。ソースからビルドする場合は scripts リポジトリを clone する。

```bash
git clone https://github.com/flatcar/scripts.git
cd scripts
```

## 最初の動作セットアップ

最短の実用的な道は、公開イメージを Ignition 設定でブートすることだ。ビルドシステム自体を動かすには、SDK コンテナ内で次の手順を行う。

1. `/dev` への特権アクセス付きで SDK コンテナを起動する。イメージビルドで使う loop device に必要だ（`README.md:89`）。

   ```bash
   docker run -ti --privileged -v /dev:/dev \
       ghcr.io/flatcar/flatcar-sdk-all:3033.0.0
   ```

1. コンテナ内で、ボード向けのバイナリパッケージをビルドする。

   ```bash
   ./build_packages --board=amd64-usr
   ```

1. プロダクションイメージをビルドする。[アーキテクチャ](./architecture)で説明した `create_prod_image` フローが走る（`src/build_image:189`）。

   ```bash
   ./build_image --board=amd64-usr prod
   ```

1. 汎用イメージを実行可能な VM イメージへ変換する。

   ```bash
   ./image_to_vm.sh --from=<image-dir> --board=amd64-usr
   ```

## 動作確認

ビルドはイメージと並んで `version.txt` を書き出す（`src/build_image:211-221`）。期待する `FLATCAR_VERSION` と `FLATCAR_BUILD_ID` が含まれることを確認する。ブート済みの Flatcar ホストでは `/usr` は読み取り専用でマウントされ dm-verity で保護されるため、そこへの書き込みは失敗するはずだ。コンテナワークロードは出荷される containerd/docker ランタイムで動く。

## 次に読むもの

- 公式ドキュメント [`flatcar.org/docs`](https://www.flatcar.org/docs/latest/) は本番向けの事項（更新チャネル、Ignition リファレンス、クラウド固有のプロビジョニング）を扱う。
- パッケージを改変するなら、ebuild を変更する前に `coreos-overlay` と `portage-stable` の役割分担を読むこと（`README.md:41-44`）。
