"use client";
import React from "react";

import { api } from "~/trpc/react";
import useUserId from "~/hooks/use_user_id";

import LoadingIndicator from "./loading_indicator";

import {
  DisplayUser,
  Avatar,
  type DisplayUserProps,
  type AvatarProps,
} from "./user";

export function AvatarById({
  userId,
  ...rest
}: Omit<AvatarProps, "user"> & { userId: string }) {
  const { isLoading, isError, data, error } =
    api.users.playerById.useQuery(userId);

  if (isError) {
    return <div>{error.message}</div>;
  }
  if (isLoading) {
    return <LoadingIndicator />;
  }
  return data ? <Avatar user={data} {...rest} /> : null;
}

export function DisplayUserById({
  userId,
  ...rest
}: Omit<DisplayUserProps, "user"> & { userId: string }) {
  const currentUserId = useUserId();
  const { isLoading, isError, data, error } =
    api.users.playerById.useQuery(userId);

  if (isError) {
    return <div>{error.message}</div>;
  }
  if (isLoading) {
    return <LoadingIndicator />;
  }
  return data ? (
    <DisplayUser user={{ ...data, me: data.id === currentUserId }} {...rest} />
  ) : null;
}
