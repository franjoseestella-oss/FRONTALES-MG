
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workflowId = "detect-count-and-visualize-6";
const workspace = "welding-hqci3";
const imageUrl = "http://images.cocodataset.org/val2017/000000039769.jpg";

async function testEndpoint() {
    const url = `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflowId}`;
    console.log(`\nTesting ${url} (Key in Body)...`);
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
        console.log("Body Key summary:", Object.keys(data));
        // Log a snippet of the outputs to verify structure
        if (data.outputs) {
            console.log("Outputs keys:", data.outputs.map(o => Object.keys(o)));
        } else {
            console.log("Full body:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testEndpoint();
