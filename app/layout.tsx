import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoteSpace — Vote on Anything with Friends",
  description:
    "Create polls on any topic, share a 6-char code with friends, and reveal live results together. Single, multiple, ranked, or yes/no.",
  keywords: ["voting", "polls", "friends", "vote", "decision"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
