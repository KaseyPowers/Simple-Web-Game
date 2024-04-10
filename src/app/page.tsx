import { getServerAuthSession } from "~/server/auth";

import CreateRoomButton from "~/components/landing_page/create_room";
import JoinRoomField from "~/components/landing_page/join_room";

export default async function LandingPage() {
  const session = await getServerAuthSession();

  return (
    <div className="container mx-auto pt-4 sm:px-4 lg:px-8">
      <div className="mx-auto flex w-2/3 flex-col items-center justify-center gap-4">
        <div>Landing Page: Explain how it works</div>
        <div>TODO: Card styles?</div>
        {session ? (
          <>
            <CreateRoomButton />
            <JoinRoomField />
          </>
        ) : (
          <div>Log in to start playing!</div>
        )}
      </div>
    </div>
  );
}
