import Image from 'next/image';

export default function HomePage() {
  return (
    <main>
      <Image src="/logo.svg" alt="Pain2Gain logo" width={217} height={40} />
      <h1>Pain2Gain</h1>
      <p>Welcome to Pain2Gain</p>
    </main>
  );
}
