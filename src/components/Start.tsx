import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import sdk from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";

const RevLink = ({ network, id, text }: { network: string; id: number; text: string }) => {
  return (
    <span>
      $<Link href={`/${network}/${id}`} className="text-lightPurple underline hover:text-lightPurple/70">
        {text}
      </Link>
    </span>
  );
};

const Pipe = () => {
  return <div className="text-zinc-300">{" | "}</div>;
}

export default function Page() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  return (
    <div className="container mt-40 text-notWhite">
      <div className="flex flex-col items-left justify-left">
        <Image
          src="/assets/img/revnet-white.svg"
          width={840}
          height={240}
          alt="Revnet logo"
        />
        <span className="sr-only">Revnet</span>
        <div className="text-2xl md:text-2xl mt-8 font-medium text-left">
        Unstoppable funding machines for growth-oriented projects on the open internet
        </div>
        <div className="flex flex-col text-lightPurple md:flex-row items-start md:items-center gap-4 ">
          <div className="flex gap-4 mt-8">
            <Link href="/create">
              <Button className="md:h-12 text-lightPurple h-16 text-xl md:text-xl px-4 flex gap-2 bg-deepPink hover:bg-deepPink">
                Design yours
              </Button>
            </Link>
          </div>
          <div className="flex flex-row mt-8 text-xl text-lightPurple md:text-xl text-left gap-1 overflow-scroll whitespace-nowrap">
            <span className="mr-1">Browse:</span>
            <RevLink network="sepolia" id={1} text="NANA" />
            <Pipe />
            <RevLink network="sepolia" id={2} text="REV" />
            <Pipe />
            <RevLink network="sepolia" id={3} text="BAN" />
            <Pipe />
            <RevLink network="sepolia" id={4} text="CPN" />
          </div>
        </div>
      </div>
      <div className="border border-zinc-100 mt-20"></div>

      <div className="mt-8 max-w-prose text-l md:text-2xl text-lg text-left">
        {/* <p className="text-xl">
        Made for creators, developers, communities, investors, and customers.
        </p> */}
        <p className="text-xl">
        Simple enough for startups, powerful enough for decentralized global orgs and brands.
        </p>

        <p className="text-xl">
        Read the memo at {" "}
          <Link
            href="https://rev.eth.sucks/memo"
            target="_blank"
            rel="noopener norefererr"
            className="underline"
          >
            rev.eth.sucks/memo
          </Link>.
        </p>
        <div className="flex">
          <div className="mt-8 bg-darkPurple text-fontRed text-lg">
        Plan your revnet with the community <Link href="https://discord.gg/vhVxwh8aD9" className="underline hover:text-black/70">on Discord.
            </Link>
          </div>
        </div>
        <div className="flex">
          <div className="mt-8 bg-darkPurple text-fontRed text-lg">
        Audit this website and the revnet protocol <Link href="https://github.com/orgs/rev-net/repositories" className="underline hover:text-black/70">
                on Github.
            </Link>
          </div>
        </div>
        <div className="flex mb-40">
          <div className="mt-8 bg-darkPurple text-fontRed text-lg">
        Support the $REV network <Link href="https://revnet.app/sepolia/3" className="underline hover:text-black/70">
                here,
            </Link>{" "}we run as a revnet ourselves.
          </div>
        </div>
      </div>
    </div>
  );
}