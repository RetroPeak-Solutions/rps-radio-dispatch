import { useToast, type ToastType } from "@context/ToastProvider";

type colors = "yellow" | "blue" | "purple" | "green" | "red" | "orange" | "white";

export default function Badge({
  color,
  content,
  mask,
  selectable,
  icon,
  iconPos,
}: {
  color?: colors;
  content: string;
  mask?: boolean;
  selectable?: boolean;
  icon?: any;
  iconPos?: "left" | "right" | null | undefined;
}) {
  const { toast } = useToast(); // ✅ hook at top level

  function getStatusColor(color?: colors) {
    switch (color) {
      case "yellow":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "blue":
        return "bg-[#3C83F61A] border-[#3C83F61A] text-[#3C83F6]";
      case "purple":
        return "bg-purple-100 border-purple-800 text-purple-800 dark:bg-purple-900 dark:border-purple-400 dark:text-purple-300";
      case "green":
        return "bg-[#3cf6641A] border-[#3cf6641A] text-[#3cf664]";
      case "red":
        return "bg-[#f63c3c1a] border-[#f63c3c1a] text-[#f63c3c]";
      case "orange":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "white":
        return "bg-white text-slate-800 dark:bg-white dark:text-grey-300";
      default:
        return "bg-grey-100 text-grey-800 dark:bg-grey-900 dark:text-grey-300";
    }
  }

  async function copyToClipboard(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(content);
      toast("Copied to clipboard!", { type: "success", autoClose: true, autoCloseTime: 5, closable: true, showProgress: true });
    } catch {
      toast("Failed to copy", { type: "error", autoClose: true, autoCloseTime: 5, closable: true, showProgress: true });
    }
  }

  return (
    <span
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (selectable) {
          copyToClipboard(e);
        }
      }}
      className={`
        inline-flex items-center gap-1 border
        ${getStatusColor(color)}
        text-sm font-medium mr-2 px-2.5 py-0.5 rounded
        ${selectable ? "cursor-pointer hover:bg-opacity-80" : "select-none"}
        ${mask ? "blur-sm hover:blur-none transition-[filter] duration-300 ease-out" : ""}
      `}
    >

      {icon && iconPos === "left" && (
        {icon}
      )}
      {content ?? "UNKNOWN"}
      {icon && iconPos === "right" && (
        {icon}
      )}

      {selectable && (
        <button
          onClick={copyToClipboard}
          aria-label="Copy to clipboard"
          className="cursor-pointer ml-1 opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16h8m-6-4h6M9 4h6a2 2 0 012 2v2H7V6a2 2 0 012-2zm-2 6h10v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
