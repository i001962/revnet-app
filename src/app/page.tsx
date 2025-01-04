"use client";

import dynamic from "next/dynamic";

const Start = dynamic(() => import("../components/Start"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col p-4">
      <Start />
    </main>
  );
}