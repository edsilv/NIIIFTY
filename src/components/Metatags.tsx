import Head from "next/head";
import { useRouter } from "next/router";
import { site } from "../utils/Config";

export default function Metatags({
  title = "Page title",
  description = "Page description",
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) {
  const router = useRouter();

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description}></meta>
      <meta name="twitter:site" content={site} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || `${site}/opengraph.png`} />
      <meta property="og:url" content={`${site}${router.asPath}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image || `${site}/opengraph.png`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    </Head>
  );
}
