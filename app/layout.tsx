import type { Metadata } from "next";
import "./globals.css";
import { BackgroundEffect } from "./background";

export const metadata: Metadata = {
  title: "VoteSpace — Vote on Anything with Friends",
  description:
    "Create polls on any topic, share a 6-char code with friends, and reveal live results together. Participant, single, multiple, ranked, or yes/no.",
  keywords: ["voting", "polls", "friends", "vote", "decision", "ieee", "vssut"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-[#05050f]">
        <BackgroundEffect />
        {children}
      </body>
    </html>
  );
}
