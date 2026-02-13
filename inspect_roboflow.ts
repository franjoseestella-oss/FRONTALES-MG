
import https from 'https';

const apiKey = "K6YHioHqtuwbsNmR2n7O";
const workspace = "welding-hqci3";

const url = `https://api.roboflow.com/${workspace}?api_key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const info = JSON.parse(data);
            if (info.workspace && info.workspace.projects) {
                info.workspace.projects.forEach((p: any) => {
                    console.log(`Project: ${p.id} (${p.name})`);
                    const classes = p.classes ? Object.keys(p.classes) : [];
                    console.log(`Classes: ${JSON.stringify(classes)}`);
                });
            } else {
                console.log("No projects found or different structure:", Object.keys(info));
            }
        } catch (e) {
            console.log("Error parsing:", e);
        }
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
