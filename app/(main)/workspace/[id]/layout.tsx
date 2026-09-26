export default function WorkspaceLayout({ children }: LayoutProps<"/workspace/[id]">) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
