import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

function List({ children, className }: Props) {
  return (
    <>
      <ul className={`${className} list-group space-y-2`}>{children}</ul>
    </>
  );
}

export default List;
