import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-success-foreground/90",
          actionButton:
            "group-[.toast]:bg-success-foreground group-[.toast]:text-success",
          cancelButton:
            "group-[.toast]:bg-success-foreground/10 group-[.toast]:text-success-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
