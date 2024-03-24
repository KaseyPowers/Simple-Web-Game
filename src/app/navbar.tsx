import { DisplayUser } from "~/components/user";
import Button from "~/components/button";

import { getServerAuthSession } from "~/server/auth";

async function NavUser() {
  const session = await getServerAuthSession();
  const sessionButton = (
    <Button.Link href={session ? "/api/auth/signout" : "/api/auth/signin"}>
      {session ? "Sign out" : "Sign in"}
    </Button.Link>
  );
  return session ? (
    <DisplayUser user={session.user} extra={sessionButton} />
  ) : (
    sessionButton
  );
}

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky w-full border-b border-gray-200">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between p-4">
          <div>Simple Web Game (but a cool logo)</div>
          <NavUser />
        </div>
      </nav>
      <main className="flex-auto">{children}</main>
    </>
  );
}
