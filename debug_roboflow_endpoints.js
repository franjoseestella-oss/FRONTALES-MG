
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const WORKSPACE_NAME = "welding-hqci3";
const WORKFLOW_ID = "frontalmg";
const workspace = "welding-hqci3";
const imageUrl = "https://media.roboflow.com/quickstart/aerial_drone.jpg";

async function testEndpoint(baseUrl) {
    const url = `${baseUrl}/infer/workflows/${workspace}/${WORKFLOW_ID}`;
    console.log(`\nTesting ${baseUrl}...`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                inputs: {
                    image: { type: "url", value: imageUrl }
                }
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        if (response.status !== 200) {
            console.log("Error Message:", JSON.stringify(data, null, 2));
        } else {
            console.log("Success! Keys found:", Object.keys(data));
            console.log("Output preview:", JSON.stringify(data, null, 2).substring(0, 200));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

async function run() {
    await testEndpoint("https://serverless.roboflow.com");
    await testEndpoint("https://detect.roboflow.com"); // standard inference endpoint
    await testEndpoint("https://api.roboflow.com"); // general api endpoint
}

run();
