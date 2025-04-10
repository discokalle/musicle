import { useState, useEffect } from "react";

import StreamsListItem from "./StreamsListItem";

function StreamsList() {
  // const exApiUrl = "https://jsonplaceholder.typicode.com/users"; // example API
  // const [exData, setExData] = useState([]);

  // const fetchExData = () => {
  //   return fetch(exApiUrl)
  //     .then((res) => res.json())
  //     .then((d) => setExData(d));
  // };

  // useEffect(() => {
  //   fetchExData();
  // }, []);

  const items = [
    {
      songName: "Bada Bastu",
      artistName: "Kardu253",
      albumName: "Teal Album 2500",
    },
    {
      songName: "Morning sun",
      artistName: "Isaha123",
      albumName: "Green Album",
    },
  ];

  return (
    <>
      {items.length === 0 && <p>No item found</p>}
      <ul className="list-group space-y-2">
        {items.map((item, index) => (
          <StreamsListItem {...item} key={index}></StreamsListItem>
        ))}
      </ul>
      {/* <div>
        {exData.map((exDataItem, index) => {
          return <div>{exDataItem.name}</div>;
        })}
      </div> */}
    </>
  );
}

export default StreamsList;
