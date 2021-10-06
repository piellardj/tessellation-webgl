function downloadTextFile(fileName: string, content: string): void {
    const fileType = "text/plain";

    const blob = new Blob([content], { type: fileType });

    if (typeof window.navigator !== "undefined" && typeof window.navigator.msSaveBlob !== "undefined") { // for IE
        window.navigator.msSaveBlob(blob, fileName);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = fileName;
        linkElement.href = objectUrl;
        linkElement.dataset.downloadurl = `${fileType}:${linkElement.download}:${linkElement.href}`;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        // don't forget to free the objectURL after a few seconds
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 5000);
    }
}

function getQueryStringValue(name: string): string | null {
    if (typeof URLSearchParams !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    if (window.location.search.length > 0) {
        const search = window.location.search.slice(1); // remove leading "?"
        const words = search.split("&");
        for (const word of words) {
            const wantedPrefix = `${name}=`;
            if (word.indexOf(wantedPrefix) === 0) {
                const rawValue = word.substring(wantedPrefix.length);
                return decodeURIComponent(rawValue);
            }
        }
    }

    return null;
}

function setQueryStringValue(name: string, value: string | null): void {
    if (typeof URLSearchParams !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (value === null) {
            params.delete(name);
        } else {
            params.set(name, value);
        }
        window.location.search = params.toString();
    }
}

export {
    downloadTextFile,
    getQueryStringValue,
    setQueryStringValue,
};
