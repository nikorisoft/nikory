import PhotoSwipeLightbox from "./photoswipe-lightbox.esm.js";

document.addEventListener("DOMContentLoaded", () => {
    const lightbox = new PhotoSwipeLightbox({
        gallery: ".gallery",
        children: "a",
        pswpModule: () => import("./photoswipe.esm.js"),
    });

    lightbox.on("uiRegister", function () {
        lightbox.pswp.ui.registerElement({
            name: "custom-caption",
            order: 9,
            isButton: false,
            appendTo: "root",
            html: "Caption text",
            onInit: (el, pswp) => {
                lightbox.pswp.on("change", () => {
                    const currSlideElement = lightbox.pswp.currSlide.data.element;
                    let captionHTML = "";
                    if (currSlideElement) {
                        // get caption from alt attribute
                        const caption = currSlideElement.querySelector(".caption");
                        if (caption) {
                            captionHTML = caption.innerHTML;
                        } else {
                            captionHTML = currSlideElement.querySelector("img").getAttribute("alt");
                        }
                    }
                    el.innerHTML = captionHTML || "";
                });
            },
        });
    });

    lightbox.init();
});
