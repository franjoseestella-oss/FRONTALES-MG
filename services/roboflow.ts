
const API_URL = "https://serverless.roboflow.com";
const API_KEY = "K6YHioHqtuwbsNmR2n7O";
const WORKSPACE_NAME = "welding-hqci3";
const WORKFLOW_ID = "detect-count-and-visualize-5";

export interface RoboflowDetection {
    class: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: any;
}

export interface RoboflowWorkflowResponse {
    outputs: Array<{
        [key: string]: any;
    }>;
    [key: string]: any;
}

export const runRoboflowWorkflow = async (base64Data: string, mimeType: string, imageDims?: { width: number, height: number }) => {
    // Construct the URL for the workflow
    const url = `${API_URL}/infer/workflows/${WORKSPACE_NAME}/${WORKFLOW_ID}?api_key=${API_KEY}&use_cache=true`;

    const payload = {
        inputs: {
            image: {
                type: "base64",
                value: base64Data
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Roboflow API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Roboflow Result:", JSON.stringify(result, null, 2));

        return mapRoboflowResponse(result, imageDims);
    } catch (error) {
        console.error("Error calling Roboflow:", error);
        throw error;
    }
};

// Helper: Recursively find an array of predictions in an arbitrary JSON structure
const findPredictions = (obj: any): any[] => {
    if (!obj || typeof obj !== 'object') return [];

    // Check if current object is an array matching prediction schema
    if (Array.isArray(obj)) {
        if (obj.length > 0 && (obj[0].class || obj[0].detection_id)) {
            return obj;
        }
        // If array of objects, search inside each
        for (const item of obj) {
            const found = findPredictions(item);
            if (found.length > 0) return found;
        }
    }

    // Check known keys first
    if (obj.predictions && Array.isArray(obj.predictions)) {
        // sometimes predictions is an object Wrapper
        return obj.predictions;
    }

    // Recurse through keys
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            // Avoid recursing into huge strings or primitives
            if (typeof val === 'object') {
                // specific check for nested predictions object
                if (key === 'predictions' && val.predictions) return findPredictions(val);

                const found = findPredictions(val);
                if (found.length > 0) return found;
            }
        }
    }

    return [];
};

const mapRoboflowResponse = (data: RoboflowWorkflowResponse, manualDims?: { width: number, height: number }) => {
    let detections: any[] = [];

    // 1. Find the predictions array using robust search
    const predictions = findPredictions(data);

    // 2. Determine Image Dimensions
    // Use manual dims if provided (most reliable for pixel coords), otherwise look in response
    let width = manualDims?.width || 640;
    let height = manualDims?.height || 640;

    // Try to find image dims in response if manual not provided or as fallback
    if (!manualDims && data.inputs?.image?.width) {
        width = data.inputs.image.width;
        height = data.inputs.image.height;
    }

    detections = predictions.map((pred: any) => {
        // Roboflow returns x, y (center), width, height
        let x = pred.x || 0;
        let y = pred.y || 0;
        let w = pred.width || 0;
        let h = pred.height || 0;

        // Heuristic: If coordinates are small (< 2.0), assume Normalized (0-1)
        // If coordinates are large, assume Pixels.
        // This is a heuristic because 1 pixel width is unlikely in a 1.0 normalized sys.
        const isNormalized = (x <= 2 && y <= 2 && w <= 2 && h <= 2);

        let topPct, leftPct, widthPct, heightPct;

        if (isNormalized) {
            leftPct = (x - w / 2) * 100;
            topPct = (y - h / 2) * 100;
            widthPct = w * 100;
            heightPct = h * 100;
        } else {
            // Pixel coordinates -> convert to % based on image dimensions
            leftPct = ((x - w / 2) / width) * 100;
            topPct = ((y - h / 2) / height) * 100;
            widthPct = (w / width) * 100;
            heightPct = (h / height) * 100;
        }

        return {
            label: pred.class || "object",
            confidence: pred.confidence || 0.0,
            bbox: [topPct, leftPct, widthPct, heightPct]
        };
    });

    return {
        detections,
        summary: `Analyzed with Roboflow. Found ${detections.length} objects.`
    };
};
