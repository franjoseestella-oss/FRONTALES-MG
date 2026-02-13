
const apiKey = "K6YHioHqtuwbsNmR2n7O"; // from .env.local
// Project: frontales-mg, Version: 9 (from verify_workspace output)
const modelId = "frontales-mg/9";
const imageUrl = "https://media.roboflow.com/quickstart/aerial_drone.jpg";

const url = `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&image=${encodeURIComponent(imageUrl)}`;

console.log("Calling URL:", url);

async function run() {
    try {
        const response = await fetch(url, {
            method: "POST"
        });
        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
