"use server";

import { getServerAuthSession } from "~/server/auth";
import { SocketIOProvider } from "./socket_context";
import React from "react";

export async function ServerSocketIOProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  return <SocketIOProvider session={session}>{children}</SocketIOProvider>;
}
