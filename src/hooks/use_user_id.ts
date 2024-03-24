import { useSession } from "next-auth/react";

export default function useUserId() {
  const session = useSession();
  return session?.data?.user?.id;
}
