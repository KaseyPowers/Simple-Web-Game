import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "~/game_logic/socket_io/socket_types";
import getSocketServer from "~/game_logic/socket_io/server";

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  // means that socket server was already initialised
  if (res.socket.server.io) {
    res.end();
    return;
  }
  console.log("Creating a socketIO Server");
  const io = getSocketServer(res.socket.server);
  res.socket.server.io = io;
  res.end();
}
