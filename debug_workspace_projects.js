
const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workspace = "welding-hqci3";

const url = `https://api.roboflow.com/${workspace}?api_key=${apiKey}`;

console.log("Fetching workspace projects...");

async function run() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.workspace && data.workspace.projects) {
            console.log(`Found ${data.workspace.projects.length} projects.`);
            data.workspace.projects.forEach(p => {
                console.log(`\nProject ID: ${p.id}`);
                console.log(`Name: ${p.name}`);
                console.log(`Classes:`, p.classes ? Object.keys(p.classes) : "None");
            });
        } else {
            console.log("No projects found in workspace structure:", Object.keys(data));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
