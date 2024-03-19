import Link from "next/link";
import Image from "next/image";

import { getServerAuthSession } from "~/server/auth";

// TODO: Replace Link with button link component if we make one
async function User() {
  const session = await getServerAuthSession();

  return (
    <div className="flex flex-row items-center gap-4">
      {session?.user?.image && (
        <Image
          className="rounded-full"
          src={session.user.image}
          width={90}
          height={90}
          alt="User Profile Photo"
        />
      )}
      {session && <div>{session.user?.name}</div>}
      <Link
        href={session ? "/api/auth/signout" : "/api/auth/signin"}
        className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      >
        {session ? "Sign out" : "Sign in"}
      </Link>
    </div>
  );
}

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="sticky w-full border-b border-gray-200">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between p-4">
          <div>Simple Web Game (but a cool logo)</div>
          <User />
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
