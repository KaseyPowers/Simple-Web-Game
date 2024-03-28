"use client";

import { useRouter } from "next/navigation";
import socket from "~/game_logic/socket_io/client";

import Button from "~/components/button";
import SubmitInput from "~/components/submit_input";

export default function LandingPage() {
  const router = useRouter();

  // send create_room event, socket context will redirect when complete
  const onCreate = () => {
    socket.emit("create_room");
  };

  return (
    <div className="container mx-auto pt-4 sm:px-4 lg:px-8">
      <div className="mx-auto flex w-2/3 flex-col items-center justify-center gap-4">
        <div>Landing Page: Explain how it works</div>
        <div>TODO: Card styles?</div>
        <Button onClick={onCreate}>Create Room</Button>
        <span>Note: update with better styles as chat is improved </span>
        <SubmitInput
          submitBtn="Join"
          label="Join a game room"
          placeholder="Room Code"
          onSubmit={(roomId) => {
            router.push(`/${roomId}`);
          }}
        />
      </div>
    </div>
  );
}
