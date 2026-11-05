/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="rank-num text-[120px] font-bold">404</p>
      <img src="/img/mascot.png" alt="" className="mt-2 size-28 rounded-3xl object-cover opacity-90" />
      <h1 className="font-display mt-6 text-2xl font-bold">Ye page gayab ho gaya 👻</h1>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-mute">
        Shayad koi curse isse kha gaya. Tension nahi — catalog mein aur bhi bahut kuch hai.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="btn-primary focus-ring rounded-full px-6 py-2.5 text-sm font-extrabold text-white">
          Ghar Chalo
        </Link>
        <Link href="/browse" className="focus-ring glass rounded-full px-6 py-2.5 text-sm font-bold text-fg">
          Discover
        </Link>
      </div>
    </div>
  );
}