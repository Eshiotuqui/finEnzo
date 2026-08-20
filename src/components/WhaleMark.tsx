import { cn } from "@/lib/utils"

/**
 * Símbolo da marca: baleia de perfil, desenhada em `currentColor`.
 * O olho é um furo (fill-rule evenodd), então funciona sobre qualquer fundo.
 */
export function WhaleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {/* esguicho */}
      <path
        d="M22 8.4V5.8M19.5 9.4 18 7.2M24.5 9.4 26 7.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity=".55"
      />
      {/* cauda */}
      <path
        d="M9.8 17 3.6 11.5c-.7-.6-1.8-.1-1.8.8v9.4c0 .9 1.1 1.4 1.8.8L9.8 17Z"
        fill="currentColor"
        opacity=".7"
      />
      {/* corpo com o olho vazado */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29 17a10.6 7.2 0 1 1-21.2 0 10.6 7.2 0 0 1 21.2 0Zm-3.6-1.7a1.3 1.3 0 1 1-2.6 0 1.3 1.3 0 0 1 2.6 0Z"
        fill="currentColor"
      />
      {/* nadadeira */}
      <path
        d="M15.6 22.6c1 1.9 2.7 3 4.8 3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  )
}
