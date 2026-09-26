export default async function SharedPage({ params }: PageProps<"/shared/[token]">) {
  const { token } = await params;
  return <div className="p-8">Shared read-only view — token {token}</div>;
}
