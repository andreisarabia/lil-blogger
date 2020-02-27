import Server from './lib/Server';

const start = async () => {
  const server = Server.instance;

  await server.setup();
  server.start();
};

start().catch(console.error);
