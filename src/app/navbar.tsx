import User from "~/app/components/user";

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
