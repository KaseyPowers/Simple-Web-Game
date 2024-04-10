"use client";

import { useRouter } from "next/navigation";
import SubmitInput from "~/components/submit_input";

export default function JoinRoomField() {
  const router = useRouter();
  return (
    <SubmitInput
      submitBtn="Join"
      label="Join a game room"
      placeholder="Room Code"
      onSubmit={(roomId) => {
        router.push(`/${roomId}`);
      }}
    />
  );
}
