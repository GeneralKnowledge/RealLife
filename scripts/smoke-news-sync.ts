import { syncNewsFromProvider } from "../src/lib/news";

async function main() {
  const first = await syncNewsFromProvider({ force: true });
  console.log("force sync:", JSON.stringify(first, null, 2));

  const second = await syncNewsFromProvider({ force: false });
  console.log("ttl sync:", JSON.stringify(second, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
