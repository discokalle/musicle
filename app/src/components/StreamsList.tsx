import StreamsListItem from "./StreamsListItem";

// interface Props {
//   items: {}[];
// }

function StreamsList() {
  // will load data from connected service here later
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
    </>
  );
}

export default StreamsList;
