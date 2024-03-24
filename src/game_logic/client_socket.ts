import { io } from "socket.io-client";

import type { ClientSocketType } from "~/utils/socket_types";

const socket: ClientSocketType = io({
  path: "/api/socket",
  // autoconnect false to connect in provider logic
  autoConnect: false,
});

export default socket;
