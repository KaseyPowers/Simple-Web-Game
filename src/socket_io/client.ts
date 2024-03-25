import { io } from "socket.io-client";
import { baseClientOptions } from "./socket_configs";
import type { ClientSocketType } from "./socket_types";

const socket: ClientSocketType = io(baseClientOptions);

export default socket;
