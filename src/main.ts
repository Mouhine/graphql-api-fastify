import { createServer } from "./utils/createServer";
import "reflect-metadata";
async function main() {
  const { app, server } = await createServer();
  await server.start();
  app.listen({ port: 4000 });
  console.log("hello world");
}

main();
