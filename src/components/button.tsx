import clsx from "clsx";
import Link from "next/link";
import React from "react";

export const buttonClasses = {
  base: "px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2",
  defaultColor: "bg-white/10 hover:bg-white/20",
  rounded: "rounded-full",
  primary: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300",
};

function Button({
  className,
  ...props
}: {
  className?: string;
} & React.ComponentPropsWithRef<"button">) {
  return (
    <button
      className={clsx(
        buttonClasses.base,
        buttonClasses.defaultColor,
        buttonClasses.rounded,
        className,
      )}
      {...props}
    />
  );
}

function ButtonLink({
  className,
  ...props
}: { className?: string } & React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={clsx(
        buttonClasses.base,
        buttonClasses.defaultColor,
        buttonClasses.rounded,
        className,
      )}
      {...props}
    />
  );
}

Button.Link = ButtonLink;

export default Button;
