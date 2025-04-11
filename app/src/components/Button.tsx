interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
}

function Button({ children, onClick, size = "medium" }: Props) {
  const textSize =
    size === "small" ? "text-sm" : size === "medium" ? "text-lg" : "text-2xl";
  const CSS = `rounded-md bg-secondary text-neutral ${textSize} rounded-md
  px-3 py-2 shadow-md/25 hover:text-accent hover:underline`;

  return (
    <button className={CSS} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
