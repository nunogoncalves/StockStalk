const print = (str) => console.log(str);

const zip = (a, b) => a.map((k, i) => [k, b[i]]);

const chunkArray = (arr, size) =>
    arr.length > size
    ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
    : [arr];

const yyyyMMddFormatted = (date) => date.toLocaleDateString("en-CA")

const elementById = (id) => document.getElementById(id)
const elementsByClass = (name) => [...document.getElementsByClassName(name)]
const elementsByQuery = (name) => [...document.querySelectorAll(name)]
const removeClass = (name, from) => from.classList.remove(name)
const addClass = (name, to) => to.classList.add(name)
const show = (element) => element.style.display = "block"
const hide = (element) => element.style.display = "none"

