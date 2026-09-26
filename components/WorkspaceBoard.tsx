"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { deleteWorkspace, moveWorkspace } from "@/actions/workspace";
import { useFetch } from "@/hooks/use-fetch";
import type { WorkspaceStatus } from "@/lib/generated/prisma/enums";
import { WorkspaceDialog } from "@/components/WorkspaceDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type BoardWorkspace = {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  position: number;
};

const COLUMNS: { status: WorkspaceStatus; title: string }[] = [
  { status: "PLANNING", title: "Planning" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "IN_REVIEW", title: "In review" },
  { status: "DONE", title: "Done" },
];

function columnItems(workspaces: BoardWorkspace[], status: WorkspaceStatus) {
  return workspaces.filter((w) => w.status === status).sort((a, b) => a.position - b.position);
}

// Midpoint between the new neighbors, so only the dropped card needs saving.
function positionBetween(before?: BoardWorkspace, after?: BoardWorkspace) {
  if (before && after) return (before.position + after.position) / 2;
  if (before) return before.position + 1;
  if (after) return after.position - 1;
  return 0;
}

export function WorkspaceBoard({ workspaces }: { workspaces: BoardWorkspace[] }) {
  const [items, setItems] = useState(workspaces);

  // Re-sync when the server sends a fresh list (e.g. after creating a workspace).
  const [prevWorkspaces, setPrevWorkspaces] = useState(workspaces);
  if (workspaces !== prevWorkspaces) {
    setPrevWorkspaces(workspaces);
    setItems(workspaces);
  }

  // `selected` outlives the open flag, so dialog text doesn't blank out during the close animation.
  const [selected, setSelected] = useState<BoardWorkspace | null>(null);
  const [openDialog, setOpenDialog] = useState<"edit" | "delete" | null>(null);
  const { fn: deleteWorkspaceFn, loading: isDeleting } = useFetch(deleteWorkspace);

  const openFor = (workspace: BoardWorkspace, dialog: "edit" | "delete") => {
    setSelected(workspace);
    setOpenDialog(dialog);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    // Keep the dialog open until the delete finishes (AlertDialogAction closes it by default).
    e.preventDefault();
    if (!selected) return;
    await deleteWorkspaceFn(selected.id);
    setOpenDialog(null);
  };

  const handleDragEnd = async ({ draggableId, source, destination }: DropResult) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const status = destination.droppableId as WorkspaceStatus;
    const target = columnItems(items, status).filter((w) => w.id !== draggableId);
    const position = positionBetween(target[destination.index - 1], target[destination.index]);

    const previous = items;
    setItems(items.map((w) => (w.id === draggableId ? { ...w, status, position } : w)));

    try {
      await moveWorkspace(draggableId, status, position);
    } catch {
      setItems(previous);
      toast.error("Couldn't move workspace");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnWorkspaces = columnItems(items, column.status);
          return (
            <div key={column.status} className="flex flex-col rounded-xl border border-white/8 bg-white/2">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2 text-sm font-medium">
                {column.title}
                <span className="text-xs text-muted-foreground">{columnWorkspaces.length}</span>
              </div>
              <Droppable droppableId={column.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex min-h-40 flex-1 flex-col gap-2 rounded-b-xl p-3 transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    {columnWorkspaces.map((workspace, index) => (
                      <Draggable key={workspace.id} draggableId={workspace.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`group relative flex h-32 flex-col gap-1.5 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 ${
                              snapshot.isDragging ? "border-primary/50 shadow-lg shadow-black/40" : "border-white/10"
                            }`}
                          >
                            {/* after:inset-0 stretches the link over the whole card, so the menu
                                button can sit on top without being nested inside the link. */}
                            <Link
                              href={`/workspace/${workspace.id}`}
                              draggable={false}
                              className="pr-8 text-sm font-medium after:absolute after:inset-0"
                            >
                              {workspace.name}
                            </Link>
                            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                              {workspace.description || "No description"}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Workspace options"
                                  className="absolute top-2 right-2 size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => openFor(workspace, "edit")}>
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onSelect={() => openFor(workspace, "delete")}>
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>

      {selected && (
        <WorkspaceDialog
          workspace={selected}
          open={openDialog === "edit"}
          onOpenChange={(open) => !open && setOpenDialog(null)}
        />
      )}

      <AlertDialog open={openDialog === "delete"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{selected?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the workspace, including its doc and canvas. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={!!isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DragDropContext>
  );
}
