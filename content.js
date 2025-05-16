(async () => {
    const { getFromStorage, setToStorage } = await import(browser.runtime.getURL('utils/storage.js'));

    const { page_urls = [], deletedPages = {} } = await getFromStorage(['page_urls', 'deletedPages']);

    // Normalize URLs: strip query parameters
    const cleanedUrls = page_urls.map(u => u.split('?')[0]);

    console.log("MetaPriv Plugin: Watching for posts from", cleanedUrls.length, "pages");
    console.log("potato chips");
    console.log(cleanedUrls);

    // Set to track deleted page names (just for logging)
    const deletedPagesSet = [];

    // Helper function to process each post card
    async function processPostDiv(postDiv) {
        const pageLink = postDiv.querySelector('a.x1i10hfl.xjbqb8w.x1ejq31n.xd10rxx.x1sy0etr.x17r0tee.x972fbf.xcfux6l.x1qhh985.xm0m39n.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.xggy1nq.x1a2a7pz.xkrqix3.x1sur9pj.xzsf02u.x1s688f');

        if (pageLink) {
            const pageURLRaw = pageLink.href;
            const pageURL = pageURLRaw.split('?')[0]; // Clean URL
            const pageNameElement = pageLink.querySelector('strong span');
            const pageName = pageNameElement ? pageNameElement.textContent.trim() : "(No name found)";

            console.log(`Found post from: ${pageName}: (${pageURL})`);

            // Match against cleaned watch list
            if (cleanedUrls.includes(pageURL)) {
                console.log(`Deleting watched page post from: ${pageName} (${pageURL})`);
                postDiv.remove();

                const now = new Date().toISOString();

                // Initialize if new
                if (!deletedPages[pageName]) {
                    deletedPages[pageName] = {
                        numberOfTimes: 1,
                        when: [now],
                        url: pageURL
                    };
                } else {
                    deletedPages[pageName].numberOfTimes += 1;
                    deletedPages[pageName].when.push(now);
                }

                // Save updated record
                await setToStorage({ deletedPages });

                deletedPagesSet.push(pageName);
                console.log("Deleted pages so far:", Array.from(deletedPagesSet));
            }
        }
    }

    // Set up MutationObserver on the main feed
    const mainFeed = document.querySelector('div[role="main"]');

    if (mainFeed) {
        console.log("Main feed container found. Setting up observer.");

        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Directly check the node
                            if (node.matches('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd')) {
                                processPostDiv(node);
                            } else {
                                // Check inside the node for post divs
                                const postDivs = node.querySelectorAll('div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd');
                                postDivs.forEach(processPostDiv);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(mainFeed, { childList: true, subtree: true });
        console.log("Observer is now active on the Facebook main feed.");
    } else {
        console.warn("Main feed container not found on this page.");
    }
})();
