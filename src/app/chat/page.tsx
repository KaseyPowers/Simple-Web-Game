import { getServerAuthSession } from "~/server/auth";

import Chat from "~/app/_components/chat";

export default async function ChatPage() {
  const session = await getServerAuthSession();

  return session ? <Chat session={session} /> : <div>Must Log In first</div>;
}
