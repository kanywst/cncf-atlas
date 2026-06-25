# はじめに

> `v1.3.0` と基準コミット `7c27007` で検証済み。コマンドは Go が入った Linux と、名前空間操作のための root を想定。

## 前提

- Linux。CNI は Linux のネットワーク名前空間を設定するため。
- Go 1.21 以上 (`go.mod:3`)。
- root または `CAP_NET_ADMIN`。インターフェースと名前空間の作成は特権操作だから。

CNI は仕様であってビルド済みバイナリの束ではない。最小の動く構成には 3 つが要る。ドライバ (ここでは `cnitool`、または実ランタイム)、1 つ以上のプラグインバイナリ、チェーンを記述する conflist だ。

## インストール

```bash
go install github.com/containernetworking/cni/cnitool@latest
```

`cnitool` は `add` / `check` / `del` / `gc` / `status` サブコマンドを持つ (`cnitool/main.go`, `cnitool/cmd/*.go`)。参照リポジトリの実プラグインバイナリも要る。

```bash
git clone https://github.com/containernetworking/plugins
cd plugins
./build_linux.sh
```

ビルド済みバイナリは `./bin` に出る。`CNI_PATH` をそのディレクトリに向ける。

## 最初の動く構成

`bridge` と `host-local` IPAM のチェーンを作り、新しいネットワーク名前空間を接続する。

1. conflist を書く。conflist は JSON で、`/etc/cni/net.d/10-mynet.conflist` に置く。`name` フィールドは必須で、`validateConfig` が空の name を弾く (`pkg/skel/skel.go:216-229`)。

   ```json
   {
     "name": "mynet",
     "cniVersion": "1.0.0",
     "plugins": [
       {
         "type": "bridge",
         "bridge": "cni0",
         "isGateway": true,
         "ipMasq": true,
         "ipam": {
           "type": "host-local",
           "subnet": "10.22.0.0/16",
           "routes": [
             { "dst": "0.0.0.0/0" }
           ]
         }
       }
     ]
   }
   ```

2. テスト用のネットワーク名前空間を作る。

   ```bash
   sudo ip netns add testing
   ```

3. ADD を実行する。`cnitool` は `/etc/cni/net.d` から `mynet` という名の conflist を読み、その名前空間に対してチェーンを実行する。

   ```bash
   sudo CNI_PATH=./bin NETCONFPATH=/etc/cni/net.d \
     cnitool add mynet /var/run/netns/testing
   ```

コマンドは、割り当てられたインターフェースと 10.22.0.0/16 範囲の IP を含む結果 JSON を表示する。

## 動作確認

同じツールでアタッチメントを確認するか、名前空間を直接見る。

```bash
sudo CNI_PATH=./bin NETCONFPATH=/etc/cni/net.d \
  cnitool check mynet /var/run/netns/testing
sudo ip netns exec testing ip addr
```

名前空間内に、設定したサブネットのアドレスを持つ `eth0` が見えるはずだ。ライブラリはキャッシュ結果を `/var/lib/cni/results/` にも書き、後で DEL と GC が再利用する (`libcni/api.go:252-257`)。

## 次に読むもの

コマンドと結果の完全な契約は仕様を ([SPEC.md](https://github.com/containernetworking/cni/blob/main/SPEC.md))、さらなる例はツールガイドを読む ([cnitool docs](https://github.com/containernetworking/cni/blob/main/Documentation/cnitool.md))。本番ネットワーキングでは参照プラグインではなく Calico や Cilium のような実データプレーンを選び、`cnitool` ではなくランタイム (kubelet / containerd / CRI-O) に CNI を駆動させる。
