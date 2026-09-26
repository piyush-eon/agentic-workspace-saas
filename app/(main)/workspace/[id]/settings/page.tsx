export default async function WorkspaceSettingsPage({
  params,
}: PageProps<"/workspace/[id]/settings">) {
  const { id } = await params;
  return <div className="p-8">Settings: workspace {id}</div>;
}
