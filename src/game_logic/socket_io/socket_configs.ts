import { type ManagerOptions, type SocketOptions } from "socket.io-client";

export const socketPath = "/api/socket";
// exporting this seperately to use for testing when path is different
// defining the partial object input that io expects (had to check src code of socket.io-client)
export const baseClientOptions: Partial<ManagerOptions & SocketOptions> = {
  path: socketPath,
  // autoconnect false to connect in provider logic
  autoConnect: false,
};
