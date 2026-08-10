export const EDITOR_TOUR_EVENT = "crema:editor-tour:start";

export type EditorTourStepId =
  | "add-content"
  | "properties"
  | "preview"
  | "send-test"
  | "save";

export function startEditorTour(stepId: EditorTourStepId = "add-content") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ stepId: EditorTourStepId }>(EDITOR_TOUR_EVENT, {
      detail: { stepId },
    }),
  );
}
