import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from '../config/seo';

/**
 * Per-page SEO tags: title, meta description, canonical URL, Open Graph /
 * Twitter Card tags, and optional JSON-LD structured data. Drop one of
 * these near the top of every public page's JSX.
 *
 * `path` should be the route's path (e.g. "/catalog") — used to build the
 * canonical and og:url. `structuredData` accepts a single schema.org object
 * or an array of them (each rendered as its own <script type="application/ld+json">).
 */
const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  const canonicalUrl = `${SITE_URL}${path}`;
  const jsonLdList = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdList.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
