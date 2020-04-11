import { AppProps } from 'next/app';

import '../styles/_app.css';

export default function CustomApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
