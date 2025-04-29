export default function swDev() {
  let swDev = `${import.meta.env.BASE_URL}sw.js`;
  navigator.serviceWorker.register(swDev).then((res) => {
    console.warn("response", res);
  });
}