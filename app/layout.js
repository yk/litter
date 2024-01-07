// import Providers from "./providers";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Litter",
  description: "The latent social network",
};

export default function RootLayout({ children, params: { session } }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <Providers session={session}>{children}</Providers> */}
        {children}
      </body>
    </html>
  );
}
