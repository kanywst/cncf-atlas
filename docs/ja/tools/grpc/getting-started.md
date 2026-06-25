# Getting Started

> コミット `c697b01` の `examples/cpp/helloworld/` にある C++ 例に基づく。コマンドは Unix 系シェルを前提とする。

## 前提

- C++ ツールチェーンと、Bazel または CMake (リポジトリの `BUILDING.md` 参照)。
- Protocol Buffers コンパイラ `protoc` と gRPC C++ プラグイン (gRPC のビルドの一部として作られる)。
- 他言語では、README の "To start using gRPC" にある通り、その言語のパッケージマネージャ経由で gRPC を導入する。

## インストール

ほとんどの言語では入口はソースビルドよりパッケージマネージャだ。各言語のクイックスタートが正確なコマンドを示す (<https://grpc.io/docs/languages/>)。C-core と C++ ツールをソースからビルドする場合:

```bash
git clone https://github.com/grpc/grpc
cd grpc
git submodule update --init
```

## 最初に動く構成

最短で動くのは C++ の Hello World だ。サービスを定義し、スタブを生成し、サーバとクライアントを動かす。

ステップ 1、`.proto` ファイルにサービスを定義する。例の IDL は `examples/protos/helloworld.proto:24`:

```text
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

ステップ 2、その `.proto` に対し gRPC C++ プラグイン付きで `protoc` を実行してスタブを生成する。クライアント用 `Greeter::Stub` とサーバ用ベース `Greeter::Service` が出力される。

ステップ 3、サーバを起動する。リッスンポートを追加し、サービスを登録し、サーバを組み立てる (`examples/cpp/helloworld/greeter_server.cc:66`):

```text
builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
builder.RegisterService(&service);
std::unique_ptr<Server> server(builder.BuildAndStart());
```

ステップ 4、クライアントから呼ぶ。channel を作り、stub を作り、メソッドを呼び出す (`examples/cpp/helloworld/greeter_client.cc:88`, `:46`, `:63`):

```text
GreeterClient greeter(
    grpc::CreateChannel(target_str, grpc::InsecureChannelCredentials()));
// stub_ = Greeter::NewStub(channel);
Status status = stub_->SayHello(&context, request, &reply);
```

## 動作確認

生成したサーバを起動し、そのアドレスに対してクライアントを実行する。クライアントは `SayHello` から受け取った応答を出力する。呼び出しが `OK` ステータスを返し期待した挨拶が出れば、channel・stub・サーバが正しく配線されている。

## 次に読むもの

各言語のクイックスタートが他言語とフルビルド手順を扱い (<https://grpc.io/docs/languages/>)、`BUILDING.md` が Bazel と CMake のビルドを扱う。トランスポートセキュリティ、xDS によるロードバランシング、デッドラインといった本番の関心事は、この例で使った insecure credentials ではなく公式ドキュメントに従うこと。
