// some stupid workaround because chrome thinks we've scrolled
history.scrollRestoration = "manual";
scrollTo(0, 0);
const mainElem = document.querySelector("main");

const urlElem = document.querySelector("#url");
const pathElem = document.querySelector("#path");
const submitElem = document.querySelector("#submit");

const resultLink = document.querySelector("#result-link");
const returnElem = document.querySelector("#return");

const aboutBtn = document.querySelector("#about-btn");
const backBtn = document.querySelector("#back-btn");

mainElem.addEventListener("touchmove", event => {
    window.scrollTo(0, 0);
    event.preventDefault();
    event.stopPropagation();
}, false);

const maxUrlLength = 22;
const removeSuffixes = [".html", ".php"];
const isHttps = true;
const basePath = "blar.tk/";
const apiPath = "shorten";

let wasValid = false;

if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("/sw.js");
}


const shortenUrl = async (path, dest) => {
    const resp = await fetch(`${apiPath}?${path ? "path=" + path + "&": ""}dest=${dest}`, {method: "POST"});
    const data = await resp.json();

    if(data.errors && data.errors.length && (data.errors.length !== 1 || data.errors[0] !== "dest already exists")){
        throw new Error("Got errors: " + data.errors.join("\n"));
    }

    return data.path;
};

const again = () => {
    urlElem.value = "";
    urlElem.oldValue = undefined;
    pathElem.value = "";

    mainElem.classList.remove("finished");
};

const submit = async () => {
    if(urlElem.value && wasValid){
        const finalUrl = basePath + await shortenUrl(path.value, urlElem.oldValue || urlElem.value);

        mainElem.classList.add("finished");

        resultLink.href = (isHttps ? "https://" : "http://") + finalUrl;
        resultLink.innerText = finalUrl;

        gtag("event", "submit", {event_catergory: "engagement", event_label: "path"});

        // returnElem.focus();
    }
};

// urlElem.addEventListener("input", e => {
// 	const size = (7 - (Math.sqrt(urlElem.value.length)) * 1.8);
// 	e.target.style.fontSize = Math.max(size, 10) + "vw";
// });

urlElem.addEventListener("focus", () => {
    if (urlElem.oldValue) {
        urlElem.value = urlElem.oldValue;
        urlElem.select();
    }
});

urlElem.addEventListener("blur", () => {
    wasValid = urlElem.validity.valid;
    urlElem.oldValue = urlElem.value;

    if(urlElem.validity.valid){
        if (urlElem.value) {
            const url = new URL(urlElem.value);
            let newVal;

            let hostname = url.hostname;

            if(hostname.length > 10 && hostname.startsWith("www.")){
                hostname = hostname.replace("www.", "");
            }

            if(url.pathname === "/" || url.hostname.length > maxUrlLength){
                newVal = `${hostname.slice(0, maxUrlLength)}`;
            }else{
                newVal = `${hostname}/…`;
                let pathname = url.pathname.slice(1);

                for(const removeSuffix of removeSuffixes){
                    if(pathname.endsWith(removeSuffix)){
                        pathname = pathname.slice(0, pathname.lastIndexOf(removeSuffix));
                    }
                }

                if(pathname.charAt(pathname.length - 1) === "/"){
                    pathname = url.pathname.slice(0, -1);
                }

                if(pathname.length + newVal.length <= maxUrlLength){
                    newVal = newVal.slice(0, -1);
                }

                newVal += pathname.slice(-(maxUrlLength - newVal.length));
            }
            urlElem.value = newVal;
        }
    }
});

urlElem.addEventListener("paste", () => {
    setTimeout(() => {
        if(urlElem.validity.valid){
            pathElem.focus();
        }
    }, 0);
});

pathElem.addEventListener("input", e => {
    if(pathElem.value.includes(" ")) pathElem.value = pathElem.value.replace(/ /g, "-");
});

pathElem.addEventListener("keypress", e => {
    if(e.key === "Enter") submit();
});

submitElem.addEventListener("click", submit);

returnElem.addEventListener("click", again);

resultLink.addEventListener("click", e => {
    e.preventDefault();
    navigator.clipboard.writeText(resultLink.href).catch(() => {
        prompt("Copy this text", resultLink.href);
    });
});


addEventListener("beforeunload", () => scrollTo(0, 0));

aboutBtn.addEventListener("click", () => {
    mainElem.classList.add("about");
    aboutBtn.hidden = true;
    backBtn.hidden = false;
});

backBtn.addEventListener("click", () => {
    mainElem.classList.remove("about");
    aboutBtn.hidden = false;
    backBtn.hidden = true;
});
