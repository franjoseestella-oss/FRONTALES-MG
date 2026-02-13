
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workflowId = "detect-count-and-visualize-6";
const workspace = "welding-hqci3";
const imageUrl = "https://media.roboflow.com/quickstart/aerial_drone.jpg";

async function testEndpoint(baseUrl) {
    // URL without API key for body test
    const url = `${baseUrl}/infer/workflows/${workspace}/${workflowId}`;
    console.log(`\nTesting ${baseUrl} (Key in Body)...`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey, // Key in body
                inputs: {
                    image: { type: "url", value: imageUrl }
                }
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

async function inspectApiDotCom() {
    // Re-run the one that gave 200 but error
    const url = `https://api.roboflow.com/infer/workflows/${workspace}/${workflowId}?api_key=${apiKey}`;
    console.log(`\nInspecting api.roboflow.com response...`);
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
        console.log("Status:", response.status);
        console.log("Body:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

async function run() {
    await testEndpoint("https://serverless.roboflow.com");
    await inspectApiDotCom();
}

run();
