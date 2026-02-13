
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workspace = "welding-hqci3";
const workflowId = "frontalmg";

// Small white pixel base64
const rawBase64 = "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAHP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP/sV/9k=";
const dataUri = `data:image/jpeg;base64,${rawBase64}`;

async function testVariant(name, payload, useQueryParam = false) {
    let url = `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflowId}`;
    if (useQueryParam) url += `?api_key=${apiKey}`;

    console.log(`\n--- Testing ${name} ---`);
    console.log("URL:", url);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        try {
            const json = JSON.parse(text);
            if (response.status === 200) {
                console.log("SUCCESS!");
                console.log("Keys:", Object.keys(json));
                return true;
            } else {
                console.log("Error JSON:", JSON.stringify(json, null, 2).substring(0, 300));
            }
        } catch {
            console.log("Response Text:", text.substring(0, 300));
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
    return false;
}

async function run() {
    // Variant 1: Base64 raw, API key in body (Standard SDK behavior?)
    await testVariant("Variant 1: Type 'base64', Raw String, Body Key", {
        api_key: apiKey,
        inputs: { image: { type: "base64", value: rawBase64 } }
    });

    // Variant 2: Base64 raw, API key in URL not body
    await testVariant("Variant 2: Type 'base64', Raw String, Query Key", {
        inputs: { image: { type: "base64", value: rawBase64 } }
    }, true);

    // Variant 3: Type 'url' with Data URI, Body Key
    await testVariant("Variant 3: Type 'url', Data URI, Body Key", {
        api_key: apiKey,
        inputs: { image: { type: "url", value: dataUri } }
    });

    // Variant 4: Type 'base64' with Data URI, Body Key (Common format confusion)
    await testVariant("Variant 4: Type 'base64', Data URI, Body Key", {
        api_key: apiKey,
        inputs: { image: { type: "base64", value: dataUri } }
    });
}

run();
