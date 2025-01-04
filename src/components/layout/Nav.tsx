import { ConnectKitButton } from "@/components/ConnectKitButton";
import Image from "next/image";
import Link from "next/link";
import { ChainBadge } from "../ChainBadge";

export function Nav() {
  return (
    <nav className="text-teal-500 border-b border-zinc-100">
      <div className="flex justify-between items-center px-4 sm:container py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="italic">
            <Image
              src="/assets/img/revnet-full.png"
              width={100}
              height={100}
              alt="Revnet logo"
            />
          </Link>
        </div>
        <ConnectKitButton />
      </div>
    </nav>
  );
}
