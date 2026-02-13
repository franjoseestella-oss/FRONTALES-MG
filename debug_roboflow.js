
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workflowId = "detect-count-and-visualize-6";
const workspace = "welding-hqci3";
// Use a welding related image if possible, or a generic one. 
// Using a generic one might not yield detections but will show the JSON structure.
const imageUrl = "https://media.roboflow.com/quickstart/aerial_drone.jpg";

const url = `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflowId}?api_key=${apiKey}`;

console.log("Calling URL:", url);

async function run() {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                inputs: {
                    image: { type: "url", value: imageUrl }
                }
            })
        });
        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
