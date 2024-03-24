import Image from "next/image";

import { UserCircleIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import React from "react";

export interface DisplayUserData {
  id: string;
  name?: string | null | undefined;
  image?: string | null | undefined;
  me?: boolean;
}

const avatarClasses = {
  // the common classes
  base: "rounded border-2",
  // classes by size (assuming we need more than one for contexts)
  size: {
    sm: "size-7",
    default: "h-10 w-10",
    lg: "h-20 w-20",
  },
};

type AvatarSizes = keyof (typeof avatarClasses)["size"];
export interface AvatarProps {
  user: DisplayUserData;
  alt?: string;
  size?: AvatarSizes;
}

export function Avatar({
  user,
  alt = "User Profile Photo",
  size,
}: AvatarProps) {
  const className = clsx(
    avatarClasses.base,
    size ? avatarClasses.size[size] : avatarClasses.size.default,
  );
  return user.image ? (
    <Image
      className={className}
      src={user.image}
      width={40}
      height={40}
      alt={alt}
    />
  ) : (
    <UserCircleIcon className={className} />
  );
}

export interface DisplayUserProps {
  user: DisplayUserData;
  showMe?: boolean | "replace" | "append";
  avatarProps?: {
    alt?: string;
    iconDefault?: boolean;
    size?: AvatarSizes;
  };
  extra?: React.ReactNode;
}

export function DisplayUser({
  user,
  showMe,
  avatarProps,
  extra,
}: DisplayUserProps) {
  let avatar = null;
  const { iconDefault = true, ...avatarRest } = avatarProps ?? {};
  if (user.image ?? iconDefault) {
    avatar = <Avatar user={user} {...avatarRest} />;
  }

  let name = user.name ?? user.id;
  if (showMe && user.me) {
    if (showMe === "append") {
      name += " (Me)";
    } else {
      name = "Me";
    }
  }
  return (
    <div className="flex flex-row items-center gap-4">
      {avatar}
      {name && <div>{name}</div>}
      {extra}
    </div>
  );
}
