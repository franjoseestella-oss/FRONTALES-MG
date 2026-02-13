
const apiKey = "K6YHioHqtuwbsNmR2n7O"; // from .env.local
const workspace = "welding-hqci3";
const workflowId = "frontalmg";

// 1x1 pixel JPEG base64
const minImage = "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAHP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP/sV/9k=";

async function run() {
    const url = `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflowId}`;

    console.log("Testing workflow:", url);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                inputs: {
                    image: { type: "base64", value: minImage }
                }
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("FULL JSON STRUCTURE:");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
