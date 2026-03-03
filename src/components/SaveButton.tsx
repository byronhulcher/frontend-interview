import { Button } from "@/components/ui/button"

interface SaveButtonProps {
  unsavedChangesCount: number
  handleSave: () => void
}

export function SaveButton({
  unsavedChangesCount,
  handleSave,
}: SaveButtonProps) {
  return (
    <Button disabled={unsavedChangesCount === 0} onClick={handleSave}>
      Save {unsavedChangesCount} change
      {unsavedChangesCount !== 1 ? "s" : ""}
    </Button>
  )
}
