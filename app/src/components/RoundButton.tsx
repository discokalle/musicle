type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
};

function RoundButton({ children, onClick, size = "medium" }: Props) {
  const sizeClasses = {
    small: { wh: "w-10 h-10", text: "text-sm" },
    medium: { wh: "w-13 h-13", text: "text-md" },
    large: { wh: "w-16 h-16", text: "text-lg" },
  };

  const sizeClass = sizeClasses[size];

  const CSS = `bg-secondary text-neutral ${sizeClass.text} ${sizeClass.wh} 
                rounded-full p-3 shadow-md/75
                hover:text-accent hover:hover:shadow-sm/100
                transition-all duration-250 ease-in-out`;

  return (
    <button className={CSS} onClick={onClick}>
      {children}
    </button>
  );
}

export default RoundButton;
