const print = (str) => console.log(str);

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const chunkArray = (arr, size) =>
    arr.length > size
    ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
    : [arr];
