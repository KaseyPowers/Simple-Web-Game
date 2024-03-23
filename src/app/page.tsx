"use client";

import { useRouter } from "next/navigation";
import { useSocketContext } from "~/app/context/room_context";

export default function LandingPage() {
  const router = useRouter();
  const { socket } = useSocketContext();
  // send create_room event, socket context will redirect when complete
  const onCreate = () => {
    socket.emit("create_room");
  };

  const joinRoom = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      roomId: { value: string };
    };
    const roomId = target.roomId.value;
    // instead of emitting, just navigate and let the route logic handle joining
    router.push(`/${roomId}`);
  };

  return (
    <>
      <div>Landing Page</div>
      <button onClick={onCreate}>Create Room</button>
      <form onSubmit={joinRoom}>
        <input type="text" name="roomId" className="text-black" />
        <button type="submit">Join</button>
      </form>
    </>
  );
}
