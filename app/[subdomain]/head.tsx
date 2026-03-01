export default async function TenantHead({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const resolvedParams = await params;
  const faviconPath = `/${resolvedParams.subdomain}/tenant-favicon`;

  return (
    <>
      <link rel="icon" href={faviconPath} />
      <link rel="shortcut icon" href={faviconPath} />
      <link rel="apple-touch-icon" href={faviconPath} />
      <link rel="preconnect" href="https://res.cloudinary.com" />
      <link rel="dns-prefetch" href="https://res.cloudinary.com" />
    </>
  );
}
