# Getting Started

> Based on the C++ example under `examples/cpp/helloworld/` at commit `c697b01`. Commands assume a Unix-like shell.

## Prerequisites

- A C++ toolchain and either Bazel or CMake, per `BUILDING.md` in the repository.
- The Protocol Buffers compiler `protoc` and the gRPC C++ plugin (built as part of the gRPC build).
- For other languages, install gRPC through that language's package manager, as the README describes under "To start using gRPC".

## Install

For most languages the entry point is the package manager rather than a source build. The language quickstarts list the exact command for each (<https://grpc.io/docs/languages/>). To build the C-core and the C++ tooling from source:

```bash
git clone https://github.com/grpc/grpc
cd grpc
git submodule update --init
```

## A first working setup

The shortest path that runs is the C++ Hello World: define a service, generate stubs, then run a server and a client.

Step 1, define the service in a `.proto` file. The example IDL is `examples/protos/helloworld.proto:24`:

```text
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
```

Step 2, generate the stubs by running `protoc` with the gRPC C++ plugin over that `.proto`. This produces a `Greeter::Stub` for clients and a `Greeter::Service` base for servers.

Step 3, start a server. It adds a listening port, registers the service, and assembles the server (`examples/cpp/helloworld/greeter_server.cc:66`):

```text
builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
builder.RegisterService(&service);
std::unique_ptr<Server> server(builder.BuildAndStart());
```

Step 4, call it from a client. Create a channel, build a stub, and invoke the method (`examples/cpp/helloworld/greeter_client.cc:88`, `:46`, `:63`):

```text
GreeterClient greeter(
    grpc::CreateChannel(target_str, grpc::InsecureChannelCredentials()));
// stub_ = Greeter::NewStub(channel);
Status status = stub_->SayHello(&context, request, &reply);
```

## Verify it works

Run the generated server, then run the client against its address. The client prints the reply it received from `SayHello`. If the call returns an `OK` status and the expected greeting, the channel, stub, and server are wired correctly.

## Where to go next

The per-language quickstarts cover the other languages and the full build steps (<https://grpc.io/docs/languages/>), and `BUILDING.md` covers the Bazel and CMake builds. For production concerns such as transport security, load balancing through xDS, and deadlines, follow the official documentation rather than the insecure credentials used in this example.
