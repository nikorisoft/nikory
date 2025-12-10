// @ts-check
import FullScreen from "./lg-fullscreen.es5.js";
import Rotate from "./lg-rotate.es5.js";
import Zoom from "./lg-zoom.es5.js";
import lightGallery from "./lightgallery.es5.js";

export function initGalleries() {
    const divs = document.querySelectorAll(".lg-gallery");

    for (const d of divs) {
        lightGallery(d, {
            plugins: [Zoom, Rotate, FullScreen],
            subHtmlSelectorRelative: true,
        });
    }
}
