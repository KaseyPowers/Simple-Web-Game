"use client";
import { socketEmit } from "~/socket_io/client_utils";

import Button from "~/components/button";

export default function CreateRoomButton() {
  // send create_room event, socket context will redirect when complete
  const onCreate = () => {
    void socketEmit("create_room");
  };

  return <Button onClick={onCreate}>Create Room</Button>;
}
