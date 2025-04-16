import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

function List({ children, className }: Props) {
  return (
    <>
      <ul className={`${className} list-group space-y-2`}>
        {React.Children.count(children) > 0 ? (
          children
        ) : (
          <li>No Item Found.</li>
        )}
      </ul>
    </>
  );
}

export default List;
