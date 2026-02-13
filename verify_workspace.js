
const apiKey = "K6YHioHqtuwbsNmR2n7O"; // from .env.local
const workspace = "welding-hqci3";

const url = `https://api.roboflow.com/${workspace}?api_key=${apiKey}`;

console.log("Calling URL:", url);

async function run() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
