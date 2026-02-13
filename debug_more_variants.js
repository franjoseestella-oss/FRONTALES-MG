
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workspace = "welding-hqci3";
const workflowId = "frontalmg";

const rawBase64 = "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAHP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP/sV/9k=";

async function run() {
    let url = `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflowId}`;

    // VARIANT 5: Nested input object but simpler
    const payload = {
        api_key: apiKey,
        inputs: {
            // Sometimes it's not nested? No, workflows require specific input names
            "image": { "type": "base64", "value": rawBase64 }
        }
    };

    console.log("Testing strict raw base64 (Variant 1 again basically):");
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const json = await response.json();
        console.log("Status:", response.status);
        console.log("Res:", JSON.stringify(json, null, 2));
    } catch (e) { console.error(e); }

    // VARIANT 6: URL Encoded Data URI with type 'url'
    // Make sure we are sending 'image/jpeg'
    const dataUri = `data:image/jpeg;base64,${rawBase64}`;
    const p2 = {
        api_key: apiKey,
        inputs: {
            "image": { "type": "url", "value": dataUri }
        }
    };

    console.log("\nTesting Data URL exactly:");
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p2)
        });
        const json = await response.json();
        console.log("Status:", response.status);
        console.log("Res:", JSON.stringify(json, null, 2));
    } catch (e) { console.error(e); }
}

run();
