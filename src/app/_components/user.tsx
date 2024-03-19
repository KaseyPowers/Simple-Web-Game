import Link from "next/link";
import Image from "next/image";

import { getServerAuthSession } from "~/server/auth";

// TODO: Replace Link with button link component if we make one
export default async function User() {
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
