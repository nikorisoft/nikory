import "./glightbox.min.js";

document.addEventListener("DOMContentLoaded", () => {
    const lb = GLightbox({
        touchNavigation: true,
        loop: true,
        selector: ".gallery-item",
        skin: "nikory",
    });
});
