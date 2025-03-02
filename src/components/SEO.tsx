import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  schema?: Record<string, unknown> | Record<string, unknown>[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  alternateLanguages?: { lang: string; url: string }[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export function SEO({ 
  title, 
  description, 
  keywords, 
  schema, 
  canonicalUrl,
  ogImage = 'https://ik.imagekit.io/appraisily/appraisily-og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  author = 'Appraisily',
  publishedDate,
  modifiedDate,
  alternateLanguages,
  noIndex = false,
  noFollow = false
}: SEOProps) {
  const metaRobots = [];
  if (noIndex) metaRobots.push('noindex');
  if (noFollow) metaRobots.push('nofollow');
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      {metaRobots.length > 0 && <meta name="robots" content={metaRobots.join(', ')} />}
      {author && <meta name="author" content={author} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Schema.org markup */}
      {schema && Array.isArray(schema) ? schema.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      )) : schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content="Appraisily" />
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <meta name="twitter:site" content="@appraisily" />
      
      {/* Alternate Languages */}
      {alternateLanguages?.map((altLang) => (
        <link 
          key={altLang.lang} 
          rel="alternate" 
          hrefLang={altLang.lang} 
          href={altLang.url} 
        />
      ))}
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#ffffff" />
      
      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <link rel="preconnect" href="https://ik.imagekit.io" />
      <link rel="dns-prefetch" href="https://ik.imagekit.io" />
    </Helmet>
  );
}