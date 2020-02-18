import Server from './lib/Server';

const start = async () => {
  const server = Server.instance;

  await server.start();
};

start().catch(console.error);
