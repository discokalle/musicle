type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
};

function Button({ children, className, onClick, size = "medium" }: Props) {
  const textSize =
    size === "small" ? "text-sm" : size === "medium" ? "text-lg" : "text-2xl";
  const CSS = `${className} ${textSize} rounded-md bg-secondary text-neutral 
                rounded-md px-3 py-2 shadow-md/50 hover:text-accent hover:underline 
                hover:shadow-sm/50 transition-all duration-250 ease-in-out cursor-pointer`;

  return (
    <button className={CSS} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
