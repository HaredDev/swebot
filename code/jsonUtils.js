function deepEqual(obj1, obj2) {
    // Check if both objects are the same reference
    if (obj1 === obj2) {
        return true;
    }

    // Check if both objects are null or undefined
    if (obj1 == null || obj2 == null) {
        return false;
    }

    // Check if both objects are of the same type
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    }

    // Check if the number of keys is the same
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Check if all properties are deeply equal
    for (const key of keys1) {
        if (!deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

function mergeObjects(obj1, obj2) {
    const merged = { ...obj1 };

    for (const key in obj2) {
        if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
            merged[key] = obj2[key];
        }
    }

    return merged;
}

function checkAndMergeJSON(obj1, obj2) {
    if (deepEqual(obj1, obj2)) {
        console.log("The JSON objects are the same.");
        return JSON.stringify(obj1);
    } else {
        console.log("The JSON objects are different. Merging...");
        const merged = mergeObjects(obj1, obj2);
        return JSON.stringify(merged);
    }
}

module.exports = { checkAndMergeJSON };