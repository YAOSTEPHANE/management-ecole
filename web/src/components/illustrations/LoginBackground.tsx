import Image from 'next/image';

const LOGIN_BACKGROUND_IMAGE = '/home/split-campus.jpg';

export default function LoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <Image
        src={LOGIN_BACKGROUND_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-stone-950/55" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/35 via-stone-900/25 to-stone-950/65" />
    </div>
  );
}
