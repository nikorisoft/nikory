import PhotoSwipeLightbox from "./photoswipe-lightbox.esm.min.js";
import PhotoSwipe from "./photoswipe.esm.min.js";

export function initGallery(id) {
    const lb = new PhotoSwipeLightbox({
        pswpModule: PhotoSwipe,
        gallery: `#${id}`,
        children: ".gallery-item",
    });

    lb.init();
}
